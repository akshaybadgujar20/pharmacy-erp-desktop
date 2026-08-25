import { Employee } from '@prisma/client';
import { serializeDate, serializeDecimal } from '../utils/party.util';

export interface EmployeeResponse {
  id: string;
  partyId: string;
  uuid: string;
  employeeCode: string;
  designation: string | null;
  department: string | null;
  joiningDate: string | null;
  leavingDate: string | null;
  salary: string | null;
  licenseNumber: string | null;
  isPharmacist: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
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
    joiningDate: serializeDate(employee.joiningDate),
    leavingDate: serializeDate(employee.leavingDate),
    salary: serializeDecimal(employee.salary),
    licenseNumber: employee.licenseNumber,
    isPharmacist: employee.isPharmacist,
    isActive: employee.isActive,
    createdAt: employee.createdAt.toISOString(),
    updatedAt: employee.updatedAt.toISOString(),
    deletedAt: serializeDate(employee.deletedAt),
    version: employee.version,
  };
}
