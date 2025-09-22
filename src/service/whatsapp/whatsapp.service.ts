import {
    Injectable,
    Logger,
    OnModuleInit,
    OnModuleDestroy,
} from '@nestjs/common';
import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import * as QRCode from 'qrcode';
import { SendMessageDto } from 'src/model/request/whatsapp.dto';
import { dateDayTimeFullFormatter } from 'src/utils/formatter/date';
import { delay, getRandomDelay } from 'src/utils/function/delay';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class WhatsappService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(WhatsappService.name);
    private sessions: Map<string, Client> = new Map();

    constructor(
        private prisma: PrismaService
    ) { }

    async onModuleInit() {
        this.logger.log('Bootstrapping WhatsApp sessions from DB...');
        try {
            const rows = await this.prisma.waSession.findMany({
                where: {
                    NOT: { status: 'signed_out' },
                },
            });

            for (const row of rows) {
                const sessionName = row.sessionName;
                if (this.sessions.has(sessionName)) continue;

                try {
                    this.logger.log(`Restoring session ${sessionName} ...`);
                    await this.restoreSession(sessionName, row.status);
                } catch (err) {
                    this.logger.warn(
                        `Failed to restore session ${sessionName}: ${err?.message ?? err}`,
                    );
                    await this.prisma.waSession.update({
                        where: { sessionName },
                        data: {
                            status: 'disconnected',
                            lastError: String(err?.message ?? err),
                        },
                    });
                }
            }
        } catch (err) {
            this.logger.error('Error bootstrap sessions: ' + err?.message);
        }
    }

    async onModuleDestroy() {
        this.logger.log('Destroying WhatsApp clients...');
        for (const [name, client] of this.sessions.entries()) {
            try {
                await client.destroy();
            } catch (err) {
                this.logger.warn(
                    `Error destroying client ${name}: ${err?.message ?? err}`,
                );
            }
        }
        this.sessions.clear();
    }

    private async restoreSession(
        sessionName: string,
        prevStatus?: string
    ) {
        if (this.sessions.has(sessionName)) {
            this.logger.debug(`Session ${sessionName} already in memory`);
            return;
        }

        const client = new Client({
            authStrategy: new LocalAuth({ clientId: sessionName }),
            puppeteer: { headless: true },
        });

        client.on('ready', async () => {
            this.logger.log(`Restored client ${sessionName} is ready`);
            await this.prisma.waSession.upsert({
                where: { sessionName },
                update: { status: 'connected', qrCode: null, lastError: null },
                create: { sessionName, status: 'connected' },
            });
        });

        client.on('auth_failure', async (msg) => {
            this.logger.warn(`Auth failure for ${sessionName}: ${msg}`);
            await this.prisma.waSession.update({
                where: { sessionName },
                data: {
                    status: 'disconnected',
                    lastError: `auth_failure: ${String(msg)}`,
                },
            });
            try {
                await client.destroy();
            } catch { }
            this.sessions.delete(sessionName);
        });

        client.on('disconnected', async (reason) => {
            this.logger.warn(`Client ${sessionName} disconnected: ${reason}`);
            await this.prisma.waSession.update({
                where: { sessionName },
                data: { status: 'disconnected', lastError: String(reason) },
            });
            this.sessions.delete(sessionName);
        });

        await client.initialize();
        this.sessions.set(sessionName, client);
        this.logger.log(`Client ${sessionName} initialized and stored in memory`);
    }

    async getSession(
        sessionName: string
    ) {
        const session = await this.prisma.waSession.findFirst({
            where: { sessionName },
        });

        if (!session) {
            throw new Error(`session ${sessionName} not found`);
        }

        return session;
    }

    async listSessions() {
        const data = await this.prisma.waSession.findMany();
        return data;
    }

    async qrConnect(
        sessionName: string
    ) {
        const session = await this.prisma.waSession.findFirst({
            where: { sessionName },
        });

        if (!session) {
            throw new Error(`session ${sessionName} not found`);
        }

        if (session.status == 'disconnected') {
            throw new Error('you are disconnected')
        }

        if (session.status == 'connected') {
            throw new Error('you are already connected')
        }

        const qrImage = await QRCode.toDataURL(session.qrCode ?? '');
        return {
            code: session.qrCode,
            image: qrImage
        }
    }

    async qrSignIn(
        sessionName: string
    ) {
        const inMemory = this.sessions.get(sessionName);
        if (inMemory) {
            const state = await inMemory.getState().catch(() => null);
            if (state === 'CONNECTED') {
                return { sessionName, message: 'already_connected' };
            }
        }

        const client = new Client({
            authStrategy: new LocalAuth({ clientId: sessionName }),
            puppeteer: { headless: true },
        });

        await this.prisma.waSession.upsert({
            where: { sessionName },
            create: { sessionName, status: 'connecting' },
            update: { status: 'connecting' },
        });

        const qrPromise = new Promise<string>(async (resolve, reject) => {
            const cleanupAndReject = async (err: any) => {
                try {
                    await client.destroy();
                } catch { }
                reject(err);
            };

            client.on('qr', async (qr) => {
                try {
                    await this.prisma.waSession.upsert({
                        where: { sessionName },
                        update: { qrCode: qr, status: 'qr' },
                        create: { sessionName, qrCode: qr, status: 'qr' },
                    });

                    const qrImage = await QRCode.toDataURL(qr);
                    resolve(qrImage);
                } catch (err) {
                    cleanupAndReject(err);
                }
            });

            client.on('ready', async () => {
                await this.prisma.waSession.update({
                    where: { sessionName },
                    data: { status: 'connected', qrCode: null, lastError: null },
                });
                this.sessions.set(sessionName, client);
                reject(new Error('client_already_connected'));
            });

            client.on('auth_failure', async (msg) => {
                await this.prisma.waSession.update({
                    where: { sessionName },
                    data: {
                        status: 'disconnected',
                        lastError: `auth_failure: ${String(msg)}`,
                    },
                });
                cleanupAndReject(new Error(`auth_failure: ${String(msg)}`));
            });

            client.on('disconnected', async (reason) => {
                await this.prisma.waSession.update({
                    where: { sessionName },
                    data: { status: 'disconnected', lastError: String(reason) },
                });
                cleanupAndReject(new Error(`disconnected: ${String(reason)}`));
            });
        });

        await client.initialize();

        this.sessions.set(sessionName, client);

        try {
            const qrImageBase64 = await qrPromise;
            return { sessionName, qrCode: qrImageBase64 };
        } catch (err) {
            if (String(err?.message) === 'client_already_connected') {
                return { sessionName, message: 'already_connected' };
            }
            throw err;
        }
    }

    async signOut(
        sessionName: string
    ) {
        const session = await this.prisma.waSession.findUnique({
            where: { sessionName },
        });
        if (!session) throw new Error(`session ${sessionName} not found`);

        const client = this.sessions.get(sessionName);
        if (client) {
            try {
                await client.destroy();
            } catch (err) {
                this.logger.warn(
                    `Error destroying client ${sessionName}: ${err?.message ?? err}`,
                );
            }
            this.sessions.delete(sessionName);
        }

        await this.prisma.waSession.update({
            where: { sessionName },
            data: { status: 'signed_out', qrCode: null, lastError: null },
        });

        return { ok: true };
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
            mediaFileName,
        } = req;

        const client = this.sessions.get(sessionName);
        if (!client)
            throw new Error(`Session ${sessionName} not found or not initialized`);

        const state = await client.getState().catch(() => null);
        if (state !== 'CONNECTED') {
            throw new Error(`Session ${sessionName} is not ready (state: ${state})`);
        }

        const chatId = to.includes('@') ? to : `${to}@c.us`;

        if (mediaBase64 && mediaMimeType) {
            const cleanBase64 = String(mediaBase64)
                .replace(/^data:.*;base64,/, '')
                .replace(/^base64,/, '');
            const media = new MessageMedia(
                mediaMimeType,
                cleanBase64,
                mediaFileName || 'file',
            );
            return client.sendMessage(chatId, media, { caption: message || '' });
        }

        if (message) {
            return client.sendMessage(chatId, message);
        }

        throw new Error('No message or media provided');
    }

    async sendMass(
        req: SendMessageDto
    ) {
        const {
            sessionName,
            to,
            message,
            mediaBase64,
            mediaMimeType,
            mediaFileName,
            enableTimeNotes,
        } = req;

        if (!to) throw new Error('to is required for sendMass');

        const targets = to
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

        for (const dest of targets) {
            const name = dest.split('|')[1] ?? '';
            const target = dest.split('|')[0] ?? dest;
            const time = dateDayTimeFullFormatter(new Date());
            const personalized = (message ?? '').replace(/{{\s*name\s*}}/g, name);
            const finalMsg = enableTimeNotes
                ? `${personalized}\n\nSENDED ON : ${time}`
                : personalized;

            try {
                await this.send({
                    sessionName,
                    to: target,
                    message: finalMsg,
                    mediaBase64,
                    mediaMimeType,
                    mediaFileName,
                });
            } catch (err) {
                this.logger.warn(`Error sending to ${target}: ${err?.message ?? err}`);
            }

            const randomDelay = getRandomDelay(30000, 90000);
            await delay(randomDelay);

            console.log(`delay ${randomDelay / 1000} secon before send to ${dest}`);
        }

        console.log(`- finish send ${to.split(',').length} messages`);
    }
}
