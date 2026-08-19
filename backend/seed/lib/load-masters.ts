import type { PrismaClient } from '@prisma/client';
import { loadJson } from './load-json';
import { decimal, register, resolve } from './id-registry';
import type { SeedContext } from './seed-context';

type Row = Record<string, unknown>;

export async function loadMasters(prisma: PrismaClient, ctx: SeedContext): Promise<void> {
  await loadGeo(prisma);
  await loadConfiguration(prisma, ctx);
  await loadMedicineRefs(prisma);
  await loadTax(prisma, ctx);
  await loadSecurity(prisma);
}

async function loadGeo(prisma: PrismaClient): Promise<void> {
  for (const row of loadJson<Row>('geo/country.json')) {
    const created = await prisma.country.create({
      data: {
        uuid: row.uuid as string,
        countryCode: row.countryCode as string,
        isoAlpha2: row.isoAlpha2 as string,
        isoAlpha3: row.isoAlpha3 as string,
        countryName: row.countryName as string,
        nationality: row.nationality as string,
        phoneCode: row.phoneCode as string,
        currencyCode: row.currencyCode as string,
        timezone: row.timezone as string,
        isActive: row.isActive as boolean,
      },
    });
    register('Country', row.uuid as string, created.id);
  }

  for (const row of loadJson<Row>('geo/state.json')) {
    const created = await prisma.state.create({
      data: {
        uuid: row.uuid as string,
        countryId: resolve('Country', row.countryUuid as string),
        stateCode: row.stateCode as string,
        stateName: row.stateName as string,
        gstStateCode: row.gstStateCode as string | undefined,
        isoCode: row.isoCode as string | undefined,
        isActive: row.isActive as boolean,
      },
    });
    register('State', row.uuid as string, created.id);
  }

  for (const row of loadJson<Row>('geo/city.json')) {
    const created = await prisma.city.create({
      data: {
        uuid: row.uuid as string,
        stateId: resolve('State', row.stateUuid as string),
        cityCode: row.cityCode as string,
        cityName: row.cityName as string,
        district: row.district as string | undefined,
        postalRegion: row.postalRegion as string | undefined,
        isActive: row.isActive as boolean,
      },
    });
    register('City', row.uuid as string, created.id);
  }

  for (const row of loadJson<Row>('geo/area.json')) {
    const created = await prisma.area.create({
      data: {
        uuid: row.uuid as string,
        cityId: resolve('City', row.cityUuid as string),
        areaCode: row.areaCode as string,
        areaName: row.areaName as string,
        postalCode: row.postalCode as string | undefined,
        deliveryZone: row.deliveryZone as string | undefined,
        isActive: row.isActive as boolean,
      },
    });
    register('Area', row.uuid as string, created.id);
  }
}

async function loadConfiguration(prisma: PrismaClient, ctx: SeedContext): Promise<void> {
  for (const row of loadJson<Row>('configuration/company.json')) {
    const created = await prisma.company.create({
      data: {
        uuid: row.uuid as string,
        companyCode: row.companyCode as string,
        companyName: row.companyName as string,
        displayName: row.displayName as string,
        gstNumber: row.gstNumber as string | undefined,
        panNumber: row.panNumber as string | undefined,
        drugLicenseNumber: row.drugLicenseNumber as string | undefined,
        email: row.email as string | undefined,
        phoneNumber: row.phoneNumber as string | undefined,
        website: row.website as string | undefined,
        addressLine1: row.addressLine1 as string | undefined,
        city: row.city as string | undefined,
        state: row.state as string | undefined,
        country: row.country as string | undefined,
        pinCode: row.pinCode as string | undefined,
        isDefault: row.isDefault as boolean,
        isActive: row.isActive as boolean,
      },
    });
    register('Company', row.uuid as string, created.id);
  }

  for (const row of loadJson<Row>('configuration/branch.json')) {
    const created = await prisma.branch.create({
      data: {
        uuid: row.uuid as string,
        companyId: resolve('Company', row.companyUuid as string),
        branchCode: row.branchCode as string,
        branchName: row.branchName as string,
        displayName: row.displayName as string,
        gstNumber: row.gstNumber as string | undefined,
        drugLicenseNumber: row.drugLicenseNumber as string | undefined,
        email: row.email as string | undefined,
        phoneNumber: row.phoneNumber as string | undefined,
        addressLine1: row.addressLine1 as string | undefined,
        city: row.city as string | undefined,
        state: row.state as string | undefined,
        country: row.country as string | undefined,
        pinCode: row.pinCode as string | undefined,
        managerName: row.managerName as string | undefined,
        isHeadOffice: row.isHeadOffice as boolean,
        isActive: row.isActive as boolean,
      },
    });
    register('Branch', row.uuid as string, created.id);
    ctx.branchRecords.push({
      id: created.id,
      uuid: row.uuid as string,
      branchCode: row.branchCode as string,
    });
  }

  for (const row of loadJson<Row>('configuration/financial-year.json')) {
    const created = await prisma.financialYear.create({
      data: {
        uuid: row.uuid as string,
        companyId: resolve('Company', row.companyUuid as string),
        branchId: row.branchUuid ? resolve('Branch', row.branchUuid as string) : undefined,
        financialYearCode: row.financialYearCode as string,
        financialYearName: row.financialYearName as string,
        startDate: new Date(row.startDate as string),
        endDate: new Date(row.endDate as string),
        status: row.status as string,
        isCurrent: row.isCurrent as boolean,
      },
    });
    register('FinancialYear', row.uuid as string, created.id);
  }

  for (const row of loadJson<Row>('configuration/sequence-generator.json')) {
    const created = await prisma.sequenceGenerator.create({
      data: {
        uuid: row.uuid as string,
        companyId: resolve('Company', row.companyUuid as string),
        branchId: row.branchUuid ? resolve('Branch', row.branchUuid as string) : undefined,
        documentType: row.documentType as string,
        prefix: row.prefix as string | undefined,
        suffix: row.suffix as string | undefined,
        currentNumber: BigInt(row.currentNumber as number),
        resetPolicy: row.resetPolicy as string,
        format: row.format as string | undefined,
        isActive: row.isActive as boolean,
      },
    });
    register('SequenceGenerator', row.uuid as string, created.id);
  }

  for (const row of loadJson<Row>('configuration/app-setting.json')) {
    const created = await prisma.appSetting.create({
      data: {
        uuid: row.uuid as string,
        companyId: resolve('Company', row.companyUuid as string),
        branchId: row.branchUuid ? resolve('Branch', row.branchUuid as string) : undefined,
        settingKey: row.settingKey as string,
        settingName: row.settingName as string,
        settingValue: row.settingValue as string | undefined,
        dataType: row.dataType as string,
        category: row.category as string,
        defaultValue: row.defaultValue as string | undefined,
        description: row.description as string | undefined,
        isEditable: row.isEditable as boolean,
        isEncrypted: (row.isEncrypted as boolean) ?? false,
        isActive: row.isActive as boolean,
      },
    });
    register('AppSetting', row.uuid as string, created.id);
  }

  for (const row of loadJson<Row>('configuration/barcode-configuration.json')) {
    const created = await prisma.barcodeConfiguration.create({
      data: {
        uuid: row.uuid as string,
        companyId: resolve('Company', row.companyUuid as string),
        branchId: row.branchUuid ? resolve('Branch', row.branchUuid as string) : undefined,
        configurationName: row.configurationName as string,
        barcodeType: row.barcodeType as string,
        appliesTo: row.appliesTo as string,
        labelWidth: decimal(row.labelWidth as string | number),
        labelHeight: decimal(row.labelHeight as string | number),
        dpi: row.dpi as number,
        showHumanReadableText: (row.showHumanReadableText as boolean) ?? true,
        isDefault: row.isDefault as boolean,
        isActive: row.isActive as boolean,
      },
    });
    register('BarcodeConfiguration', row.uuid as string, created.id);
  }

  for (const row of loadJson<Row>('configuration/printer-configuration.json')) {
    const created = await prisma.printerConfiguration.create({
      data: {
        uuid: row.uuid as string,
        companyId: resolve('Company', row.companyUuid as string),
        branchId: row.branchUuid ? resolve('Branch', row.branchUuid as string) : undefined,
        printerName: row.printerName as string,
        printerType: row.printerType as string,
        documentType: row.documentType as string,
        printerPath: row.printerPath as string | undefined,
        paperSize: row.paperSize as string | undefined,
        copies: (row.copies as number) ?? 1,
        printOrientation: (row.printOrientation as string) ?? 'PORTRAIT',
        isDefault: row.isDefault as boolean,
        isActive: row.isActive as boolean,
      },
    });
    register('PrinterConfiguration', row.uuid as string, created.id);
  }
}

async function loadMedicineRefs(prisma: PrismaClient): Promise<void> {
  for (const row of loadJson<Row>('medicine/unit-of-measure.json')) {
    const created = await prisma.unitOfMeasure.create({
      data: {
        uuid: row.uuid as string,
        unitCode: row.unitCode as string,
        unitName: row.unitName as string,
        shortName: row.shortName as string,
        unitType: row.unitType as string,
        decimalAllowed: row.decimalAllowed as boolean,
        isSystemUnit: row.isSystemUnit as boolean,
        isActive: row.isActive as boolean,
      },
    });
    register('UnitOfMeasure', row.uuid as string, created.id);
  }

  for (const row of loadJson<Row>('medicine/medicine-category.json')) {
    const created = await prisma.medicineCategory.create({
      data: {
        uuid: row.uuid as string,
        categoryCode: row.categoryCode as string,
        categoryName: row.categoryName as string,
        isActive: row.isActive as boolean,
      },
    });
    register('MedicineCategory', row.uuid as string, created.id);
  }

  for (const row of loadJson<Row>('medicine/medicine-schedule.json')) {
    const created = await prisma.medicineSchedule.create({
      data: {
        uuid: row.uuid as string,
        scheduleCode: row.scheduleCode as string,
        scheduleName: row.scheduleName as string,
        requiresPrescription: row.requiresPrescription as boolean,
        isSystemSchedule: true,
        isActive: row.isActive as boolean,
      },
    });
    register('MedicineSchedule', row.uuid as string, created.id);
  }

  for (const row of loadJson<Row>('medicine/medicine-generic.json')) {
    const created = await prisma.medicineGeneric.create({
      data: {
        uuid: row.uuid as string,
        genericCode: row.genericCode as string,
        genericName: row.genericName as string,
        therapeuticClass: row.therapeuticClass as string | undefined,
        isActive: row.isActive as boolean,
      },
    });
    register('MedicineGeneric', row.uuid as string, created.id);
  }

  for (const row of loadJson<Row>('medicine/salt-composition.json')) {
    const created = await prisma.saltComposition.create({
      data: {
        uuid: row.uuid as string,
        genericId: resolve('MedicineGeneric', row.genericUuid as string),
        unitId: resolve('UnitOfMeasure', row.unitUuid as string),
        compositionCode: row.compositionCode as string,
        strength: decimal(row.strength as string | number),
        strengthUnit: row.strengthUnit as string,
        isActive: row.isActive as boolean,
      },
    });
    register('SaltComposition', row.uuid as string, created.id);
  }
}

async function loadTax(prisma: PrismaClient, ctx: SeedContext): Promise<void> {
  for (const row of loadJson<Row>('pricing/tax.json')) {
    const created = await prisma.tax.create({
      data: {
        uuid: row.uuid as string,
        taxCode: row.taxCode as string,
        taxName: row.taxName as string,
        taxType: row.taxType as string,
        taxRate: decimal(row.taxRate as string | number),
        effectiveFrom: new Date(row.effectiveFrom as string),
        effectiveTo: row.effectiveTo ? new Date(row.effectiveTo as string) : undefined,
        isActive: row.isActive as boolean,
      },
    });
    register('Tax', row.uuid as string, created.id);
    ctx.taxIds.push(created.id);
  }
}

async function loadSecurity(prisma: PrismaClient): Promise<void> {
  for (const row of loadJson<Row>('security/permission.json')) {
    const created = await prisma.permission.create({
      data: {
        uuid: row.uuid as string,
        permissionCode: row.permissionCode as string,
        permissionName: row.permissionName as string,
        module: row.module as string,
        resource: row.resource as string,
        action: row.action as string,
        isSystemPermission: row.isSystemPermission as boolean,
        isActive: row.isActive as boolean,
      },
    });
    register('Permission', row.uuid as string, created.id);
  }

  for (const row of loadJson<Row>('security/role.json')) {
    const created = await prisma.role.create({
      data: {
        uuid: row.uuid as string,
        roleCode: row.roleCode as string,
        roleName: row.roleName as string,
        description: row.description as string | undefined,
        isSystemRole: row.isSystemRole as boolean,
        isActive: row.isActive as boolean,
      },
    });
    register('Role', row.uuid as string, created.id);
  }

  for (const row of loadJson<Row>('security/role-permission.json')) {
    const created = await prisma.rolePermission.create({
      data: {
        uuid: row.uuid as string,
        roleId: resolve('Role', row.roleUuid as string),
        permissionId: resolve('Permission', row.permissionUuid as string),
        isGranted: true,
      },
    });
    register('RolePermission', row.uuid as string, created.id);
  }
}

export async function loadUsers(prisma: PrismaClient, ctx: SeedContext): Promise<void> {
  const roles = [
    'cccccccc-cccc-4ccc-8ccc-cccccccccc01',
    'cccccccc-cccc-4ccc-8ccc-cccccccccc02',
    'cccccccc-cccc-4ccc-8ccc-cccccccccc03',
    'cccccccc-cccc-4ccc-8ccc-cccccccccc04',
    'cccccccc-cccc-4ccc-8ccc-cccccccccc05',
  ];
  const usernames = ['admin', 'pharmacist1', 'cashier1', 'procurement1', 'manager1', 'pharmacist2', 'cashier2', 'procurement2', 'manager2', 'support1'];

  for (let i = 0; i < usernames.length && i < ctx.employeeIds.length; i++) {
    const userUuid = `17171717-1717-4717-8717-1717171717${String(i + 1).padStart(2, '0')}`;
    const user = await prisma.user.create({
      data: {
        uuid: userUuid,
        employeeId: ctx.employeeIds[i]!,
        username: usernames[i]!,
        passwordHash: '$2b$10$placeholder.hash.for.demo.only',
        isActive: true,
      },
    });
    register('User', userUuid, user.id);
    ctx.userIds.push(user.id);

    const roleUuid = roles[i % roles.length]!;
    const userRoleUuid = `18181818-1818-4818-8818-1818181818${String(i + 1).padStart(2, '0')}`;
    await prisma.userRole.create({
      data: {
        uuid: userRoleUuid,
        userId: user.id,
        roleId: resolve('Role', roleUuid),
        isActive: true,
      },
    });

    const sessionUuid = `19191919-1919-4919-8919-1919191919${String(i + 1).padStart(2, '0')}`;
    const now = new Date();
    await prisma.userSession.create({
      data: {
        uuid: sessionUuid,
        userId: user.id,
        sessionToken: `session-token-${i + 1}-${Date.now()}`,
        deviceName: 'Seed Desktop Client',
        deviceType: 'DESKTOP',
        ipAddress: '127.0.0.1',
        loginTime: now,
        lastActivityAt: now,
        expiresAt: new Date(Date.now() + 86_400_000),
        isActive: i < 5,
      },
    });
  }
}
