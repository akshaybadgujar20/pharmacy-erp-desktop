import type { PrismaClient } from '@prisma/client';
import { faker, gstin, uuid } from '../faker';
import { decimal, register, resolve } from '../id-registry';
import type { SeedContext } from '../seed-context';

const MANUFACTURERS = [
  'Sun Pharma', 'Cipla', 'Dr Reddys', 'Lupin', 'Torrent', 'Glenmark',
  'Abbott', 'Alkem', 'Mankind', 'Zydus', 'Biocon', 'Pfizer India',
  'Micro Labs', 'Intas', 'Emcure', 'Wockhardt', 'Cadila', 'Ranbaxy Legacy',
  'Himalaya', 'Dabur',
];

const MEDICINES: Array<{ name: string; brand: string; hsn: string; dosage: string; schedule: string; category: string }> = [
  { name: 'Paracetamol 650mg Tablet', brand: 'Dolo 650', hsn: '30049099', dosage: 'Tablet', schedule: 'OTC', category: 'GEN' },
  { name: 'Paracetamol 500mg Tablet', brand: 'Crocin Advance', hsn: '30049099', dosage: 'Tablet', schedule: 'OTC', category: 'GEN' },
  { name: 'Azithromycin 500mg Tablet', brand: 'Azithral 500', hsn: '30042019', dosage: 'Tablet', schedule: 'H1', category: 'ANT' },
  { name: 'Amoxicillin 500mg Capsule', brand: 'Mox 500', hsn: '30041010', dosage: 'Capsule', schedule: 'H', category: 'ANT' },
  { name: 'Metformin 500mg Tablet', brand: 'Glycomet 500', hsn: '30049099', dosage: 'Tablet', schedule: 'H', category: 'DIA' },
  { name: 'Atorvastatin 10mg Tablet', brand: 'Atorva 10', hsn: '30049099', dosage: 'Tablet', schedule: 'H', category: 'CVS' },
  { name: 'Pantoprazole 40mg Tablet', brand: 'Pan 40', hsn: '30049099', dosage: 'Tablet', schedule: 'H', category: 'GEN' },
  { name: 'Omeprazole 20mg Capsule', brand: 'Omez 20', hsn: '30049099', dosage: 'Capsule', schedule: 'H', category: 'GEN' },
  { name: 'Cetirizine 10mg Tablet', brand: 'Cetriz 10', hsn: '30049099', dosage: 'Tablet', schedule: 'OTC', category: 'OTC' },
  { name: 'Diclofenac 50mg Tablet', brand: 'Voveran 50', hsn: '30049099', dosage: 'Tablet', schedule: 'H', category: 'GEN' },
  { name: 'Telmisartan 40mg Tablet', brand: 'Telma 40', hsn: '30049099', dosage: 'Tablet', schedule: 'H', category: 'CVS' },
  { name: 'Amlodipine 5mg Tablet', brand: 'Amlong 5', hsn: '30049099', dosage: 'Tablet', schedule: 'H', category: 'CVS' },
  { name: 'Salbutamol Inhaler', brand: 'Asthalin', hsn: '30049099', dosage: 'Inhaler', schedule: 'H', category: 'GEN' },
  { name: 'Montelukast 10mg Tablet', brand: 'Montair 10', hsn: '30049099', dosage: 'Tablet', schedule: 'H', category: 'GEN' },
  { name: 'Clopidogrel 75mg Tablet', brand: 'Clopilet 75', hsn: '30049099', dosage: 'Tablet', schedule: 'H', category: 'CVS' },
  { name: 'Levocetirizine 5mg Tablet', brand: 'Levocet 5', hsn: '30049099', dosage: 'Tablet', schedule: 'OTC', category: 'OTC' },
  { name: 'Rabeprazole 20mg Tablet', brand: 'Razo 20', hsn: '30049099', dosage: 'Tablet', schedule: 'H', category: 'GEN' },
  { name: 'Cefixime 200mg Tablet', brand: 'Taxim O 200', hsn: '30042019', dosage: 'Tablet', schedule: 'H1', category: 'ANT' },
  { name: 'Levofloxacin 500mg Tablet', brand: 'Levoflox 500', hsn: '30042019', dosage: 'Tablet', schedule: 'H1', category: 'ANT' },
  { name: 'Metoprolol 50mg Tablet', brand: 'Betaloc 50', hsn: '30049099', dosage: 'Tablet', schedule: 'H', category: 'CVS' },
];

const SCHEDULE_MAP: Record<string, string> = {
  OTC: '99999999-9999-4999-8999-999999999901',
  H: '99999999-9999-4999-8999-999999999902',
  H1: '99999999-9999-4999-8999-999999999903',
};

const CATEGORY_MAP: Record<string, string> = {
  GEN: '88888888-8888-4888-8888-888888888801',
  ANT: '88888888-8888-4888-8888-888888888802',
  CVS: '88888888-8888-4888-8888-888888888803',
  DIA: '88888888-8888-4888-8888-888888888804',
  OTC: '88888888-8888-4888-8888-888888888805',
};

const TAB_UNIT = '77777777-7777-4777-8777-777777777701';
const SALT_UUIDS = [
  'ffffffff-ffff-4fff-8fff-fffffffffff01',
  'ffffffff-ffff-4fff-8fff-fffffffffff02',
  'ffffffff-ffff-4fff-8fff-fffffffffff03',
  'ffffffff-ffff-4fff-8fff-fffffffffff04',
  'ffffffff-ffff-4fff-8fff-fffffffffff05',
  'ffffffff-ffff-4fff-8fff-fffffffffff06',
  'ffffffff-ffff-4fff-8fff-fffffffffff07',
  'ffffffff-ffff-4fff-8fff-fffffffffff08',
  'ffffffff-ffff-4fff-8fff-fffffffffff09',
  'ffffffff-ffff-4fff-8fff-fffffffffff10',
];

export async function seedMedicine(prisma: PrismaClient, ctx: SeedContext): Promise<void> {
  const manufacturerIds: bigint[] = [];

  for (let i = 0; i < MANUFACTURERS.length; i++) {
    const name = MANUFACTURERS[i]!;
    const partyUuid = uuid();
    const party = await prisma.party.create({
      data: {
        uuid: partyUuid,
        partyType: 'ORGANIZATION',
        displayName: name,
        organizationName: name,
        isActive: true,
      },
    });
    register('Party', partyUuid, party.id);

    await prisma.partyRole.create({
      data: { uuid: uuid(), partyId: party.id, roleType: 'OTHER', isPrimary: true, isActive: true },
    });

    const mfg = await prisma.manufacturer.create({
      data: {
        uuid: uuid(),
        partyId: party.id,
        manufacturerCode: `MFG-${String(i + 1).padStart(3, '0')}`,
        gstin: gstin(),
        isPreferred: i < 5,
        isActive: true,
      },
    });
    manufacturerIds.push(mfg.id);
  }

  const medicineList = [...MEDICINES];
  while (medicineList.length < 50) {
    const base = faker.helpers.arrayElement(MEDICINES);
    medicineList.push({
      ...base,
      name: `${base.name} (${medicineList.length + 1})`,
      brand: `${base.brand} Plus`,
    });
  }

  for (let i = 0; i < 50; i++) {
    const med = medicineList[i]!;
    const medUuid = uuid();
    const mrp = faker.number.int({ min: 25, max: 450 });
    const created = await prisma.medicine.create({
      data: {
        uuid: medUuid,
        medicineCode: `MED-${String(i + 1).padStart(5, '0')}`,
        medicineName: med.name,
        manufacturerId: faker.helpers.arrayElement(manufacturerIds),
        categoryId: resolve('MedicineCategory', CATEGORY_MAP[med.category]!),
        scheduleId: resolve('MedicineSchedule', SCHEDULE_MAP[med.schedule]!),
        unitId: resolve('UnitOfMeasure', TAB_UNIT),
        brandName: med.brand,
        dosageForm: med.dosage,
        packSize: '10 tablets',
        hsnCode: med.hsn,
        barcode: faker.string.numeric(13),
        requiresPrescription: med.schedule !== 'OTC',
        isActive: true,
      },
    });
    register('Medicine', medUuid, created.id);
    ctx.medicineRecords.push({ id: created.id, uuid: medUuid, unitId: created.unitId, mrp: decimal(mrp) });

    if (i < SALT_UUIDS.length) {
      await prisma.medicineSalt.create({
        data: {
          uuid: uuid(),
          medicineId: created.id,
          saltCompositionId: resolve('SaltComposition', SALT_UUIDS[i]!),
          sequenceNo: 1,
        },
      });
    }
  }

  let batchSeq = 1;
  for (let i = 0; i < 100; i++) {
    const medicine = faker.helpers.arrayElement(ctx.medicineRecords);
    const purchaseRate = faker.number.int({ min: 10, max: 300 });
    const mrp = purchaseRate + faker.number.int({ min: 5, max: 80 });
    const expiryMonths = faker.number.int({ min: 3, max: 36 });
    const batchUuid = uuid();
    const batch = await prisma.batch.create({
      data: {
        uuid: batchUuid,
        medicineId: medicine.id,
        batchNumber: `B${String(batchSeq++).padStart(6, '0')}`,
        manufacturingDate: faker.date.past({ years: 1 }),
        expiryDate: faker.date.soon({ days: expiryMonths * 30 }),
        purchaseRate: decimal(purchaseRate),
        mrp: decimal(mrp),
        isActive: true,
      },
    });
    ctx.batchRecords.push({
      id: batch.id,
      uuid: batchUuid,
      medicineId: medicine.id,
      batchNumber: batch.batchNumber,
      expiryDate: batch.expiryDate,
      purchaseRate: decimal(purchaseRate),
      mrp: decimal(mrp),
    });
  }
}

export async function seedPricing(prisma: PrismaClient, ctx: SeedContext): Promise<void> {
  const effectiveFrom = new Date('2024-04-01');
  const defaultTaxId = ctx.taxIds[0];

  for (let i = 0; i < ctx.branchRecords.length; i++) {
    const branch = ctx.branchRecords[i]!;
    const plUuid = `20202020-2020-4202-8202-2020202020${String(i + 1).padStart(2, '0')}`;
    const priceList = await prisma.priceList.create({
      data: {
        uuid: plUuid,
        priceListCode: `PL-${branch.branchCode}`,
        priceListName: `${branch.branchCode} Retail Price List`,
        branchId: branch.id,
        priceListType: 'RETAIL',
        effectiveFrom,
        isDefault: i === 0,
        isActive: true,
      },
    });
    register('PriceList', plUuid, priceList.id);
    if (i === 0) ctx.defaultPriceListId = priceList.id;

    for (const medicine of ctx.medicineRecords) {
      const mrpNum = Number(medicine.mrp);
      const selling = mrpNum * faker.number.float({ min: 0.85, max: 0.98 });
      await prisma.priceListItem.create({
        data: {
          uuid: uuid(),
          priceListId: priceList.id,
          medicineId: medicine.id,
          sellingPrice: decimal(selling),
          mrp: medicine.mrp,
          taxId: defaultTaxId,
          effectiveFrom,
          isActive: true,
        },
      });
      if (i === 0) {
        ctx.priceListItems.set(String(medicine.id), {
          medicineId: medicine.id,
          sellingPrice: decimal(selling),
          mrp: medicine.mrp,
          taxId: defaultTaxId,
        });
      }
    }
  }

  for (let i = 0; i < 20; i++) {
    const medicine = faker.helpers.arrayElement(ctx.medicineRecords);
    await prisma.discountRule.create({
      data: {
        uuid: uuid(),
        ruleCode: `DISC-${String(i + 1).padStart(3, '0')}`,
        ruleName: `Bulk discount ${i + 1}`,
        discountType: i % 2 === 0 ? 'PERCENT' : 'FLAT',
        discountValue: decimal(i % 2 === 0 ? faker.number.int({ min: 2, max: 15 }) : faker.number.int({ min: 5, max: 50 })),
        appliesTo: i % 3 === 0 ? 'MEDICINE' : i % 3 === 1 ? 'CATEGORY' : 'CUSTOMER',
        medicineId: i % 3 === 0 ? medicine.id : undefined,
        minimumQuantity: i % 2 === 0 ? decimal(faker.number.int({ min: 2, max: 10 })) : undefined,
        priority: i + 1,
        effectiveFrom,
        isActive: true,
      },
    });
  }
}
