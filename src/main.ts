import { NestFactory } from '@nestjs/core';
import { AppModule } from './service/app/app.module';
import * as bodyParser from 'body-parser';
import { HttpExceptionFilter } from './middleware/exception.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const PORT = process.env.PORT || 3000;

  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
bootstrap();
