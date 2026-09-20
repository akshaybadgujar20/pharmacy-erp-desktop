export interface Employee {
  id: string;
  partyId: string;
  uuid: string;
  employeeCode: string;
  designation: string | null;
  department: string | null;
  joiningDate: string | null;
  leavingDate: string | null;
  salary: number | null;
  licenseNumber: string | null;
  isPharmacist: boolean;
  isActive: boolean;
  version: string;
}

export interface CreateEmployeeRequest {
  partyId: string;
  employeeCode: string;
  designation?: string;
  department?: string;
  salary?: number;
  licenseNumber?: string;
  isPharmacist?: boolean;
  isActive?: boolean;
}

export interface UpdateEmployeeRequest {
  version: string;
  employeeCode?: string;
  designation?: string;
  department?: string;
  salary?: number;
  licenseNumber?: string;
  isPharmacist?: boolean;
  isActive?: boolean;
}
