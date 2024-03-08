import { ConsultationModel } from "../Facility/models";
import { PatientModel } from "../Patient/models";
import { PerformedByModel } from "./misc";

export type HCXPriority = "Immediate" | "Normal" | "Deferred";

export type HCXPolicyStatus =
  | "Active"
  | "Cancelled"
  | "Draft"
  | "Entered in Error";
export type HCXPolicyPurpose =
  | "Auth Requirements"
  | "Benefits"
  | "Discovery"
  | "Validation";
export type HCXPolicyOutcome =
  | "Queued"
  | "Processing Complete"
  | "Error"
  | "Partial Processing";

export interface HCXPolicyModel {
  id?: string;
  patient?: string;
  patient_object?: PatientModel;
  subscriber_id: string;
  policy_id: string;
  insurer_id?: string;
  insurer_name?: string;
  status?: HCXPolicyStatus;
  priority?: "Immediate" | "Normal" | "Deferred";
  purpose?: "Auth Requirements" | "Benefits" | "Discovery" | "Validation";
  outcome?: "Queued" | "Processing Complete" | "Error" | "Partial Processing";
  error_text?: string;
  created_date?: string;
  modified_date?: string;
}

export interface HCXItemModel {
  id: string;
  name: string;
  price: number;
  category?: string;
}

export type HCXClaimUse = "Claim" | "Pre-Authorization" | "Pre-Determination";
export type HCXClaimStatus = HCXPolicyStatus;
export type HCXClaimType =
  | "Institutional"
  | "Oral"
  | "Pharmacy"
  | "Professional"
  | "Vision";
export type HCXClaimOutcome = HCXPolicyOutcome;

export interface HCXClaimModel {
  id?: string;
  consultation: string;
  consultation_object?: ConsultationModel;
  policy: string;
  policy_object?: HCXPolicyModel;
  items?: HCXItemModel[];
  total_claim_amount?: number;
  total_amount_approved?: number;
  use?: HCXClaimUse;
  status?: HCXClaimStatus;
  priority?: HCXPriority;
  type?: HCXClaimType;
  outcome?: HCXClaimOutcome;
  error_text?: string;
  created_by?: PerformedByModel;
  last_modified_by?: PerformedByModel;
  created_date?: string;
  modified_date?: string;
}
