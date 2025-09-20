import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import * as QRCode from 'qrcode';
import { SendMessageDto } from 'src/model/request/whatsapp.dto';
import { httpBadRequest } from 'src/model/response/http';

@Injectable()
export class WhatsappService {
    private readonly logger = new Logger(WhatsappService.name);
    private sessions: Map<string, Client> = new Map();

    constructor(private prisma: PrismaService) { }

    async getSession(sessionName: string) {
        return this.prisma.waSession.findUnique({ where: { sessionName } });
    }

    async listSessions() {
        return this.prisma.waSession.findMany();
    }

    async qrSignIn(sessionName: string) {
        if (this.sessions.has(sessionName)) {
            throw new Error(`session ${sessionName} already exists`);
        }

        const client = new Client({
            authStrategy: new LocalAuth({ clientId: sessionName }),
            puppeteer: { headless: true },
        });

        const qrPromise = new Promise<string>((resolve) => {
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
        }).catch((e) => {
            throw new Error(e?.response?.data?.message || 'bad request');
        });

        client.on('ready', async () => {
            this.logger.log(`Client ${sessionName} is ready`);
            await this.prisma.waSession.update({
                where: { sessionName },
                data: { status: 'connected', qrCode: null },
            });

            throw new Error(`client ${sessionName} is ready`);
        });

        client.on('disconnected', async (reason) => {
            this.logger.warn(`Client ${sessionName} disconnected: ${reason}`);
            await this.prisma.waSession.update({
                where: { sessionName },
                data: { status: 'disconnected', lastError: reason },
            });
            this.sessions.delete(sessionName);
        });

        await client.initialize();
        this.sessions.set(sessionName, client);

        const qrCodeBase64 = await qrPromise;
        return {
            sessionName,
            qrCode: qrCodeBase64,
        };
    }

    async signOut(sessionName: string) {
        const client = this.sessions.get(sessionName);
        if (client) {
            await client.destroy();
            this.sessions.delete(sessionName);
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

        const client = this.sessions.get(sessionName);
        if (!client) {
            throw new Error(`session ${sessionName} not found`);
        }

        const chatId = to.includes('@c.us') ? to : `${to}@c.us`;

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
}
