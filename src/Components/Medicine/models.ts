import { PerformedByModel } from "../HCX/misc";

interface BasePrescription {
  readonly id: string;
  medicine?: string;
  medicine_object?: MedibaseMedicine;
  medicine_old?: string;
  route?: "ORAL" | "IV" | "IM" | "SC";
  dosage_type?: "REGULAR" | "TITRATED" | "PRN";
  base_dosage?: string;
  target_dosage?: string;
  instruction_on_titration?: string;
  notes?: string;
  meta?: object;
  readonly prescription_type?: "DISCHARGE" | "REGULAR";
  readonly discontinued: boolean;
  discontinued_reason?: string;
  readonly prescribed_by: PerformedByModel;
  readonly discontinued_date: string;
  readonly last_administration?: MedicineAdministrationRecord;
  readonly is_migrated: boolean;
  readonly created_date: string;
  readonly modified_date: string;
}

export interface NormalPrescription extends BasePrescription {
  frequency:
    | "STAT"
    | "OD"
    | "HS"
    | "BD"
    | "TID"
    | "QID"
    | "Q4H"
    | "QOD"
    | "QWK";
  days?: number;
  dosage_type: "REGULAR" | "TITRATED";
  indicator?: undefined;
  max_dosage?: undefined;
  min_hours_between_doses?: undefined;
}

export interface PRNPrescription extends BasePrescription {
  indicator: string;
  max_dosage?: string;
  min_hours_between_doses?: number;
  dosage_type: "PRN";
  frequency?: undefined;
  days?: undefined;
}

export type Prescription = NormalPrescription | PRNPrescription;

export type MedicineAdministrationRecord = {
  readonly id: string;
  readonly prescription: Prescription;
  notes: string;
  dosage?: string;
  administered_date?: string;
  readonly administered_by: PerformedByModel;
  readonly archived_by: PerformedByModel | undefined;
  readonly archived_on: string | undefined;
  readonly created_date: string;
  readonly modified_date: string;
};

export type MedibaseMedicine = {
  id: string;
  name: string;
  type: "brand" | "generic";
  company?: string;
  contents: string;
  cims_class: string;
  atc_classification?: string;
  generic?: string;
};
