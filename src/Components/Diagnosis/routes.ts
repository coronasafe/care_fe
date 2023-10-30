import { Type } from "../../Redux/api";
import { PaginatedResponse } from "../../Utils/request/types";
import { ConsultationDiagnosis, CreateDiagnosis } from "./types";

const DiagnosesRoutes = {
  // ICD-11
  searchICD11Diagnoses: {
    path: "/api/v1/icd/",
  },

  // Consultation Diagnoses
  listConsultationDiagnoses: {
    path: "/api/v1/consultation/{consultation}/diagnoses/",
    TRes: Type<PaginatedResponse<ConsultationDiagnosis>>(),
  },

  createConsultationDiagnosis: {
    path: "/api/v1/consultation/{consultation}/diagnoses/",
    TBody: Type<CreateDiagnosis>(),
  },

  getConsultationDiagnosis: {
    path: "/api/v1/consultation/{consultation}/diagnoses/{id}/",
    TRes: Type<ConsultationDiagnosis>(),
  },

  updateConsultationDiagnosis: {
    path: "/api/v1/consultation/{consultation}/diagnoses/{id}/",
    method: "PATCH",
    TBody: Type<Partial<CreateDiagnosis>>(),
    TRes: Type<ConsultationDiagnosis>(),
  },
} as const;

export default DiagnosesRoutes;
