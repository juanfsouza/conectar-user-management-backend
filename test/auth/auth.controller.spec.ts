import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DATABASE_HOST,
          port: +(process.env.DATABASE_PORT ?? 5432),
          username: process.env.DATABASE_USER,
          password: process.env.DATABASE_PASSWORD,
          database: process.env.DATABASE_NAME,
          autoLoadEntities: true,
          synchronize: true,
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/register (POST) should register a new user', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe('test@example.com');
    expect(response.body.role).toBe('user');
  });

  it('/auth/login (POST) should login a user and return a token', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Test User',
        email: 'login@example.com',
        password: 'password123',
    })
    .expect(201);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'login@example.com',
        password: 'password123',
      })
      .expect(200);

    expect(response.body).toHaveProperty('accessToken');
    expect(typeof response.body.accessToken).toBe('string');
  });

  it('/auth/login (POST) should fail with invalid credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'login@example.com',
        password: 'wrongpassword',
      })
      .expect(401);

    expect(response.body.message).toBe('Invalid credentials');
  });
});