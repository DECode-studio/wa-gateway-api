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
            return httpBadRequest(
                error?.response?.data?.message
            )
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
            return httpBadRequest(
                error?.response?.data?.message
            )
        }
    }

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
            return httpBadRequest(
                error?.response?.data?.message
            )
        }
    }

    @Get('sessions')
    async sessions() {
        return this.wa.listSessions();
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
            return httpBadRequest(
                error?.response?.data?.message
            )
        }
    }
}
