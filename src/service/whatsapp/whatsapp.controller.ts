import { WhatsappService } from './whatsapp.service';
import { SendMessageDto, SignDto } from 'src/model/request/whatsapp.dto';
import { httpBadRequest, httpStatusOk } from 'src/model/response/http';
import {
    Body,
    Controller,
    Post,
    Put,
    Get,
    Param,
    UseGuards
} from '@nestjs/common';
import { AuthGuard } from 'src/middleware/auth.guard';

@Controller('whatsapp')
export class WhatsappController {

    constructor(
        private readonly wa: WhatsappService
    ) { }

    @UseGuards(AuthGuard)
    @Get('session/:sessionName')
    async session(
        @Param('sessionName') sessionName: string
    ) {
        try {
            const data = await this.wa.getSession(sessionName);
            return httpStatusOk(
                'get session success',
                data
            )
        } catch (error) {
            return httpBadRequest(error?.message)
        }
    }

    @UseGuards(AuthGuard)
    @Get('sessions')
    async sessions() {
        try {
            const data = await this.wa.listSessions();
            return httpStatusOk(
                'get list session success',
                data
            )
        } catch (error) {
            return httpBadRequest(error?.message)
        }
    }

    @UseGuards(AuthGuard)
    @Get('qr-connect/:sessionName')
    async qrConnect(
        @Param('sessionName') sessionName: string
    ) {
        try {
            const data = await this.wa.qrConnect(sessionName);
            return httpStatusOk(
                'get qr connect success',
                data
            )
        } catch (error) {
            return httpBadRequest(error?.message)
        }
    }

    @UseGuards(AuthGuard)
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

    @UseGuards(AuthGuard)
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

    @UseGuards(AuthGuard)
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

    @UseGuards(AuthGuard)
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
