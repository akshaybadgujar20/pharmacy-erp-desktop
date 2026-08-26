import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma.module';
import { PersistenceModule } from '../persistence/persistence.module';
import { CustomerController } from './controllers/customer.controller';
import { CustomerService } from './services/customer.service';
import { DoctorController } from './controllers/doctor.controller';
import { DoctorService } from './services/doctor.service';
import { EmployeeController } from './controllers/employee.controller';
import { EmployeeService } from './services/employee.service';
import { PartyAddressController } from './controllers/party-address.controller';
import { PartyAddressService } from './services/party-address.service';
import { PartyContactController } from './controllers/party-contact.controller';
import { PartyContactService } from './services/party-contact.service';
import { PartyRoleController } from './controllers/party-role.controller';
import { PartyRoleService } from './services/party-role.service';
import { PartyController } from './controllers/party.controller';
import { PartyService } from './services/party.service';
import { SupplierController } from './controllers/supplier.controller';
import { SupplierService } from './services/supplier.service';

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
