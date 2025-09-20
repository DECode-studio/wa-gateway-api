import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import * as QRCode from 'qrcode';
import { SendMessageDto } from 'src/model/request/whatsapp.dto';

@Injectable()
export class WhatsappService {
    private readonly logger = new Logger(WhatsappService.name);
    private sessions: Map<string, Client> = new Map();

    constructor(private prisma: PrismaService) { }

    async qrSignIn(sessionName: string) {
        if (this.sessions.has(sessionName)) {
            return { sessionName, message: 'Session already exists' };
        }

        const client = new Client({
            authStrategy: new LocalAuth({ clientId: sessionName }),
            puppeteer: { headless: true },
        });

        // --- Promise untuk menangkap QR pertama kali ---
        const qrPromise = new Promise<string>((resolve) => {
            client.on('qr', async (qr) => {
                this.logger.debug(`QR RECEIVED for ${sessionName}`);

                // Simpan ke DB
                await this.prisma.waSession.upsert({
                    where: { sessionName },
                    update: { qrCode: qr, status: 'qr' },
                    create: { sessionName, qrCode: qr, status: 'qr' },
                });

                // Generate QR image (base64 PNG)
                const qrImage = await QRCode.toDataURL(qr);

                resolve(qrImage); // kirim balik ke response
            });
        });

        client.on('ready', async () => {
            this.logger.log(`Client ${sessionName} is ready`);
            await this.prisma.waSession.update({
                where: { sessionName },
                data: { status: 'connected', qrCode: null },
            });

            return {
                sessionName,
                message: `Client ${sessionName} is ready`,
            }
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

        // Return QR (base64 image)
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
            return { ok: true };
        }
        return { ok: false, error: 'Session not found' };
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
            throw new Error(`Session ${sessionName} not found`);
        }

        const chatId = to.includes('@c.us') ? to : `${to}@c.us`;

        // Kalau ada media → kirim media
        if (mediaBase64 && mediaMimeType) {
            const media = new MessageMedia(mediaMimeType, mediaBase64, mediaFileName || 'file');
            this.logger.debug(`Sending media to ${chatId}`);
            return client.sendMessage(chatId, media, { caption: message || '' });
        }

        // Kalau text saja
        if (message) {
            this.logger.debug(`Sending text to ${chatId}`);
            return client.sendMessage(chatId, message);
        }

        throw new Error('No message or media provided');
    }

    async getSession(sessionName: string) {
        return this.prisma.waSession.findUnique({ where: { sessionName } });
    }

    async listSessions() {
        return this.prisma.waSession.findMany();
    }
}
