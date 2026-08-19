import type { PrismaClient } from '@prisma/client';
import { faker, gstin, indianMobile, pan, uuid } from '../faker';
import { register, resolve } from '../id-registry';
import type { SeedContext } from '../seed-context';

const CUSTOMER_TYPES = ['RETAIL', 'WHOLESALE', 'CORPORATE'] as const;
const SUPPLIER_TYPES = ['MANUFACTURER', 'DISTRIBUTOR', 'WHOLESALER'] as const;
const INDIAN_FIRST = ['Rajesh', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anita', 'Karthik', 'Deepa', 'Rahul', 'Meera'];
const INDIAN_LAST = ['Patil', 'Shah', 'Desai', 'Rao', 'Iyer', 'Mehta', 'Kulkarni', 'Joshi', 'Nair', 'Reddy'];
const CITY_MAP: Record<string, { city: string; state: string }> = {
  Pune: { city: '33333333-3333-4333-8333-333333333301', state: '22222222-2222-4222-8222-222222222201' },
  Mumbai: { city: '33333333-3333-4333-8333-333333333302', state: '22222222-2222-4222-8222-222222222201' },
  Bengaluru: { city: '33333333-3333-4333-8333-333333333304', state: '22222222-2222-4222-8222-222222222202' },
  Ahmedabad: { city: '33333333-3333-4333-8333-333333333306', state: '22222222-2222-4222-8222-222222222203' },
  Chennai: { city: '33333333-3333-4333-8333-333333333309', state: '22222222-2222-4222-8222-222222222205' },
};
const COUNTRY_UUID = '11111111-1111-4111-8111-111111111101';
const SPECIALIZATIONS = ['General Physician', 'Cardiologist', 'Pediatrician', 'Dermatologist', 'Orthopedic'];

interface PartySpec {
  roleType: 'CUSTOMER' | 'SUPPLIER' | 'DOCTOR' | 'EMPLOYEE';
  count: number;
  orgRatio?: number;
}

const SPECS: PartySpec[] = [
  { roleType: 'CUSTOMER', count: 45, orgRatio: 0.15 },
  { roleType: 'SUPPLIER', count: 15, orgRatio: 1 },
  { roleType: 'DOCTOR', count: 10 },
  { roleType: 'EMPLOYEE', count: 10 },
];

export async function seedParties(prisma: PrismaClient, ctx: SeedContext): Promise<void> {
  let seq = 1;
  for (const spec of SPECS) {
    for (let i = 0; i < spec.count; i++) {
      const isOrg = spec.orgRatio !== undefined && faker.number.float() < spec.orgRatio;
      const first = faker.helpers.arrayElement(INDIAN_FIRST);
      const last = faker.helpers.arrayElement(INDIAN_LAST);
      const displayName = isOrg
        ? `${last} ${spec.roleType === 'SUPPLIER' ? 'Pharma Distributors' : 'Medical Store'}`
        : `${first} ${last}`;
      const partyUuid = uuid();

      const party = await prisma.party.create({
        data: {
          uuid: partyUuid,
          partyType: isOrg ? 'ORGANIZATION' : 'PERSON',
          displayName,
          firstName: isOrg ? undefined : first,
          lastName: isOrg ? undefined : last,
          organizationName: isOrg ? displayName : undefined,
          isActive: true,
        },
      });
      register('Party', partyUuid, party.id);

      const roleUuid = uuid();
      await prisma.partyRole.create({
        data: {
          uuid: roleUuid,
          partyId: party.id,
          roleType: spec.roleType,
          isPrimary: true,
          isActive: true,
        },
      });

      const cityName = faker.helpers.arrayElement(Object.keys(CITY_MAP));
      const geo = CITY_MAP[cityName]!;
      await prisma.partyAddress.create({
        data: {
          uuid: uuid(),
          partyId: party.id,
          addressType: 'REGISTERED',
          addressLine1: `${faker.location.streetAddress()}, ${cityName}`,
          area: cityName,
          cityId: resolve('City', geo.city),
          stateId: resolve('State', geo.state),
          countryId: resolve('Country', COUNTRY_UUID),
          postalCode: faker.location.zipCode('######'),
          isDefault: true,
          isActive: true,
        },
      });

      await prisma.partyContact.create({
        data: {
          uuid: uuid(),
          partyId: party.id,
          contactType: 'MOBILE',
          contactValue: indianMobile(),
          countryCode: '+91',
          isPrimary: true,
          isActive: true,
        },
      });

      if (faker.number.int({ min: 0, max: 1 }) === 1) {
        await prisma.partyContact.create({
          data: {
            uuid: uuid(),
            partyId: party.id,
            contactType: 'EMAIL',
            contactValue: faker.internet.email({ firstName: first, lastName: last }).toLowerCase(),
            isPrimary: false,
            isActive: true,
          },
        });
      }

      const code = `${spec.roleType.slice(0, 3)}-${String(seq).padStart(5, '0')}`;
      seq++;

      if (spec.roleType === 'CUSTOMER') {
        const row = await prisma.customer.create({
          data: {
            uuid: uuid(),
            partyId: party.id,
            customerCode: code,
            customerType: faker.helpers.arrayElement(CUSTOMER_TYPES),
            creditLimit: faker.number.int({ min: 0, max: 50000 }).toFixed(2),
            isActive: true,
          },
        });
        ctx.customerIds.push(row.id);
      } else if (spec.roleType === 'SUPPLIER') {
        const row = await prisma.supplier.create({
          data: {
            uuid: uuid(),
            partyId: party.id,
            supplierCode: code,
            supplierType: faker.helpers.arrayElement(SUPPLIER_TYPES),
            gstin: gstin(),
            drugLicenseNumber: `DL/${faker.string.numeric(4)}/${faker.string.numeric(6)}`,
            panNumber: pan(),
            preferredSupplier: i < 3,
            isActive: true,
          },
        });
        ctx.supplierIds.push(row.id);
      } else if (spec.roleType === 'DOCTOR') {
        const row = await prisma.doctor.create({
          data: {
            uuid: uuid(),
            partyId: party.id,
            doctorCode: code,
            registrationNumber: `MCI/${faker.string.numeric(6)}`,
            qualification: 'MBBS',
            specialization: faker.helpers.arrayElement(SPECIALIZATIONS),
            hospitalName: `${cityName} General Hospital`,
            consultationFee: faker.number.int({ min: 300, max: 1500 }).toFixed(2),
            isActive: true,
          },
        });
        ctx.doctorIds.push(row.id);
      } else {
        const row = await prisma.employee.create({
          data: {
            uuid: uuid(),
            partyId: party.id,
            employeeCode: code,
            designation: i === 0 ? 'Admin' : i < 4 ? 'Pharmacist' : i < 7 ? 'Cashier' : 'Store Manager',
            department: 'Operations',
            joiningDate: faker.date.past({ years: 3 }),
            isPharmacist: i > 0 && i < 4,
            isActive: true,
          },
        });
        ctx.employeeIds.push(row.id);
        ctx.employeeUuids.push(row.uuid);
      }
    }
  }
}
