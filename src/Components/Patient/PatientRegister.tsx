import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  FormControlLabel,
  Radio,
  RadioGroup,
} from "@material-ui/core";

import { navigate, useQueryParams } from "raviger";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import moment from "moment";
import loadable from "@loadable/component";
import { useCallback, useReducer, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  BLOOD_GROUPS,
  DISEASE_STATUS,
  GENDER_TYPES,
  MEDICAL_HISTORY_CHOICES,
  TEST_TYPE,
  VACCINES,
} from "../../Common/constants";
import countryList from "../../Common/static/countries.json";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  createPatient,
  getDistrictByState,
  getLocalbodyByDistrict,
  getPatient,
  getStates,
  searchPatient,
  updatePatient,
  getWardByLocalBody,
  externalResult,
  getAnyFacility,
  HCXActions,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import AlertDialog from "../Common/AlertDialog";
import {
  LegacyCheckboxField,
  LegacyDateInputField,
  LegacyErrorHelperText,
  LegacySelectField,
  LegacyTextInputField,
} from "../Common/HelperInputFields";
import DuplicatePatientDialog from "../Facility/DuplicatePatientDialog";
import { DupPatientModel } from "../Facility/models";
import { PatientModel } from "./models";
import TransferPatientDialog from "../Facility/TransferPatientDialog";
import { validatePincode } from "../../Common/validation";
import { getPincodeDetails, includesIgnoreCase } from "../../Utils/utils";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

import AccordionV2 from "../Common/components/AccordionV2";
import CollapseV2 from "../Common/components/CollapseV2";
import { debounce } from "lodash";
import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import TextFormField from "../Form/FormFields/TextFormField";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import DateFormField from "../Form/FormFields/DateFormField";
import { FieldLabel } from "../Form/FormFields/FormField";
import PhoneNumberFormField from "../Form/FormFields/PhoneNumberFormField";
import { FieldChangeEvent } from "../Form/FormFields/Utils";
import useConfig from "../../Common/hooks/useConfig";
import { MaterialUiPickersDate } from "@material-ui/pickers/typings/date";
import InsuranceDetailsBuilder from "../HCX/InsuranceDetailsBuilder";
import { HCXPolicyModel } from "../HCX/models";
import HCXPolicyValidator from "../HCX/validators";
import { FieldError } from "../Form/FieldValidators";
import useAppHistory from "../../Common/hooks/useAppHistory";
import DialogModal from "../Common/Dialog";
// const debounce = require("lodash.debounce");

interface PatientRegisterProps extends PatientModel {
  facilityId: number;
}

interface medicalHistoryModel {
  id?: number;
  disease: string | number;
  details: string;
}

const medicalHistoryChoices = MEDICAL_HISTORY_CHOICES.reduce(
  (acc: Array<{ [x: string]: string }>, cur) => [
    ...acc,
    { [`medical_history_${cur.id}`]: "" },
  ],
  []
);
const genderTypes = GENDER_TYPES;
const diseaseStatus = [...DISEASE_STATUS];
const bloodGroups = [...BLOOD_GROUPS];
const testType = [...TEST_TYPE];
const vaccines = ["Select", ...VACCINES];

const initForm: any = {
  name: "",
  age: "",
  gender: "",
  phone_number: "",
  emergency_phone_number: "",
  blood_group: "",
  disease_status: diseaseStatus[2],
  is_declared_positive: "false",
  date_declared_positive: new Date(),
  date_of_birth: null,
  medical_history: [],
  nationality: "India",
  passport_no: "",
  state: "",
  district: "",
  local_body: "",
  ward: "",
  address: "",
  permanent_address: "",
  village: "",
  allergies: "",
  pincode: "",
  present_health: "",
  contact_with_confirmed_carrier: "false",
  contact_with_suspected_carrier: "false",

  estimated_contact_date: null,
  date_of_return: null,

  number_of_primary_contacts: "",
  number_of_secondary_contacts: "",
  is_antenatal: "false",
  date_of_test: null,
  date_of_result: null,
  test_id: "",
  srf_id: "",
  test_type: testType[0],
  prescribed_medication: false,
  ongoing_medication: "",
  designation_of_health_care_worker: "",
  instituion_of_health_care_worker: "",
  cluster_name: "",
  covin_id: "",
  is_vaccinated: "false",
  number_of_doses: "0",
  vaccine_name: null,
  last_vaccinated_date: null,
  ...medicalHistoryChoices,
};

const initError = Object.assign(
  {},
  ...Object.keys(initForm).map((k) => ({ [k]: "" }))
);

const initialState = {
  form: { ...initForm },
  errors: { ...initError },
};

const patientFormReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case "set_form": {
      return {
        ...state,
        form: action.form,
      };
    }
    case "set_error": {
      return {
        ...state,
        errors: action.errors,
      };
    }
    default:
      return state;
  }
};

const scrollTo = (id: string | boolean) => {
  const element = document.querySelector(`#${id}-div`);
  element?.scrollIntoView({ behavior: "smooth", block: "center" });
};

const getDate = (value: any) =>
  value && moment(value).isValid() && moment(value).toDate();

export const PatientRegister = (props: PatientRegisterProps) => {
  const { goBack } = useAppHistory();
  const { gov_data_api_key, enable_hcx } = useConfig();
  const dispatchAction: any = useDispatch();
  const { facilityId, id } = props;
  const [state, dispatch] = useReducer(patientFormReducer, initialState);
  const [showAlertMessage, setAlertMessage] = useState({
    show: false,
    message: "",
    title: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [careExtId, setCareExtId] = useState("");
  const [isStateLoading, setIsStateLoading] = useState(false);
  const [isDistrictLoading, setIsDistrictLoading] = useState(false);
  const [isLocalbodyLoading, setIsLocalbodyLoading] = useState(false);
  const [isWardLoading, setIsWardLoading] = useState(false);
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [localBody, setLocalBody] = useState<any[]>([]);
  const [ward, setWard] = useState<any[]>([]);
  const [statusDialog, setStatusDialog] = useState<{
    show?: boolean;
    transfer?: boolean;
    patientList: Array<DupPatientModel>;
  }>({ patientList: [] });
  const [sameAddress, setSameAddress] = useState(true);
  const [facilityName, setFacilityName] = useState("");
  const [patientName, setPatientName] = useState("");
  const [{ extId }, setQuery] = useQueryParams();
  const [showAutoFilledPincode, setShowAutoFilledPincode] = useState(false);
  const [insuranceDetails, setInsuranceDetails] = useState<HCXPolicyModel[]>(
    []
  );
  const [insuranceDetailsError, setInsuranceDetailsError] =
    useState<FieldError>();

  useEffect(() => {
    if (extId) {
      setCareExtId(extId);
      fetchExtResultData(null);
    }
  }, [careExtId]);

  const headerText = !id ? "Add Details of Patient" : "Update Patient Details";
  const buttonText = !id ? "Add Patient" : "Save Details";

  const fetchDistricts = useCallback(
    async (id: number) => {
      if (id > 0) {
        setIsDistrictLoading(true);
        const districtList = await dispatchAction(getDistrictByState({ id }));
        if (districtList) {
          setDistricts(districtList.data);
        }
        setIsDistrictLoading(false);
        return districtList ? [...districtList.data] : [];
      }
    },
    [dispatchAction]
  );

  const fetchLocalBody = useCallback(
    async (id: string) => {
      if (Number(id) > 0) {
        setIsLocalbodyLoading(true);
        const localBodyList = await dispatchAction(
          getLocalbodyByDistrict({ id })
        );
        setIsLocalbodyLoading(false);
        setLocalBody(localBodyList.data);
      } else {
        setLocalBody([]);
      }
    },
    [dispatchAction]
  );

  const field = (name: string) => {
    return {
      id: name,
      name,
      onChange: handleChange,
      value: state.form[name],
      error: state.errors[name],
    };
  };

  const fetchWards = useCallback(
    async (id: string) => {
      if (Number(id) > 0) {
        setIsWardLoading(true);
        const wardList = await dispatchAction(getWardByLocalBody({ id }));
        setIsWardLoading(false);
        setWard(wardList.data.results);
      } else {
        setWard([]);
      }
    },
    [dispatchAction]
  );

  const parseGenderFromExt = (gender: any, defaultValue: any) => {
    switch (gender.toLowerCase()) {
      case "m":
        return "1";
      case "f":
        return "2";
      case "o":
        return "3";
      default:
        return defaultValue;
    }
  };

  const fetchExtResultData = async (e: any) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    if (!careExtId) return;
    const res = await dispatchAction(externalResult({ id: careExtId }));

    if (res && res.data) {
      const form = { ...state.form };
      form["name"] = res.data.name ? res.data.name : state.form.name;
      form["address"] = res.data.address
        ? res.data.address
        : state.form.address;
      form["permanent_address"] = res.data.permanent_address
        ? res.data.permanent_address
        : state.form.permanent_address;
      form["gender"] = res.data.gender
        ? parseGenderFromExt(res.data.gender, state.form.gender)
        : state.form.gender;
      form["test_id"] = res.data.test_id
        ? res.data.test_id
        : state.form.test_id;
      form["srf_id"] = res.data.srf_id ? res.data.srf_id : state.form.srf_id;

      form["state"] = res.data.district_object
        ? res.data.district_object.state
        : state.form.state;
      form["district"] = res.data.district
        ? res.data.district
        : state.form.district;
      form["local_body"] = res.data.local_body
        ? res.data.local_body
        : state.form.local_body;
      form["ward"] = res.data.ward ? res.data.ward : state.form.ward;
      form["village"] = res.data.village
        ? res.data.village
        : state.form.village;
      form["disease_status"] = res.data.result
        ? res.data.result.toUpperCase()
        : state.form.disease_status;
      form["test_type"] = res.data.test_type
        ? res.data.test_type.toUpperCase()
        : state.form.test_type;
      form["date_of_test"] = res.data.sample_collection_date
        ? moment(res.data.sample_collection_date)
        : state.form.date_of_test;
      form["date_of_result"] = res.data.result_date
        ? moment(res.data.result_date)
        : state.form.date_of_result;
      form["phone_number"] = res.data.mobile_number
        ? "+91" + res.data.mobile_number
        : state.form.phone_number;

      dispatch({ type: "set_form", form });
      Promise.all([
        fetchDistricts(res.data.district_object.state),
        fetchLocalBody(res.data.district),
        fetchWards(res.data.local_body),
        duplicateCheck("+91" + res.data.mobile_number),
      ]);

      setShowImport(false);
    }
    setIsLoading(false);
  };

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(getPatient({ id }));
      if (!status.aborted) {
        if (res && res.data) {
          setFacilityName(res.data.facility_object.name);
          setPatientName(res.data.name);
          const formData = {
            ...res.data,
            nationality: res.data.nationality ? res.data.nationality : "India",
            gender: res.data.gender ? res.data.gender : "",
            cluster_name: res.data.cluster_name ? res.data.cluster_name : "",
            state: res.data.state ? res.data.state : "",
            district: res.data.district ? res.data.district : "",
            blood_group: res.data.blood_group
              ? res.data.blood_group === "UNKNOWN"
                ? "UNK"
                : res.data.blood_group
              : "",
            local_body: res.data.local_body ? res.data.local_body : "",
            ward: res.data.ward_object ? res.data.ward_object.id : undefined,
            village: res.data.village ? res.data.village : "",
            medical_history: [],
            is_antenatal: String(!!res.data.is_antenatal),
            allergies: res.data.allergies ? res.data.allergies : "",
            pincode: res.data.pincode ? res.data.pincode : "",
            ongoing_medication: res.data.ongoing_medication
              ? res.data.ongoing_medication
              : "",

            is_declared_positive: res.data.is_declared_positive
              ? String(res.data.is_declared_positive)
              : "false",
            designation_of_health_care_worker: res.data
              .designation_of_health_care_worker
              ? res.data.designation_of_health_care_worker
              : "",
            instituion_of_health_care_worker: res.data
              .instituion_of_health_care_worker
              ? res.data.instituion_of_health_care_worker
              : "",

            number_of_primary_contacts: res.data.number_of_primary_contacts
              ? res.data.number_of_primary_contacts
              : "",
            number_of_secondary_contacts: res.data.number_of_secondary_contacts
              ? res.data.number_of_secondary_contacts
              : "",
            contact_with_confirmed_carrier: res.data
              .contact_with_confirmed_carrier
              ? String(res.data.contact_with_confirmed_carrier)
              : "false",
            contact_with_suspected_carrier: res.data
              .contact_with_suspected_carrier
              ? String(res.data.contact_with_suspected_carrier)
              : "false",
            is_vaccinated: String(res.data.is_vaccinated),
            number_of_doses: res.data.number_of_doses
              ? String(res.data.number_of_doses)
              : "0",
            vaccine_name: res.data.vaccine_name ? res.data.vaccine_name : null,
            last_vaccinated_date: res.data.last_vaccinated_date
              ? res.data.last_vaccinated_date
              : null,
          };
          if (res.data.address !== res.data.permanent_address) {
            setSameAddress(false);
          }
          res.data.medical_history.forEach((i: any) => {
            const medicalHistory = MEDICAL_HISTORY_CHOICES.find(
              (j: any) =>
                String(j.text).toLowerCase() === String(i.disease).toLowerCase()
            );
            if (medicalHistory) {
              formData.medical_history.push(medicalHistory.id);
              formData[`medical_history_${medicalHistory.id}`] = i.details;
            }
          });
          dispatch({
            type: "set_form",
            form: formData,
          });
          Promise.all([
            fetchDistricts(res.data.state),
            fetchLocalBody(res.data.district),
            fetchWards(res.data.local_body),
          ]);
        } else {
          goBack();
        }
        setIsLoading(false);
      }
    },
    [dispatchAction, fetchDistricts, fetchLocalBody, fetchWards, id]
  );

  useEffect(() => {
    const fetchPatientInsuranceDetails = async () => {
      if (!id) {
        setInsuranceDetails([]);
        return;
      }

      const res = await dispatchAction(
        HCXActions.policies.list({ patient: id })
      );
      if (res && res.data) {
        setInsuranceDetails(res.data.results);
      }
    };

    fetchPatientInsuranceDetails();
  }, [dispatchAction, id]);

  const fetchStates = useCallback(
    async (status: statusType) => {
      setIsStateLoading(true);
      const statesRes = await dispatchAction(getStates());
      if (!status.aborted && statesRes.data.results) {
        setStates(statesRes.data.results);
      }
      setIsStateLoading(false);
    },
    [dispatchAction]
  );

  useAbortableEffect(
    (status: statusType) => {
      if (id) {
        fetchData(status);
      }
      fetchStates(status);
    },
    [dispatch, fetchData]
  );

  useEffect(() => {
    async function fetchFacilityName() {
      if (facilityId && !id) {
        const res = await dispatchAction(getAnyFacility(facilityId));

        setFacilityName(res?.data?.name || "");
      } else {
        setFacilityName("");
      }
    }
    fetchFacilityName();
  }, [dispatchAction, facilityId]);

  const validateForm = () => {
    const errors = { ...initError };
    let invalidForm = false;
    let error_div = "";

    const insuranceDetailsError = insuranceDetails
      .map((policy) => HCXPolicyValidator(policy, enable_hcx))
      .find((error) => !!error);
    setInsuranceDetailsError(insuranceDetailsError);

    if (insuranceDetailsError) {
      invalidForm = true;
      error_div = "insurance_details";
    }

    Object.keys(state.form).forEach((field) => {
      let phoneNumber, emergency_phone_number;
      switch (field) {
        case "address":
        case "name":
        case "gender":
          if (!state.form[field]) {
            errors[field] = "Field is required";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        case "permanent_address":
          if (!sameAddress) {
            if (!state.form[field]) {
              errors[field] = "Field is required";
              if (!error_div) error_div = field;
              invalidForm = true;
            }
          }
          return;
        case "date_of_birth":
          if (!state.form[field]) {
            errors[field] = "Please enter date in YYYY/MM/DD format";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        case "local_body":
          if (
            state.form.nationality === "India" &&
            !Number(state.form[field])
          ) {
            errors[field] = "Please select local body";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        case "district":
          if (
            state.form.nationality === "India" &&
            !Number(state.form[field])
          ) {
            errors[field] = "Please select district";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        case "state":
          if (
            state.form.nationality === "India" &&
            !Number(state.form[field])
          ) {
            errors[field] = "Please enter the state";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        case "pincode":
          if (!validatePincode(state.form[field])) {
            errors[field] = "Please enter valid pincode";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        case "passport_no":
          if (state.form.nationality !== "India" && !state.form[field]) {
            errors[field] = "Please enter the passport number";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        case "phone_number":
          phoneNumber = parsePhoneNumberFromString(state.form[field]);
          if (!state.form[field] || !phoneNumber?.isPossible()) {
            errors[field] = "Please enter valid phone number";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        case "emergency_phone_number":
          emergency_phone_number = parsePhoneNumberFromString(
            state.form[field]
          );
          if (!state.form[field] || !emergency_phone_number?.isPossible()) {
            errors[field] = "Please enter valid phone number";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;

        case "estimated_contact_date":
          if (
            JSON.parse(state.form.contact_with_confirmed_carrier) ||
            JSON.parse(state.form.contact_with_suspected_carrier)
          ) {
            if (!state.form[field]) {
              errors[field] = "Please enter the estimated date of contact";
              if (!error_div) error_div = field;
              invalidForm = true;
            }
          }
          return;
        case "cluster_name":
          if (
            JSON.parse(state.form.contact_with_confirmed_carrier) ||
            JSON.parse(state.form.contact_with_suspected_carrier)
          ) {
            if (!state.form[field]) {
              errors[field] = "Please enter the name / cluster of the contact";
              if (!error_div) error_div = field;
              invalidForm = true;
            }
          }
          return;
        case "blood_group":
          if (!state.form[field]) {
            errors[field] = "Please select a blood group";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;

        case "is_vaccinated":
          if (state.form.is_vaccinated === "true") {
            if (state.form.number_of_doses === "0") {
              errors["number_of_doses"] =
                "Please fill the number of doses taken";
              if (!error_div) error_div = field;
              invalidForm = true;
            }
            if (
              state.form.vaccine_name === null ||
              state.form.vaccine_name === "Select"
            ) {
              errors["vaccine_name"] = "Please select vaccine name";
              if (!error_div) error_div = field;
              invalidForm = true;
            }

            if (!state.form.last_vaccinated_date) {
              errors["last_vaccinated_date"] =
                "Please enter last vaccinated date";
              if (!error_div) error_div = field;
              invalidForm = true;
            }
          }
          return;

        case "date_of_result":
          if (state.form[field] < state.form.date_of_test) {
            errors[field] =
              "Date should not be before the date of sample collection";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        case "disease_status":
          if (state.form[field] === "POSITIVE") {
            if (!state.form.date_of_test) {
              errors["date_of_test"] = "Please fill the date of sample testing";
              if (!error_div) error_div = field;
              invalidForm = true;
            }
            if (!state.form.date_of_result) {
              errors["date_of_result"] = "Please fill the date of result";
              if (!error_div) error_div = field;
              invalidForm = true;
            }
          }
          return;
        case "medical_history":
          if (!state.form[field].length) {
            errors[field] = (
              <span className="text-red-500">
                Please fill the medical history
              </span>
            );
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        default:
          return;
      }
    });

    dispatch({ type: "set_error", errors });
    return [!invalidForm, error_div];
  };

  const handlePincodeChange = async (e: any) => {
    handleFormFieldChange(e);

    if (!validatePincode(e.value)) return;

    const pincodeDetails = await getPincodeDetails(e.value, gov_data_api_key);
    if (!pincodeDetails) return;

    const matchedState = states?.find((state) => {
      return includesIgnoreCase(state.name, pincodeDetails.statename);
    });
    if (!matchedState) return;

    const fetchedDistricts = await fetchDistricts(matchedState.id);
    if (!fetchedDistricts) return;

    const matchedDistrict = fetchedDistricts.find((district) => {
      return includesIgnoreCase(district.name, pincodeDetails.district);
    });
    if (!matchedDistrict) return;

    dispatch({
      type: "set_form",
      form: {
        ...state.form,
        state: matchedState.id,
        district: matchedDistrict.id,
        pincode: e.value,
      },
    });

    fetchLocalBody(matchedDistrict.id);
    setShowAutoFilledPincode(true);
    setTimeout(() => {
      setShowAutoFilledPincode(false);
    }, 2000);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const [validForm, error_div] = validateForm();
    if (!validForm) {
      scrollTo(error_div);
    } else {
      setIsLoading(true);
      const medical_history: Array<medicalHistoryModel> = [];
      state.form.medical_history.forEach((id: number) => {
        const medData = MEDICAL_HISTORY_CHOICES.find((i) => i.id === id);
        if (medData) {
          const details = state.form[`medical_history_${medData.id}`];
          medical_history.push({
            disease: medData.text,
            details: details ? details : "",
          });
        }
      });
      const data = {
        phone_number: parsePhoneNumberFromString(
          state.form.phone_number
        )?.format("E.164"),
        emergency_phone_number: parsePhoneNumberFromString(
          state.form.emergency_phone_number
        )?.format("E.164"),
        date_of_birth: moment(state.form.date_of_birth).format("YYYY-MM-DD"),
        disease_status: state.form.disease_status,
        date_of_test: state.form.date_of_test
          ? state.form.date_of_test
          : undefined,
        date_of_result: state.form.date_of_result
          ? state.form.date_of_result
          : undefined,
        date_declared_positive:
          JSON.parse(state.form.is_declared_positive) &&
          state.form.date_declared_positive
            ? state.form.date_declared_positive
            : null,
        test_id: state.form.test_id,
        srf_id: state.form.srf_id,
        covin_id:
          state.form.is_vaccinated === "true" ? state.form.covin_id : undefined,
        is_vaccinated: state.form.is_vaccinated,
        number_of_doses:
          state.form.is_vaccinated === "true"
            ? Number(state.form.number_of_doses)
            : Number("0"),
        vaccine_name:
          state.form.vaccine_name &&
          state.form.vaccine_name !== "Select" &&
          state.form.is_vaccinated === "true"
            ? state.form.vaccine_name
            : null,
        last_vaccinated_date:
          state.form.is_vaccinated === "true"
            ? state.form.last_vaccinated_date
              ? state.form.last_vaccinated_date
              : null
            : null,
        test_type: state.form.test_type,
        name: state.form.name,
        pincode: state.form.pincode ? state.form.pincode : undefined,
        gender: Number(state.form.gender),
        nationality: state.form.nationality,
        is_antenatal: state.form.is_antenatal,
        passport_no:
          state.form.nationality !== "India"
            ? state.form.passport_no
            : undefined,
        state:
          state.form.nationality === "India" ? state.form.state : undefined,
        district:
          state.form.nationality === "India" ? state.form.district : undefined,
        local_body:
          state.form.nationality === "India"
            ? state.form.local_body
            : undefined,
        ward: state.form.ward,
        village: state.form.village,
        address: state.form.address ? state.form.address : undefined,
        permanent_address: sameAddress
          ? state.form.address
          : state.form.permanent_address
          ? state.form.permanent_address
          : undefined,
        present_health: state.form.present_health
          ? state.form.present_health
          : undefined,
        contact_with_confirmed_carrier: JSON.parse(
          state.form.contact_with_confirmed_carrier
        ),
        contact_with_suspected_carrier: JSON.parse(
          state.form.contact_with_suspected_carrier
        ),
        estimated_contact_date:
          (JSON.parse(state.form.contact_with_confirmed_carrier) ||
            JSON.parse(state.form.contact_with_suspected_carrier)) &&
          state.form.estimated_contact_date
            ? state.form.estimated_contact_date
            : null,
        cluster_name:
          (JSON.parse(state.form.contact_with_confirmed_carrier) ||
            JSON.parse(state.form.contact_with_suspected_carrier)) &&
          state.form.cluster_name
            ? state.form.cluster_name
            : null,
        allergies: state.form.allergies,
        number_of_primary_contacts: Number(
          state.form.number_of_primary_contacts
        )
          ? Number(state.form.number_of_primary_contacts)
          : undefined,
        number_of_secondary_contacts: Number(
          state.form.number_of_secondary_contacts
        )
          ? Number(state.form.number_of_secondary_contacts)
          : undefined,
        ongoing_medication: state.form.ongoing_medication,
        is_declared_positive: JSON.parse(state.form.is_declared_positive),
        designation_of_health_care_worker:
          state.form.designation_of_health_care_worker,
        instituion_of_health_care_worker:
          state.form.instituion_of_health_care_worker,
        blood_group: state.form.blood_group
          ? state.form.blood_group
          : undefined,
        medical_history,
        is_active: true,
      };
      const res = await dispatchAction(
        id
          ? updatePatient(data, { id })
          : createPatient({ ...data, facility: facilityId })
      );
      if (res && res.data && res.status != 400) {
        await Promise.all(
          insuranceDetails.map(async (obj) => {
            const policy = {
              ...obj,
              patient: res.data.id,
              insurer_id: obj.insurer_id || undefined,
              insurer_name: obj.insurer_name || undefined,
            };
            const policyRes = await (policy.id
              ? dispatchAction(
                  HCXActions.policies.update(
                    policy.id,
                    policy as HCXPolicyModel
                  )
                )
              : dispatchAction(
                  HCXActions.policies.create(policy as HCXPolicyModel)
                ));

            if (enable_hcx) {
              const eligibilityCheckRes = await dispatchAction(
                HCXActions.checkEligibility(policyRes.data.id)
              );
              if (eligibilityCheckRes.status === 200) {
                Notification.Success({ msg: "Checking Policy Eligibility..." });
              } else {
                Notification.Error({ msg: "Something Went Wrong..." });
              }
            }
          })
        );

        dispatch({ type: "set_form", form: initForm });
        if (!id) {
          setAlertMessage({
            show: true,
            message: `Please note down patient name: ${state.form.name} and patient ID: ${res.data.id}`,
            title: "Patient Added Successfully",
          });
          navigate(
            `/facility/${facilityId}/patient/${res.data.id}/consultation`
          );
        } else {
          Notification.Success({
            msg: "Patient updated successfully",
          });
          goBack();
        }
      }
      setIsLoading(false);
    }
  };

  const handleChange = (e: any) => {
    const form = { ...state.form };
    switch (e.target.name) {
      case "state":
        form["district"] = "0";
        form["local_body"] = "0";
        form["ward"] = "0";
        break;

      case "district":
        form["local_body"] = "0";
        form["ward"] = "0";
        break;

      case "local_body":
        form["ward"] = "0";
        break;
    }
    form[e.target.name] = e.target.value;
    dispatch({ type: "set_form", form });
  };

  const handleFormFieldChange = (e: FieldChangeEvent<unknown>) => {
    const form = { ...state.form };
    form[e.name] = e.value;
    dispatch({ type: "set_form", form });
  };

  const handleDateChange = (date: MaterialUiPickersDate, field: string) => {
    if (moment(date).isValid()) {
      const form = { ...state.form };
      form[field] = date;
      dispatch({ type: "set_form", form });
    }
  };

  const handleDOBChange = (e: FieldChangeEvent<Date>) => {
    if (moment(e.value).isValid()) {
      dispatch({
        type: "set_form",
        form: {
          ...state.form,
          [e.name]: moment(e.value).format("YYYY-MM-DD"),
        },
      });
    }
  };

  const handleMedicalCheckboxChange = (e: any, id: number) => {
    const form = { ...state.form };
    const values = state.form.medical_history;
    if (e.target.checked) {
      values.push(id);
    } else {
      values.splice(values.indexOf(id), 1);
    }
    form["medical_history"] = values;
    dispatch({ type: "set_form", form });
  };

  const duplicateCheck = useCallback(
    debounce(async (phoneNo: string) => {
      if (phoneNo && parsePhoneNumberFromString(phoneNo)?.isPossible()) {
        const query = {
          phone_number: parsePhoneNumberFromString(phoneNo)?.format("E.164"),
        };
        const res = await dispatchAction(searchPatient(query));
        if (res && res.data && res.data.results) {
          const duplicateList = !id
            ? res.data.results
            : res.data.results.filter(
                (item: DupPatientModel) => item.patient_id !== id
              );
          if (duplicateList.length) {
            setStatusDialog({
              show: true,
              patientList: duplicateList,
            });
          }
        }
      }
    }, 300),
    []
  );

  const handleDialogClose = (action: string) => {
    if (action === "transfer") {
      setStatusDialog({ ...statusDialog, show: false, transfer: true });
    } else if (action === "back") {
      setStatusDialog({ ...statusDialog, show: true, transfer: false });
    } else {
      setStatusDialog({ show: false, transfer: false, patientList: [] });
    }
  };

  const renderMedicalHistory = (id: number, title: string) => {
    const checkboxField = `medical_history_check_${id}`;
    const textField = `medical_history_${id}`;
    return (
      <div key={textField}>
        <div>
          <LegacyCheckboxField
            checked={state.form.medical_history.includes(id)}
            onChange={(e) => handleMedicalCheckboxChange(e, id)}
            name={checkboxField}
            label={id !== 1 ? title : "NONE"}
          />
        </div>
        {id !== 1 && state.form.medical_history.includes(id) && (
          <div className="mx-4">
            <TextAreaFormField
              placeholder="Details"
              rows={2}
              name={textField}
              value={state.form[textField]}
              onChange={handleFormFieldChange}
              error={state.errors[textField]}
            />
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="px-2 pb-2">
      {statusDialog.show && (
        <DuplicatePatientDialog
          patientList={statusDialog.patientList}
          handleOk={handleDialogClose}
          handleCancel={goBack}
          isNew={!id}
        />
      )}
      {statusDialog.transfer && (
        <DialogModal
          show={statusDialog.transfer}
          onClose={() => handleDialogClose("back")}
          title="Patient Transfer Form"
          className="max-w-md md:min-w-[600px]"
        >
          <TransferPatientDialog
            patientList={statusDialog.patientList}
            handleOk={() => handleDialogClose("close")}
            handleCancel={() => handleDialogClose("back")}
            facilityId={facilityId}
          />
        </DialogModal>
      )}
      <PageTitle
        title={headerText}
        className="mb-11"
        onBackClick={() => {
          if (showImport) {
            setShowImport(false);
            return false;
          } else {
            id
              ? navigate(`/facility/${facilityId}/patient/${id}`)
              : navigate(`/facility/${facilityId}`);
          }
        }}
        crumbsReplacements={{
          [facilityId]: { name: facilityName },
          [id || "????"]: { name: patientName },
        }}
      />
      <div className="mt-4">
        <div className="bg-purple-100 text-purple-800 p-4 font-semibold text-xs my-8 rounded mx-4">
          <div className="text-lg font-bold flex items-center mb-1">
            <CareIcon className=" care-l-info-circle text-2xl font-bold mr-1" />{" "}
            Please enter the correct date of birth for the patient
          </div>
          <p className="text-sm text-black font-normal">
            Each patient in the system is uniquely identifiable by the number
            and date of birth. Adding incorrect date of birth can result in
            duplication of patient records.
          </p>
        </div>
        <>
          {showAlertMessage.show && (
            <AlertDialog
              handleClose={goBack}
              message={showAlertMessage.message}
              title={showAlertMessage.title}
            />
          )}
          {showImport ? (
            <div className="p-4">
              <div>
                <div className="my-4">
                  <FieldLabel htmlFor="care-external-results-id" required>
                    Enter Care External Results Id
                  </FieldLabel>
                  <LegacyTextInputField
                    id="care-external-results-id"
                    name="care-external-results-id"
                    variant="outlined"
                    margin="dense"
                    type="text"
                    required
                    value={careExtId}
                    onChange={(e) => setCareExtId(e.target.value)}
                    errors={state.errors.name}
                  />
                </div>
                <button
                  className="btn btn-primary mr-4"
                  onClick={fetchExtResultData}
                  disabled={!careExtId}
                >
                  Import Patient Data from External Results
                </button>{" "}
                <button
                  className="btn border"
                  onClick={(_) => setShowImport(false)}
                >
                  Cancel Import
                </button>
              </div>
            </div>
          ) : (
            <>
              <>
                <ButtonV2
                  className="mb-8 mx-4 flex gap-2 items-center"
                  onClick={(_) => {
                    setShowImport(true);
                    setQuery({ extId: "" }, { replace: true });
                  }}
                >
                  <CareIcon className="care-l-import text-lg" />
                  Import From External Results
                </ButtonV2>
                <form onSubmit={(e) => handleSubmit(e)}>
                  <Card elevation={0} className="mb-8 rounded overflow-visible">
                    <CardContent>
                      <h1 className="font-bold text-purple-500 text-left text-xl mb-4">
                        Personal Details
                      </h1>
                      <div className="grid gap-4 xl:gap-x-20 xl:gap-y-6 grid-cols-1 md:grid-cols-2">
                        <div data-testid="phone-number" id="phone_number-div">
                          <PhoneNumberFormField
                            name="phone_number"
                            label="Phone Number"
                            required
                            value={state.form.phone_number}
                            onChange={(event) => {
                              duplicateCheck(event.value);
                              handleFormFieldChange(event);
                            }}
                            error={state.errors.phone_number}
                          />
                        </div>
                        <div
                          data-testid="emergency-phone-number"
                          id="emergency_phone_number-div"
                        >
                          <PhoneNumberFormField
                            label="Emergency contact number"
                            required
                            name="emergency_phone_number"
                            value={state.form.emergency_phone_number}
                            onChange={handleFormFieldChange}
                            error={state.errors.emergency_phone_number}
                          />
                        </div>
                        <div data-testid="name" id="name-div">
                          <FieldLabel htmlFor="name" id="name-label" required>
                            Name
                          </FieldLabel>
                          <TextFormField
                            id="name"
                            name="name"
                            value={state.form.name}
                            onChange={handleFormFieldChange}
                            error={state.errors.name}
                          />
                        </div>
                        <div data-testid="date-of-birth" id="date_of_birth-div">
                          <DateFormField
                            name="date_of_birth"
                            label="Date of Birth"
                            required
                            value={getDate(state.form.date_of_birth)}
                            onChange={handleDOBChange}
                            error={state.errors.date_of_birth}
                            position="LEFT"
                            disableFuture
                          />
                        </div>
                        <div data-testid="Gender" id="gender-div">
                          <SelectFormField
                            name="gender"
                            required
                            label="Gender"
                            optionLabel={(o: any) => o.text}
                            value={state.form.gender}
                            options={genderTypes}
                            onChange={handleFormFieldChange}
                            error={state.errors.gender}
                            optionValue={(o: any) => o.id}
                          />
                        </div>

                        <CollapseV2 opened={String(state.form.gender) === "2"}>
                          {
                            <div id="is_antenatal-div" className="col-span-2">
                              <FieldLabel
                                id="is_antenatal"
                                htmlFor="is_antenatal"
                              >
                                Is antenatal ?
                              </FieldLabel>
                              <RadioGroup
                                aria-label="is_antenatal"
                                id="is_antenatal"
                                name="is_antenatal"
                                value={state.form.is_antenatal}
                                onChange={handleChange}
                                style={{ padding: "0px 5px" }}
                              >
                                <Box display="flex" flexDirection="row">
                                  <FormControlLabel
                                    value="true"
                                    control={<Radio />}
                                    label="Yes"
                                  />
                                  <FormControlLabel
                                    value="false"
                                    control={<Radio />}
                                    label="No"
                                  />
                                </Box>
                              </RadioGroup>
                            </div>
                          }
                        </CollapseV2>
                        <div data-testid="current-address" id="address-div">
                          <FieldLabel
                            id="address-label"
                            htmlFor="address"
                            required
                          >
                            Current Address
                          </FieldLabel>
                          <TextAreaFormField
                            id="address"
                            name="address"
                            placeholder="Enter the current address"
                            value={state.form.address}
                            onChange={handleFormFieldChange}
                            error={state.errors.address}
                          />
                        </div>
                        <div
                          data-testid="permanent-address"
                          id="permanent_address-div"
                        >
                          <FieldLabel
                            htmlFor="permanent_address"
                            id="permanent-address-label"
                            required
                          >
                            Permanent Address
                          </FieldLabel>

                          <TextAreaFormField
                            rows={3}
                            id="permanent_address"
                            name="permanent_address"
                            disabled={sameAddress}
                            placeholder="Enter the permanent address"
                            value={
                              sameAddress
                                ? state.form.address
                                : state.form.permanent_address
                            }
                            onChange={handleFormFieldChange}
                            error={state.errors.permanent_address}
                          />

                          <LegacyCheckboxField
                            checked={sameAddress}
                            onChange={() => setSameAddress(!sameAddress)}
                            label="Same as Current Address"
                            className="font-bold"
                          />
                        </div>

                        <div data-testid="pincode" id="pincode-div">
                          <FieldLabel
                            htmlFor="pincode"
                            id="name-label"
                            required
                          >
                            Pincode
                          </FieldLabel>
                          <TextFormField
                            id="pincode"
                            name="pincode"
                            value={state.form.pincode}
                            onChange={handlePincodeChange}
                            error={state.errors.pincode}
                          />
                          {showAutoFilledPincode && (
                            <div>
                              <i className="fas fa-circle-check text-green-500 mr-2 text-sm" />
                              <span className="text-primary-500 text-sm">
                                State and District auto-filled from Pincode
                              </span>
                            </div>
                          )}
                        </div>
                        <div id="village-div">
                          <FieldLabel htmlFor="village" id="name-label">
                            Village
                          </FieldLabel>
                          <LegacyTextInputField
                            id="village"
                            name="village"
                            variant="outlined"
                            margin="dense"
                            type="text"
                            value={state.form.village}
                            onChange={handleChange}
                            errors={state.errors.village}
                          />
                        </div>
                        <div id="nationality-div">
                          <FieldLabel
                            id="nationality-label"
                            htmlFor="nationality"
                          >
                            Nationality
                          </FieldLabel>
                          <LegacySelectField
                            labelId="nationality"
                            name="nationality"
                            variant="outlined"
                            margin="dense"
                            optionArray={true}
                            value={state.form.nationality}
                            options={countryList}
                            onChange={handleChange}
                            errors={state.errors.nationality}
                          />
                        </div>
                        {state.form.nationality === "India" ? (
                          <>
                            <div data-testid="state" id="state-div">
                              {isStateLoading ? (
                                <CircularProgress size={20} />
                              ) : (
                                <SelectFormField
                                  {...field("state")}
                                  name="state"
                                  label="State"
                                  required
                                  placeholder="Choose State"
                                  value={state.form.state}
                                  options={states}
                                  optionLabel={(o: any) => o.name}
                                  optionValue={(o: any) => o.id}
                                  onChange={(e: any) => [
                                    handleFormFieldChange(e),
                                    fetchDistricts(e.value),
                                  ]}
                                  error={state.errors.state}
                                />
                              )}
                            </div>

                            <div data-testid="district" id="district-div">
                              {isDistrictLoading ? (
                                <CircularProgress size={20} />
                              ) : (
                                <SelectFormField
                                  {...field("district")}
                                  name="district"
                                  label="District"
                                  required
                                  placeholder={
                                    state.form.state
                                      ? "Choose District"
                                      : "Select State First"
                                  }
                                  disabled={!state.form.state}
                                  value={state.form.district}
                                  options={districts}
                                  optionLabel={(o: any) => o.name}
                                  optionValue={(o: any) => o.id}
                                  onChange={(e: any) => [
                                    handleFormFieldChange(e),
                                    fetchLocalBody(String(e.value)),
                                  ]}
                                  error={state.errors.district}
                                />
                              )}
                            </div>

                            <div data-testid="localbody" id="local_body-div">
                              {isLocalbodyLoading ? (
                                <CircularProgress size={20} />
                              ) : (
                                <SelectFormField
                                  {...field("local_body")}
                                  name="local_body"
                                  label="Localbody"
                                  required
                                  placeholder={
                                    state.form.district
                                      ? "Choose Localbody"
                                      : "Select District First"
                                  }
                                  disabled={!state.form.district}
                                  value={state.form.local_body}
                                  options={localBody}
                                  optionLabel={(o: any) => o.name}
                                  optionValue={(o: any) => o.id}
                                  onChange={(e: any) => [
                                    handleFormFieldChange(e),
                                    fetchWards(String(e.value)),
                                  ]}
                                  error={state.errors.local_body}
                                />
                              )}
                            </div>
                            <div
                              data-testid="ward-respective-lsgi"
                              id="ward-div"
                            >
                              {isWardLoading ? (
                                <CircularProgress size={20} />
                              ) : (
                                <SelectFormField
                                  label="Ward"
                                  name="ward"
                                  options={ward
                                    .sort((a, b) => a.number - b.number)
                                    .map((e) => {
                                      return {
                                        id: e.id,
                                        name: e.number + ": " + e.name,
                                      };
                                    })}
                                  value={state.form.ward}
                                  placeholder={
                                    state.form.local_body
                                      ? "Choose Ward"
                                      : "Select Localbody First"
                                  }
                                  disabled={!state.form.local_body}
                                  optionLabel={(o: any) => o.name}
                                  optionValue={(o: any) => o.id}
                                  onChange={handleFormFieldChange}
                                  error={state.errors.ward}
                                />
                              )}
                            </div>
                          </>
                        ) : (
                          <div id="passport_no-div">
                            <FieldLabel
                              htmlFor="passport_no"
                              id="passport-label"
                              required
                            >
                              Passport Number
                            </FieldLabel>
                            <LegacyTextInputField
                              id="passport_no"
                              name="passport_no"
                              variant="outlined"
                              margin="dense"
                              value={state.form.passport_no}
                              onChange={handleChange}
                              errors={state.errors.passport_no}
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  <Card elevation={0} className="mb-8 rounded">
                    <AccordionV2
                      className="mt-2 lg:mt-0 md:mt-0 bg-white shadow-sm rounded-lg p-3 relative"
                      expandIcon={
                        <CareIcon className="care-l-angle-down text-2xl font-bold" />
                      }
                      title={
                        <h1 className="font-bold text-purple-500 text-left text-xl">
                          COVID Details
                        </h1>
                      }
                    >
                      <div>
                        <div className="grid gap-4 xl:gap-x-20 xl:gap-y-6 grid-cols-1 md:grid-cols-2 w-full mt-5">
                          <div id="is_vaccinated-div">
                            <FieldLabel
                              id="is_vaccinated"
                              htmlFor="is_vaccinated"
                            >
                              Is patient Vaccinated against COVID?
                            </FieldLabel>
                            <RadioGroup
                              aria-label="is_vaccinated"
                              id="is_vaccinated"
                              name="is_vaccinated"
                              value={state.form.is_vaccinated}
                              onChange={handleChange}
                              style={{ padding: "0px 5px" }}
                            >
                              <Box display="flex" flexDirection="row">
                                <FormControlLabel
                                  value="true"
                                  control={<Radio />}
                                  label="Yes"
                                />
                                <FormControlLabel
                                  value="false"
                                  control={<Radio />}
                                  label="No"
                                />
                              </Box>
                            </RadioGroup>
                          </div>
                          <CollapseV2
                            opened={String(state.form.is_vaccinated) === "true"}
                          >
                            {
                              <div className="grid gap-4 xl:gap-x-20 xl:gap-y-6 grid-cols-1 md:grid-cols-2">
                                <div id="covin_id-div">
                                  <FieldLabel
                                    id="covin_id-label"
                                    htmlFor="covin_id"
                                  >
                                    COWIN ID
                                  </FieldLabel>
                                  <LegacyTextInputField
                                    id="covin_id"
                                    name="covin_id"
                                    variant="outlined"
                                    margin="dense"
                                    type="text"
                                    value={state.form.covin_id}
                                    onChange={handleChange}
                                    errors={state.errors.covin_id}
                                  />
                                </div>
                                <div id="number_of_doses-div">
                                  <FieldLabel
                                    id="doses-label"
                                    htmlFor="number_of_doses"
                                  >
                                    Number of doses
                                  </FieldLabel>
                                  <RadioGroup
                                    aria-label="number_of_doses"
                                    id="number_of_doses"
                                    name="number_of_doses"
                                    value={state.form.number_of_doses}
                                    onChange={handleChange}
                                    style={{ padding: "0px 5px" }}
                                  >
                                    <div className="flex flex-wrap">
                                      <FormControlLabel
                                        value="1"
                                        control={<Radio />}
                                        label="1"
                                      />
                                      <FormControlLabel
                                        value="2"
                                        control={<Radio />}
                                        label="2"
                                      />
                                      <FormControlLabel
                                        value="3"
                                        control={<Radio />}
                                        label="3 (Booster/Precautionary Dose)"
                                      />
                                    </div>
                                  </RadioGroup>
                                  <LegacyErrorHelperText
                                    error={state.errors.number_of_doses}
                                  />
                                </div>
                                <div id="vaccine_name-div">
                                  <FieldLabel
                                    id="vaccine-name-label"
                                    htmlFor="vaccine_name"
                                    required
                                  >
                                    Vaccine Name
                                  </FieldLabel>
                                  <LegacySelectField
                                    labelId="vaccine_name"
                                    name="vaccine_name"
                                    variant="outlined"
                                    margin="dense"
                                    optionArray={true}
                                    value={state.form.vaccine_name}
                                    options={vaccines}
                                    onChange={handleChange}
                                    errors={state.errors.vaccine_name}
                                  />
                                </div>
                                <div id="last_vaccinated_date-div">
                                  <FieldLabel
                                    id="last_vaccinated_date-label"
                                    htmlFor="last_vaccinated_date"
                                    required
                                  >
                                    Last Date of Vaccination
                                  </FieldLabel>
                                  <LegacyDateInputField
                                    id="last_vaccinated_date"
                                    fullWidth={true}
                                    value={state.form.last_vaccinated_date}
                                    onChange={(date) =>
                                      handleDateChange(
                                        date,
                                        "last_vaccinated_date"
                                      )
                                    }
                                    errors={state.errors.last_vaccinated_date}
                                    inputVariant="outlined"
                                    margin="dense"
                                    openTo="year"
                                    disableFuture={true}
                                  />
                                </div>
                              </div>
                            }
                          </CollapseV2>
                          <div id="contact_with_confirmed_carrier-div">
                            <FieldLabel htmlFor="contact_with_confirmed_carrier">
                              Contact with confirmed Covid patient?
                            </FieldLabel>
                            <RadioGroup
                              aria-label="contact_with_confirmed_carrier"
                              id="contact_with_confirmed_carrier"
                              name="contact_with_confirmed_carrier"
                              value={state.form.contact_with_confirmed_carrier}
                              onChange={handleChange}
                              style={{ padding: "0px 5px" }}
                            >
                              <Box display="flex" flexDirection="row">
                                <FormControlLabel
                                  value="true"
                                  control={<Radio />}
                                  label="Yes"
                                />
                                <FormControlLabel
                                  value="false"
                                  control={<Radio />}
                                  label="No"
                                />
                              </Box>
                            </RadioGroup>
                          </div>
                          <div id="contact_with_suspected_carrier-div">
                            <FieldLabel htmlFor="contact_with_suspected_carrier">
                              Contact with Covid suspect?
                            </FieldLabel>
                            <RadioGroup
                              aria-label="contact_with_suspected_carrier"
                              id="contact_with_suspected_carrier"
                              name="contact_with_suspected_carrier"
                              value={state.form.contact_with_suspected_carrier}
                              onChange={handleChange}
                              style={{ padding: "0px 5px" }}
                            >
                              <Box display="flex" flexDirection="row">
                                <FormControlLabel
                                  value="true"
                                  control={<Radio />}
                                  label="Yes"
                                />
                                <FormControlLabel
                                  value="false"
                                  control={<Radio />}
                                  label="No"
                                />
                              </Box>
                            </RadioGroup>
                          </div>
                          <CollapseV2
                            opened={
                              JSON.parse(
                                state.form.contact_with_confirmed_carrier
                              ) ||
                              JSON.parse(
                                state.form.contact_with_suspected_carrier
                              )
                            }
                          >
                            <div className="grid gap-4 xl:gap-x-20 xl:gap-y-6 grid-cols-1 md:grid-cols-2">
                              <div id="estimated_contact_date-div">
                                <FieldLabel
                                  id="estimated_contact_date-label"
                                  htmlFor="estimated_contact_date"
                                  required
                                >
                                  Estimate date of contact
                                </FieldLabel>
                                <LegacyDateInputField
                                  fullWidth={true}
                                  id="estimated_contact_date"
                                  value={state.form.estimated_contact_date}
                                  onChange={(date) =>
                                    handleDateChange(
                                      date,
                                      "estimated_contact_date"
                                    )
                                  }
                                  errors={state.errors.estimated_contact_date}
                                  inputVariant="outlined"
                                  margin="dense"
                                  disableFuture={true}
                                />
                              </div>

                              <div id="cluster_name-div">
                                <FieldLabel
                                  htmlFor="cluster_name"
                                  id="cluster_name-label"
                                  required
                                >
                                  Name / Cluster of Contact
                                </FieldLabel>
                                <LegacyTextInputField
                                  id="cluster_name"
                                  name="cluster_name"
                                  variant="outlined"
                                  margin="dense"
                                  type="text"
                                  placeholder="Name / Cluster of Contact"
                                  value={state.form.cluster_name}
                                  onChange={handleChange}
                                  errors={state.errors.cluster_name}
                                />
                              </div>
                            </div>
                          </CollapseV2>
                          <div
                            data-testid="disease-status"
                            id="disease_status-div"
                          >
                            <FieldLabel
                              htmlFor="disease_status"
                              id="disease_status-label"
                              required
                            >
                              COVID Disease Status
                            </FieldLabel>
                            <LegacySelectField
                              labelId="disease_status"
                              name="disease_status"
                              variant="outlined"
                              margin="dense"
                              optionArray={true}
                              value={state.form.disease_status}
                              options={diseaseStatus}
                              onChange={handleChange}
                              errors={state.errors.disease_status}
                            />
                          </div>
                          <div id="test_type-div">
                            <FieldLabel
                              id="test_type-label"
                              htmlFor="test_type"
                              required
                            >
                              COVID Test Type
                            </FieldLabel>
                            <LegacySelectField
                              labelId="test_type"
                              name="test_type"
                              variant="outlined"
                              margin="dense"
                              optionArray={true}
                              value={state.form.test_type}
                              options={testType}
                              onChange={handleChange}
                              errors={state.errors.test_type}
                            />
                          </div>
                          <div id="srf_id-div">
                            <FieldLabel id="srf_id-label" htmlFor="srf_id">
                              SRF Id for COVID Test
                            </FieldLabel>
                            <LegacyTextInputField
                              id="srf_id"
                              name="srf_id"
                              variant="outlined"
                              margin="dense"
                              type="text"
                              value={state.form.srf_id}
                              onChange={handleChange}
                              errors={state.errors.srf_id}
                            />
                          </div>
                          <div id="is_declared_positive-div">
                            <FieldLabel
                              id="is_declared_positive"
                              htmlFor="is_declared_positive"
                            >
                              Is patient declared covid postive by state?
                            </FieldLabel>
                            <RadioGroup
                              aria-label="is_declared_positive"
                              id="is_declared_positive"
                              name="is_declared_positive"
                              value={state.form.is_declared_positive}
                              onChange={handleChange}
                              style={{ padding: "0px 5px" }}
                            >
                              <Box display="flex" flexDirection="row">
                                <FormControlLabel
                                  value="true"
                                  control={<Radio />}
                                  label="Yes"
                                />
                                <FormControlLabel
                                  value="false"
                                  control={<Radio />}
                                  label="No"
                                />
                              </Box>
                            </RadioGroup>
                            <CollapseV2
                              opened={
                                String(state.form.is_declared_positive) ===
                                "true"
                              }
                              className="mt-4"
                            >
                              <div id="date_declared_positive-div">
                                <FieldLabel id="date_declared_positive-label">
                                  Date Patient is Declared Positive for COVID
                                </FieldLabel>
                                <LegacyDateInputField
                                  fullWidth={true}
                                  value={state.form.date_declared_positive}
                                  onChange={(date) =>
                                    handleDateChange(
                                      date,
                                      "date_declared_positive"
                                    )
                                  }
                                  errors={state.errors.date_declared_positive}
                                  inputVariant="outlined"
                                  margin="dense"
                                  disableFuture={true}
                                />
                              </div>
                            </CollapseV2>
                          </div>
                          <div id="test_id-div">
                            <FieldLabel id="test_id-label" htmlFor="test_id">
                              COVID Positive ID issued by ICMR
                            </FieldLabel>
                            <LegacyTextInputField
                              id="test_id"
                              name="test_id"
                              variant="outlined"
                              margin="dense"
                              type="number"
                              value={state.form.test_id}
                              onChange={handleChange}
                              errors={state.errors.test_id}
                            />
                          </div>

                          <div id="date_of_test-div">
                            <FieldLabel
                              id="date_of_birth-label"
                              htmlFor="date_of_test"
                            >
                              Date of Sample given for COVID Test
                            </FieldLabel>
                            <LegacyDateInputField
                              fullWidth={true}
                              id="date_of_test"
                              value={state.form.date_of_test}
                              onChange={(date) =>
                                handleDateChange(date, "date_of_test")
                              }
                              errors={state.errors.date_of_test}
                              inputVariant="outlined"
                              margin="dense"
                              disableFuture={true}
                            />
                          </div>
                          <div id="date_of_result-div">
                            <FieldLabel
                              htmlFor="date_of_result"
                              id="date_of_result-label"
                            >
                              Date of Result for COVID Test
                            </FieldLabel>
                            <LegacyDateInputField
                              fullWidth={true}
                              id="date_of_result"
                              value={state.form.date_of_result}
                              onChange={(date) =>
                                handleDateChange(date, "date_of_result")
                              }
                              errors={state.errors.date_of_result}
                              inputVariant="outlined"
                              margin="dense"
                              disableFuture={true}
                            />
                          </div>

                          <div id="number_of_primary_contacts-div">
                            <FieldLabel
                              id="number_of_primary_contacts-label"
                              htmlFor="number_of_primary_contacts"
                            >
                              Number Of Primary Contacts for COVID
                            </FieldLabel>
                            <LegacyTextInputField
                              id="number_of_primary_contacts"
                              name="number_of_primary_contacts"
                              variant="outlined"
                              margin="dense"
                              type="number"
                              value={state.form.number_of_primary_contacts}
                              onChange={handleChange}
                              errors={state.errors.number_of_primary_contacts}
                            />
                          </div>
                          <div id="number_of_secondary_contacts-div">
                            <FieldLabel
                              id="number_of_secondary_contacts-label"
                              htmlFor="number_of_secondary_contacts"
                            >
                              Number Of Secondary Contacts for COVID
                            </FieldLabel>
                            <LegacyTextInputField
                              id="number_of_secondary_contacts"
                              name="number_of_secondary_contacts"
                              variant="outlined"
                              margin="dense"
                              type="number"
                              value={state.form.number_of_secondary_contacts}
                              onChange={handleChange}
                              errors={state.errors.number_of_secondary_contacts}
                            />
                          </div>
                        </div>
                      </div>
                    </AccordionV2>
                  </Card>
                  <Card elevation={0} className="mb-8 rounded overflow-visible">
                    <CardContent>
                      <h1 className="font-bold text-purple-500 text-left text-xl mb-4">
                        Medical History
                      </h1>
                      <div className="grid gap-4 xl:gap-x-20 xl:gap-y-6 grid-cols-1 md:grid-cols-2">
                        <div id="present_health-div">
                          <FieldLabel
                            id="present_health-label"
                            htmlFor="present_health"
                          >
                            Present Health Condition
                          </FieldLabel>
                          <TextAreaFormField
                            rows={3}
                            id="present_health"
                            name="present_health"
                            placeholder="Optional Information"
                            value={state.form.present_health}
                            onChange={handleFormFieldChange}
                            error={state.errors.present_health}
                          />
                        </div>

                        <div id="ongoing_medication-div">
                          <FieldLabel
                            htmlFor="ongoing_medication"
                            id="ongoing_medication-label"
                          >
                            Ongoing Medication
                          </FieldLabel>
                          <TextAreaFormField
                            rows={3}
                            id="ongoing_medication"
                            name="ongoing_medication"
                            placeholder="Optional Information"
                            value={state.form.ongoing_medication}
                            onChange={handleFormFieldChange}
                            error={state.errors.ongoing_medication}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <FieldLabel id="med-history-label" required>
                            Any medical history? (Comorbidities)
                          </FieldLabel>
                          <div className="flex flex-wrap">
                            {MEDICAL_HISTORY_CHOICES.map((i) => {
                              return renderMedicalHistory(i.id, i.text);
                            })}
                          </div>
                          <LegacyErrorHelperText
                            error={state.errors.medical_history}
                          />
                        </div>

                        <div id="allergies-div">
                          <FieldLabel htmlFor="allergies" id="allergies_label">
                            Allergies
                          </FieldLabel>
                          <TextAreaFormField
                            rows={1}
                            id="allergies"
                            name="allergies"
                            placeholder="Optional Information"
                            value={state.form.allergies}
                            onChange={handleFormFieldChange}
                            error={state.errors.allergies}
                          />
                        </div>

                        <div data-testid="blood-group" id="blood_group-div">
                          <SelectFormField
                            position="above"
                            label="Blood Group"
                            name="blood_group"
                            required
                            value={state.form.blood_group}
                            options={bloodGroups}
                            optionLabel={(o: any) => o}
                            onChange={handleFormFieldChange}
                            error={state.errors.blood_group}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <div className="bg-white rounded flex flex-col gap-4 w-full p-4">
                    <div className="flex w-full items-center justify-between">
                      <h1 className="font-bold text-purple-500 text-left text-xl">
                        Insurance Details
                      </h1>
                      <ButtonV2
                        type="button"
                        variant="alert"
                        border
                        ghost={insuranceDetails.length !== 0}
                        onClick={() =>
                          setInsuranceDetails([
                            ...insuranceDetails,
                            {
                              id: "",
                              subscriber_id: "",
                              policy_id: "",
                              insurer_id: "",
                              insurer_name: "",
                            },
                          ])
                        }
                      >
                        <CareIcon className="care-l-plus text-lg" />
                        <span>Add Insurance Details</span>
                      </ButtonV2>
                    </div>
                    <InsuranceDetailsBuilder
                      name="insurance_details"
                      value={insuranceDetails}
                      onChange={({ value }) => setInsuranceDetails(value)}
                      error={insuranceDetailsError}
                      gridView
                    />
                  </div>
                  <div className="flex items-center my-4 mx-4">
                    <button
                      className="btn btn-large btn-primary mr-4"
                      type="submit"
                      onClick={(e) => handleSubmit(e)}
                      data-testid="submit-button"
                    >
                      {buttonText}
                    </button>
                    <button
                      className="btn btn-default bg-gray-300 hover:bg-gray-400 btn-large   mr-4"
                      type="button"
                      onClick={() => goBack()}
                    >
                      {" "}
                      Cancel{" "}
                    </button>
                  </div>
                </form>
              </>
            </>
          )}
        </>
      </div>
    </div>
  );
};
