import { AssignedToObjectModel } from "../Patient/models";
import { ProcedureType } from "../Common/prescription-builder/ProcedureBuilder";
import { NormalPrescription, PRNPrescription } from "../Medicine/models";
import { AssetData } from "../Assets/AssetTypes";
import { UserBareMinimum } from "../Users/models";
import { RouteToFacility } from "../Common/RouteToFacilitySelect";
import { ConsultationDiagnosis, CreateDiagnosis } from "../Diagnosis/types";

export interface LocalBodyModel {
  name: string;
  body_type: number;
  localbody_code: string;
  district: number;
}
export interface DistrictModel {
  id: number;
  name: string;
  state: number;
}
export interface StateModel {
  id: number;
  name: string;
}
export interface WardModel {
  id: number;
  name: string;
  number: number;
  local_body: number;
}
export interface FacilityModel {
  id?: number;
  name?: string;
  read_cover_image_url?: string;
  facility_type?: string;
  address?: string;
  features?: number[];
  location?: {
    latitude: number;
    longitude: number;
  };
  oxygen_capacity?: number;
  phone_number?: string;
  type_b_cylinders?: number;
  type_c_cylinders?: number;
  type_d_cylinders?: number;
  middleware_address?: string;
  expected_type_b_cylinders?: number;
  expected_type_c_cylinders?: number;
  expected_type_d_cylinders?: number;
  expected_oxygen_requirement?: number;
  local_body_object?: LocalBodyModel;
  district_object?: DistrictModel;
  state_object?: StateModel;
  ward_object?: WardModel;
  modified_date?: string;
  created_date?: string;
  state?: number;
  district?: number;
  local_body?: number;
  ward?: number;
}

export interface CapacityModal {
  id?: number;
  room_type?: number;
  modified_date?: any;
  total_capacity?: number;
  current_capacity?: number;
}

export interface DoctorModal {
  id?: number;
  area?: number;
  count?: number;
}

export interface OptionsType {
  id: number;
  text: string;
  disabled?: boolean;
}

export type PatientCategory =
  | "Comfort Care"
  | "Stable"
  | "Abnormal"
  | "Critical";

export interface ConsultationModel {
  admission_date?: string;
  icu_admission_date?: string;
  admitted?: boolean;
  test_id?: string;
  admitted_to?: string;
  category?: PatientCategory;
  created_date?: string;
  discharge_date?: string;
  discharge_reason?: string;
  discharge_prescription?: NormalPrescription;
  discharge_prn_prescription?: PRNPrescription;
  discharge_notes?: string;
  examination_details?: string;
  history_of_present_illness?: string;
  facility?: number;
  facility_name?: string;
  id?: string;
  modified_date?: string;
  other_symptoms?: string;
  patient?: string;
  treatment_plan?: string;
  referred_to?: FacilityModel["id"];
  referred_to_object?: FacilityModel;
  referred_to_external?: string;
  referred_from_facility?: FacilityModel["id"];
  referred_from_facility_object?: FacilityModel;
  referred_from_facility_external?: string;
  referred_by_external?: string;
  transferred_from_location?: LocationModel["id"];
  transferred_from_location_object?: LocationModel;
  suggestion?: string;
  patient_no?: string;
  route_to_facility?: RouteToFacility;
  is_kasp?: boolean;
  kasp_enabled_date?: string;
  readonly diagnoses?: ConsultationDiagnosis[];
  create_diagnoses?: CreateDiagnosis[]; // Used for bulk creating diagnoses upon consultation creation
  deprecated_verified_by?: string;
  treating_physician?: UserBareMinimum["id"];
  treating_physician_object?: UserBareMinimum;
  suggestion_text?: string;
  symptoms?: Array<number>;
  symptoms_text?: string;
  symptoms_onset_date?: string;
  consultation_notes?: string;
  is_telemedicine?: boolean;
  procedure?: ProcedureType[];
  assigned_to_object?: AssignedToObjectModel;
  created_by?: any;
  last_edited_by?: any;
  weight?: number | null;
  height?: number | null;
  operation?: string;
  special_instruction?: string;
  intubation_start_date?: string;
  intubation_end_date?: string;
  ett_tt?: number;
  cuff_pressure?: number;
  lines?: any;
  last_daily_round?: any;
  current_bed?: CurrentBed;
  review_interval?: number;
  cause_of_death?: string;
  death_datetime?: string;
  death_confirmed_doctor?: string;
  is_readmission?: boolean;
  medico_legal_case?: boolean;
}
export interface PatientStatsModel {
  id?: number;
  entryDate?: string;
  num_patients_visited?: number;
  num_patients_home_quarantine?: number;
  num_patients_isolation?: number;
  num_patient_referred?: number;
  entry_date?: number;
  num_patient_confirmed_positive?: number;
}

export interface DupPatientModel {
  id: number;
  gender: string;
  phone_number: string;
  patient_id: string;
  name: string;
  date_of_birth: string;
  year_of_birth: number;
  state_id: number;
}

export interface InventoryItemsModel {
  // count?: number;
  id?: number;
  name?: string;
  default_unit?: {
    id: number;
    name: string;
  };
  allowed_units?: [
    {
      id: number;
      name: string;
    }
  ];
}

export interface LocationModel {
  id?: string;
  name?: string;
  description?: string;
  middleware_address?: string;
  facility?: {
    name: string;
  };
}

export interface BedModel {
  id?: string;
  bed_type?: string;
  description?: string;
  name?: string;
  facility?: string;
  location_object?: {
    name: string;
    id?: string;
  };
  location?: string;
  is_occupied?: boolean;
}

export interface CurrentBed {
  id: string;
  consultation: string;
  bed?: string;
  bed_object: BedModel;
  assets_objects?: AssetData[];
  created_date: string;
  modified_date: string;
  start_date: string;
  end_date: string;
  meta: Record<string, any>;
}
