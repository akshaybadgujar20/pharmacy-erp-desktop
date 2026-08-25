import { ValidationPipe } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { PartyType } from '../src/party/constants/party.constants';
import { CustomerType } from '../src/party/constants/party.constants';
import { SupplierType } from '../src/party/constants/party.constants';
import { PartyRoleType } from '../src/party/constants/party.constants';
import { AddressType } from '../src/party/constants/party.constants';
import { ContactType } from '../src/party/constants/party.constants';

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  error?: { code: string; message: string };
}

const TEST_MARKER = 'E2E_PARTY_TEST';

describe('Party Management (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let accessToken: string;
  const createdPartyIds: bigint[] = [];
  const createdCustomerIds: bigint[] = [];
  const createdSupplierIds: bigint[] = [];
  const createdDoctorIds: bigint[] = [];
  const createdEmployeeIds: bigint[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    const passwordHash = bcrypt.hashSync('admin123', 10);
    await prisma.client.user.updateMany({
      data: {
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    await prisma.client.customer.deleteMany({
      where: { customerCode: { contains: TEST_MARKER } },
    });
    await prisma.client.supplier.deleteMany({
      where: { supplierCode: { contains: TEST_MARKER } },
    });
    await prisma.client.doctor.deleteMany({
      where: { doctorCode: { contains: TEST_MARKER } },
    });
    await prisma.client.employee.deleteMany({
      where: { employeeCode: { contains: TEST_MARKER } },
    });
    const staleParties = await prisma.client.party.findMany({
      where: { displayName: { contains: TEST_MARKER } },
      select: { id: true },
    });
    for (const party of staleParties) {
      await prisma.client.partyRole.deleteMany({
        where: { partyId: party.id },
      });
      await prisma.client.partyAddress.deleteMany({
        where: { partyId: party.id },
      });
      await prisma.client.partyContact.deleteMany({
        where: { partyId: party.id },
      });
      await prisma.client.party.deleteMany({ where: { id: party.id } });
    }

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'admin123' })
      .expect(201);

    const loginBody = loginResponse.body as ApiEnvelope<{
      accessToken: string;
    }>;
    accessToken = loginBody.data?.accessToken ?? '';
  });

  afterAll(async () => {
    for (const id of createdCustomerIds) {
      await prisma.client.customer.deleteMany({ where: { id } });
    }
    for (const id of createdSupplierIds) {
      await prisma.client.supplier.deleteMany({ where: { id } });
    }
    for (const id of createdDoctorIds) {
      await prisma.client.doctor.deleteMany({ where: { id } });
    }
    for (const id of createdEmployeeIds) {
      await prisma.client.employee.deleteMany({ where: { id } });
    }
    for (const id of createdPartyIds) {
      await prisma.client.partyRole.deleteMany({ where: { partyId: id } });
      await prisma.client.partyAddress.deleteMany({ where: { partyId: id } });
      await prisma.client.partyContact.deleteMany({ where: { partyId: id } });
      await prisma.client.party.deleteMany({ where: { id } });
    }
    await app.close();
  });

  it('GET /parties returns 401 without token', () => {
    return request(app.getHttpServer()).get('/parties').expect(401);
  });

  it('full party lifecycle: create, nested resources, details, update, delete', async () => {
    const createPartyRes = await request(app.getHttpServer())
      .post('/parties')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        partyType: PartyType.ORGANIZATION,
        displayName: `${TEST_MARKER} Acme Pharma`,
        organizationName: `${TEST_MARKER} Acme Pharma`,
      })
      .expect(201);

    const partyBody = createPartyRes.body as ApiEnvelope<{
      id: string;
      version: number;
      displayName: string;
    }>;
    expect(partyBody.success).toBe(true);
    expect(typeof partyBody.data?.id).toBe('string');

    const partyId = partyBody.data?.id ?? '';
    const partyVersion = partyBody.data?.version ?? 1;
    createdPartyIds.push(BigInt(partyId));

    const listRes = await request(app.getHttpServer())
      .get('/parties')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ search: TEST_MARKER })
      .expect(200);

    const listBody = listRes.body as ApiEnvelope<unknown[]>;
    expect(listBody.success).toBe(true);
    expect(listBody.pagination?.total).toBeGreaterThanOrEqual(1);

    const roleRes = await request(app.getHttpServer())
      .post(`/parties/${partyId}/roles`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ roleType: PartyRoleType.CUSTOMER, isPrimary: true })
      .expect(201);

    const roleBody = roleRes.body as ApiEnvelope<{ id: string }>;
    expect(roleBody.success).toBe(true);

    const addressRes = await request(app.getHttpServer())
      .post(`/parties/${partyId}/addresses`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        addressType: AddressType.BILLING,
        addressLine1: '123 Test Street',
        postalCode: '400001',
      })
      .expect(201);

    expect((addressRes.body as ApiEnvelope<unknown>).success).toBe(true);

    const contactRes = await request(app.getHttpServer())
      .post(`/parties/${partyId}/contacts`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        contactType: ContactType.EMAIL,
        contactValue: `${TEST_MARKER}@test.com`,
      })
      .expect(201);

    expect((contactRes.body as ApiEnvelope<unknown>).success).toBe(true);

    const customerRes = await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        partyId,
        customerCode: `${TEST_MARKER}-CUST`,
        customerType: CustomerType.RETAIL,
      })
      .expect(201);

    const customerBody = customerRes.body as ApiEnvelope<{
      id: string;
      version: number;
    }>;
    expect(customerBody.success).toBe(true);
    const customerId = customerBody.data?.id ?? '';
    createdCustomerIds.push(BigInt(customerId));

    const supplierPartyRes = await request(app.getHttpServer())
      .post('/parties')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        partyType: PartyType.ORGANIZATION,
        displayName: `${TEST_MARKER} Supplier Org`,
        organizationName: `${TEST_MARKER} Supplier Org`,
      })
      .expect(201);

    const supplierPartyId =
      (supplierPartyRes.body as ApiEnvelope<{ id: string }>).data?.id ?? '';
    createdPartyIds.push(BigInt(supplierPartyId));

    const supplierRes = await request(app.getHttpServer())
      .post('/suppliers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        partyId: supplierPartyId,
        supplierCode: `${TEST_MARKER}-SUP`,
        supplierType: SupplierType.DISTRIBUTOR,
      })
      .expect(201);

    const supplierId =
      (supplierRes.body as ApiEnvelope<{ id: string }>).data?.id ?? '';
    createdSupplierIds.push(BigInt(supplierId));

    const doctorPartyRes = await request(app.getHttpServer())
      .post('/parties')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        partyType: PartyType.PERSON,
        displayName: `${TEST_MARKER} Dr Smith`,
        firstName: 'John',
        lastName: 'Smith',
      })
      .expect(201);

    const doctorPartyId =
      (doctorPartyRes.body as ApiEnvelope<{ id: string }>).data?.id ?? '';
    createdPartyIds.push(BigInt(doctorPartyId));

    const doctorRes = await request(app.getHttpServer())
      .post('/doctors')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        partyId: doctorPartyId,
        doctorCode: `${TEST_MARKER}-DOC`,
        registrationNumber: `${TEST_MARKER}-REG`,
      })
      .expect(201);

    const doctorId =
      (doctorRes.body as ApiEnvelope<{ id: string }>).data?.id ?? '';
    createdDoctorIds.push(BigInt(doctorId));

    const employeePartyRes = await request(app.getHttpServer())
      .post('/parties')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        partyType: PartyType.PERSON,
        displayName: `${TEST_MARKER} Employee`,
        firstName: 'Jane',
        lastName: 'Doe',
      })
      .expect(201);

    const employeePartyId =
      (employeePartyRes.body as ApiEnvelope<{ id: string }>).data?.id ?? '';
    createdPartyIds.push(BigInt(employeePartyId));

    const employeeRes = await request(app.getHttpServer())
      .post('/employees')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        partyId: employeePartyId,
        employeeCode: `${TEST_MARKER}-EMP`,
        designation: 'Pharmacist',
      })
      .expect(201);

    const employeeId =
      (employeeRes.body as ApiEnvelope<{ id: string }>).data?.id ?? '';
    createdEmployeeIds.push(BigInt(employeeId));

    const getBeforeUpdate = await request(app.getHttpServer())
      .get(`/parties/${partyId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const currentVersion =
      (getBeforeUpdate.body as ApiEnvelope<{ version: number }>).data
        ?.version ?? partyVersion;

    const updateRes = await request(app.getHttpServer())
      .patch(`/parties/${partyId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        version: currentVersion,
        displayName: `${TEST_MARKER} Acme Pharma Updated`,
      })
      .expect(200);

    const updateBody = updateRes.body as ApiEnvelope<{ version: number }>;
    expect(updateBody.data?.version).toBe(currentVersion + 1);

    await request(app.getHttpServer())
      .delete(`/parties/${partyId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ version: updateBody.data?.version })
      .expect(200);

    await request(app.getHttpServer())
      .get(`/parties/${partyId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404)
      .expect((res) => {
        const body = res.body as ApiEnvelope<unknown>;
        expect(body.success).toBe(false);
        expect(body.error?.code).toBe('PARTY_NOT_FOUND');
      });
  });

  it('GET /customers returns 403 for cashier without permission', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'cashier1', password: 'admin123' })
      .expect(201);

    const cashierToken =
      (loginResponse.body as ApiEnvelope<{ accessToken: string }>).data
        ?.accessToken ?? '';

    await request(app.getHttpServer())
      .get('/customers')
      .set('Authorization', `Bearer ${cashierToken}`)
      .expect(403)
      .expect((res) => {
        const body = res.body as ApiEnvelope<unknown>;
        expect(body.error?.code).toBe('AUTH_PERMISSION_DENIED');
      });
  });
});
