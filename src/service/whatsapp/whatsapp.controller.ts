import { WhatsappService } from './whatsapp.service';
import { SendMessageDto, SignDto } from 'src/model/request/whatsapp.dto';
import { httpBadRequest, httpStatusOk } from 'src/model/response/http';
import {
    Body,
    Controller,
    Post,
    Put,
    Get,
    Param
} from '@nestjs/common';

@Controller('whatsapp')
export class WhatsappController {

    constructor(
        private readonly wa: WhatsappService
    ) { }

    @Get('session/:sessionName')
    async session(
        @Param('sessionName') sessionName: string
    ) {
        try {
            const data = this.wa.getSession(sessionName);
            return httpStatusOk(
                'get session success',
                data
            )
        } catch (error) {
            return httpBadRequest(error?.message)
        }
    }

    @Get('sessions')
    async sessions() {
        try {
            const data = this.wa.listSessions();
            return httpStatusOk(
                'get list session success',
                data
            )
        } catch (error) {
            return httpBadRequest(error?.message)
        }
    }

    @Post('qr-sign-in')
    async qrSignIn(
        @Body() body: SignDto
    ) {
        try {
            const data = await this.wa.qrSignIn(body.sessionName);
            return httpStatusOk(
                'please, connect your whatsapp',
                data
            )
        } catch (error) {
            return httpBadRequest(error?.message)
        }
    }

    @Put('sign-out')
    async signOut(
        @Body() body: SignDto
    ) {
        try {
            const data = await this.wa.signOut(body.sessionName);
            return httpStatusOk(
                'sign out success',
                data
            )
        } catch (error) {
            return httpBadRequest(error?.message)
        }
    }

    @Post('send')
    async send(
        @Body() dto: SendMessageDto
    ) {
        try {
            const data = await this.wa.send(dto);
            return httpStatusOk(
                'send message success',
                data
            )
        } catch (error) {
            return httpBadRequest(error?.message)
        }
    }

    @Post('send-mass')
    async sendMass(
        @Body() dto: SendMessageDto
    ) {
        try {
            this.wa.sendMass(dto);
            return httpStatusOk('message is in progress')
        } catch (error) {
            return httpBadRequest(error?.message)
        }
    }
}
