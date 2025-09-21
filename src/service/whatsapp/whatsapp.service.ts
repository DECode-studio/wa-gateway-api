import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import * as QRCode from 'qrcode';
import { SendMessageDto } from 'src/model/request/whatsapp.dto';
import { dateDayTimeFullFormatter } from 'src/utils/formatter/date';
import { delay, getRandomDelay } from 'src/utils/function/delay';

@Injectable()
export class WhatsappService {
    private readonly logger = new Logger(WhatsappService.name);
    // private sessions: Map<string, Client> = new Map();

    constructor(private prisma: PrismaService) { }

    async getSession(sessionName: string) {
        return this.prisma.waSession.findUnique({ where: { sessionName } });
    }

    async listSessions() {
        return this.prisma.waSession.findMany();
    }

    async qrSignIn(sessionName: string) {

        const client = new Client({
            authStrategy: new LocalAuth({ clientId: sessionName }),
            puppeteer: { headless: true },
        });

        const qrPromise = new Promise<string>((
            resolve, reject
        ) => {
            client.on('qr', async (qr) => {
                this.logger.debug(`QR RECEIVED for ${sessionName}`);

                await this.prisma.waSession.upsert({
                    where: { sessionName },
                    update: { qrCode: qr, status: 'qr' },
                    create: { sessionName, qrCode: qr, status: 'qr' },
                });

                const qrImage = await QRCode.toDataURL(qr);
                resolve(qrImage);
            });

            client.on('ready', async () => {
                this.logger.log(`Client ${sessionName} is ready`);
                await this.prisma.waSession.update({
                    where: { sessionName },
                    data: { status: 'connected', qrCode: null },
                });

                reject(new Error(`client ${sessionName} is already connected`));
            });

            client.on('disconnected', async (reason) => {
                this.logger.warn(`Client ${sessionName} disconnected: ${reason}`);
                await this.prisma.waSession.update({
                    where: { sessionName },
                    data: { status: 'disconnected', lastError: reason },
                });

                reject(new Error(`client ${sessionName} disconnected: ${reason}`));
            });
        }).catch((e) => {
            throw new Error(e?.message || 'bad request');
        });

        await client.initialize();
        const qrCodeBase64 = await qrPromise;

        return {
            sessionName,
            qrCode: qrCodeBase64,
        };
    }

    async signOut(
        sessionName: string
    ) {
        const session = await this.prisma.waSession.findFirst({
            where: { sessionName }
        });

        if (!session) {
            throw new Error(`session ${sessionName} not found`);
        }

        if (session.status == 'disconnected') {
            throw new Error(`session ${sessionName} has disconnected`);
        }

        if (session.status == 'signed_out') {
            throw new Error(`session ${sessionName} has signed out`);
        }

        const client = new Client({
            authStrategy: new LocalAuth({ clientId: sessionName }),
            puppeteer: { headless: true },
        });

        if (client) {
            await client.destroy();
            await this.prisma.waSession.update({
                where: { sessionName },
                data: { status: 'signed_out' },
            });

            return;
        }

        throw new Error(`session not found`);
    }

    async send(
        req: SendMessageDto
    ) {
        const {
            sessionName,
            to,
            message,
            mediaBase64,
            mediaMimeType,
            mediaFileName
        } = req

        const session = await this.prisma.waSession.findFirst({
            where: { sessionName }
        });

        if (!session) {
            throw new Error(`session ${sessionName} not found`);
        }

        if (session.status == 'disconnected') {
            throw new Error(`session ${sessionName} has disconnected`);
        }

        if (session.status == 'signed_out') {
            throw new Error(`session ${sessionName} has signed out`);
        }

        const chatId = to.includes('@c.us') ? to : `${to}@c.us`;
        const client = new Client({
            authStrategy: new LocalAuth({ clientId: sessionName }),
            puppeteer: { headless: true },
        });

        if (mediaBase64 && mediaMimeType) {
            const media = new MessageMedia(mediaMimeType, mediaBase64, mediaFileName || 'file');
            this.logger.debug(`Sending media to ${chatId}`);
            return client.sendMessage(chatId, media, { caption: message || '' });
        }

        if (message) {
            this.logger.debug(`Sending text to ${chatId}`);
            return client.sendMessage(chatId, message);
        }

        throw new Error('no message or media provided');
    }

    async sendMass(
        req: SendMessageDto
    ) {
        let {
            sessionName,
            to,
            message,
            mediaBase64,
            mediaMimeType,
            mediaFileName,
            enableTimeNotes
        } = req

        for (const dest of to.split(',')) {
            const now = new Date(Date.now())
            const time = dateDayTimeFullFormatter(now)

            message = (message ?? '').replace(/{{\s*name\s*}}/g, dest.split('|')[1] ?? '');
            const msg = enableTimeNotes ? `${message}\n\nSENDED ON : ${time}` : message

            try {
                await this.send({
                    sessionName,
                    to: dest.split('|')[0],
                    message: msg,
                    mediaBase64,
                    mediaMimeType,
                    mediaFileName
                })
            } catch (error) {
                console.log(`- error send mass message : ${error?.message ?? ''}`);
            }

            const randomDelay = getRandomDelay(30000, 90000);
            await delay(randomDelay);

            console.log(`Delay ${randomDelay / 1000} secon before send to ${dest}`);
        }

        console.log(`- finish send ${to.split(',').length} messages`);
    }
}

