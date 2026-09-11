export interface Doctor {
  id: string;
  partyId: string;
  uuid: string;
  doctorCode: string;
  registrationNumber: string;
  qualification: string | null;
  specialization: string | null;
  hospitalName: string | null;
  consultationFee: number | null;
  isVisitingDoctor: boolean;
  isActive: boolean;
  version: number;
}

export interface CreateDoctorRequest {
  partyId: string;
  doctorCode: string;
  registrationNumber: string;
  qualification?: string;
  specialization?: string;
  hospitalName?: string;
  consultationFee?: number;
  isVisitingDoctor?: boolean;
  isActive?: boolean;
}

export interface UpdateDoctorRequest {
  version: number;
  doctorCode?: string;
  registrationNumber?: string;
  qualification?: string;
  specialization?: string;
  hospitalName?: string;
  consultationFee?: number;
  isVisitingDoctor?: boolean;
  isActive?: boolean;
}
