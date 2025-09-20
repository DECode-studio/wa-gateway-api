import { Module } from '@nestjs/common';
import { AppService } from './service/app.service';
import { AppController } from './controller/app.controller';

const controllers = [
  AppController
]

const providers = [
  AppService
]

@Module({
  imports: [],
  controllers: controllers,
  providers: providers,
})
export class AppModule {}
