import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma.module';
import { PersistenceModule } from '../persistence/persistence.module';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { PartyAddressController } from './party-address.controller';
import { PartyAddressService } from './party-address.service';
import { PartyContactController } from './party-contact.controller';
import { PartyContactService } from './party-contact.service';
import { PartyRoleController } from './party-role.controller';
import { PartyRoleService } from './party-role.service';
import { PartyController } from './party.controller';
import { PartyService } from './party.service';
import { SupplierController } from './supplier.controller';
import { SupplierService } from './supplier.service';

@Module({
  imports: [PrismaModule, PersistenceModule, AuditModule],
  controllers: [
    PartyController,
    PartyRoleController,
    PartyAddressController,
    PartyContactController,
    CustomerController,
    SupplierController,
    DoctorController,
    EmployeeController,
  ],
  providers: [
    PartyService,
    PartyRoleService,
    PartyAddressService,
    PartyContactService,
    CustomerService,
    SupplierService,
    DoctorService,
    EmployeeService,
  ],
  exports: [
    PartyService,
    CustomerService,
    SupplierService,
    DoctorService,
    EmployeeService,
  ],
})
export class PartyModule {}
