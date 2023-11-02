import { FacilityModel } from "../Facility/models";
import { PerformedByModel } from "../HCX/misc";
import { AssignedToObjectModel, PatientModel } from "../Patient/models";

export interface IShift {
  id: string;
  patient_object: PatientModel;
  emergency: boolean;
  status: string;
  origin_facility_object: FacilityModel;
  origin_facility: string;
  shifting_approving_facility: string;
  assigned_facility_external: string | null;
  assigned_facility: string | null;
  is_up_shift: boolean;
  assigned_to: number;
  patient_category: string;
  shifting_approving_facility_object: FacilityModel;
  assigned_facility_object: FacilityModel;
  assigned_facility_external_object: FacilityModel;
  modified_date: string;
  external_id: string;
  assigned_to_object?: AssignedToObjectModel;
  refering_facility_contact_name: string;
  refering_facility_contact_number: string;
  is_kasp: boolean;
  vehicle_preference: string;
  preferred_vehicle_choice: string;
  assigned_facility_type: string;
  breathlessness_level: string;
  reason: string;
  ambulance_driver_name: string;
  ambulance_phone_number: string | undefined;
  ambulance_number: string;
  comments: string;
  created_date: string;
  created_by_object: PerformedByModel;
  last_edited_by_object: PerformedByModel;
  is_assigned_to_user: boolean;
  created_by: number;
  last_edited_by: number;
  patient: string;
  initial_status?: string;
}

export interface IShiftDetails extends Omit<IShift, "patient"> {
  patient: PatientModel;
}
