import { Employee } from '@prisma/client';
import { serializeDecimal } from '../utils/party.util';

export interface EmployeeResponse {
  id: string;
  partyId: string;
  uuid: string;
  employeeCode: string;
  designation: string | null;
  department: string | null;
  joiningDate: bigint | null;
  leavingDate: bigint | null;
  salary: string | null;
  licenseNumber: string | null;
  isPharmacist: boolean;
  isActive: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  version: number;
}

export function toEmployeeResponse(employee: Employee): EmployeeResponse {
  return {
    id: employee.id.toString(),
    partyId: employee.partyId.toString(),
    uuid: employee.uuid,
    employeeCode: employee.employeeCode,
    designation: employee.designation,
    department: employee.department,
    joiningDate: employee.joiningDate,
    leavingDate: employee.leavingDate,
    salary: serializeDecimal(employee.salary),
    licenseNumber: employee.licenseNumber,
    isPharmacist: employee.isPharmacist,
    isActive: employee.isActive,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
    deletedAt: employee.deletedAt,
    version: employee.version,
  };
}
