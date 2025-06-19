import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../../src/app.module';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DATABASE_HOST,
          port: +(process.env.DATABASE_PORT || 5432),
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
    jwtService = moduleFixture.get<JwtService>(JwtService);
    await app.init();

    // Create admin user
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
      });
    const admin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'password123' });
    adminToken = admin.body.accessToken;

    // Update role to admin manually
    await moduleFixture.get('UserRepository').update({ email: 'admin@example.com' }, { role: 'admin' });

    // Create regular user
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Regular User',
        email: 'user@example.com',
        password: 'password123',
      });
    const user = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'password123' });
    userToken = user.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/users (GET) should list users for admin', async () => {
    const response = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('/users (GET) should fail for non-admin', async () => {
    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('/users/:id (PATCH) should update own profile for user', async () => {
    const response = await request(app.getHttpServer())
      .patch('/users/2')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Updated User' })
      .expect(200);

    expect(response.body.name).toBe('Updated User');
  });

  it('/users/inactive (GET) should list inactive users for admin', async () => {
    await request(app.getHttpServer())
      .get('/users/inactive')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });
});