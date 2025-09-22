import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule, WhatsappModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
