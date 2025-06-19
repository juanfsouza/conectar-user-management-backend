import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppLoggerService } from './common/logger.service';
import * as cors from 'cors';
// import { SeedService } from './seed/seed.service'; // comente se não for usar agora

async function bootstrap() {
  // Captura erros globais fora do try/catch
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err?.message ?? err, err?.stack ?? '');
  });
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
  });

  try {
    const app = await NestFactory.create(AppModule, { logger: new AppLoggerService() });

    app.use(helmet());

    app.use(
      cors({
        origin: 'https://conectar-user-management-b1b826937ac9.herokuapp.com',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
      }),
    );

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    const config = new DocumentBuilder()
      .setTitle('Conéctar User Management API')
      .setDescription('API for user management with authentication and roles')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    // Se for usar o seed, descomente essas linhas:
    // const seedService = app.get(SeedService);
    // await seedService.seedAdmin();

    const port = process.env.PORT || 3000;
    await app.listen(port);

    app.get(AppLoggerService).log(`Application is running on: ${await app.getUrl()}`);
  } catch (error) {
    // Log mais detalhado para o erro no bootstrap
    console.error('Erro na inicialização:', error?.message ?? error, error?.stack ?? '');
    process.exit(1);
  }
}

bootstrap();
