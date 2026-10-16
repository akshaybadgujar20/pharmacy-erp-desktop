import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from 'src/prisma.service';
import {
  ApiEnvelope,
  closeHttpTestApp,
  createHttpTestApp,
  loginAs,
  resetAllUserPasswords,
} from '../support/http-test.helpers';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;

  beforeEach(async () => {
    app = await createHttpTestApp();
    await resetAllUserPasswords(app.get(PrismaService));
    accessToken = await loginAs(app, {
      username: 'admin',
      password: 'admin123',
    });
  });

  afterEach(async () => {
    await closeHttpTestApp(app);
  });

  it('GET /app returns hello in envelope', () => {
    return request(app.getHttpServer())
      .get('/app')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        const body = res.body as ApiEnvelope<string>;
        expect(body.success).toBe(true);
        expect(body.data).toBe('Hello World!');
      });
  });
});
