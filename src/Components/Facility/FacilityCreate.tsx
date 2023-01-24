import {
  Card,
  CardContent,
  CircularProgress,
  IconButton,
} from "@material-ui/core";
import Popover from "@material-ui/core/Popover";
import MyLocationIcon from "@material-ui/icons/MyLocation";
import { navigate } from "raviger";
import loadable from "@loadable/component";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import React, { useCallback, useReducer, useState } from "react";
import { useDispatch } from "react-redux";
import {
  BED_TYPES,
  FACILITY_FEATURE_TYPES,
  FACILITY_TYPES,
  KASP_ENABLED,
  KASP_STRING,
} from "../../Common/constants";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  phonePreg,
  validatePincode,
  validateLatitude,
  validateLongitude,
} from "../../Common/validation";
import {
  createFacility,
  getDistrictByState,
  getPermittedFacility,
  getLocalbodyByDistrict,
  getStates,
  updateFacility,
  getWardByLocalBody,
  listCapacity,
  listDoctor,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { ErrorHelperText } from "../Common/HelperInputFields";
import GLocationPicker from "../Common/GLocationPicker";
import {
  includesIgnoreCase as includesIgnoreCase,
  getPincodeDetails,
  goBack,
} from "../../Utils/utils";
import useWindowDimensions from "../../Common/hooks/useWindowDimensions";
import MultiSelectMenuV2 from "../Form/MultiSelectMenuV2";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import { FieldChangeEvent } from "../Form/FormFields/Utils";
import SelectMenuV2 from "../Form/SelectMenuV2";
import RadioInputsV2 from "../Common/components/RadioInputsV2";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import TextFormField from "../Form/FormFields/TextFormField";
import { FieldLabel } from "../Form/FormFields/FormField";
import Steps, { Step } from "../Common/Steps";
import { BedCapacity } from "./BedCapacity";
import { DoctorCapacity } from "./DoctorCapacity";
import PhoneNumberFormField from "../Form/FormFields/PhoneNumberFormField";
import { CapacityModal, DoctorModal } from "./models";
import BedTypeCard from "./BedTypeCard";
import DoctorsCountCard from "./DoctorsCountCard";
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

interface FacilityProps {
  facilityId?: string;
}

interface StateObj {
  id: number;
  name: string;
}

interface WardObj extends StateObj {
  number: number;
}

type FacilityForm = {
  facility_type: string;
  name: string;
  state: number;
  district: number;
  local_body: number;
  features: number[];
  ward: number;
  kasp_empanelled: string;
  address: string;
  phone_number: string;
  latitude: string;
  longitude: string;
  pincode: string;
  oxygen_capacity: number;
  type_b_cylinders: number;
  type_c_cylinders: number;
  type_d_cylinders: number;
  expected_oxygen_requirement: number;
  expected_type_b_cylinders: number;
  expected_type_c_cylinders: number;
  expected_type_d_cylinders: number;
};

const initForm: FacilityForm = {
  facility_type: "Private Hospital",
  name: "",
  state: 0,
  district: 0,
  local_body: 0,
  ward: 0,
  kasp_empanelled: "false",
  features: [],
  address: "",
  phone_number: "",
  latitude: "",
  longitude: "",
  pincode: "",
  oxygen_capacity: 0,
  type_b_cylinders: 0,
  type_c_cylinders: 0,
  type_d_cylinders: 0,
  expected_oxygen_requirement: 0,
  expected_type_b_cylinders: 0,
  expected_type_c_cylinders: 0,
  expected_type_d_cylinders: 0,
};

const initError: Record<keyof FacilityForm, string> = Object.assign(
  {},
  ...Object.keys(initForm).map((k) => ({ [k]: "" }))
);

const initialState = {
  form: { ...initForm },
  errors: { ...initError },
};

type SetFormAction = { type: "set_form"; form: FacilityForm };
type SetErrorAction = {
  type: "set_error";
  errors: Record<keyof FacilityForm, string>;
};
type FacilityCreateFormAction = SetFormAction | SetErrorAction;

const facilityCreateReducer = (
  state = initialState,
  action: FacilityCreateFormAction
) => {
  switch (action.type) {
    case "set_form":
      return { ...state, form: action.form };
    case "set_error":
      return { ...state, errors: action.errors };
  }
};

export const FacilityCreate = (props: FacilityProps) => {
  const dispatchAction: any = useDispatch();
  const { facilityId } = props;

  const [state, dispatch] = useReducer(facilityCreateReducer, initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [isStateLoading, setIsStateLoading] = useState(false);
  const [isDistrictLoading, setIsDistrictLoading] = useState(false);
  const [isLocalbodyLoading, setIsLocalbodyLoading] = useState(false);
  const [isWardLoading, setIsWardLoading] = useState(false);
  const [states, setStates] = useState<StateObj[]>([]);
  const [districts, setDistricts] = useState<StateObj[]>([]);
  const [localBodies, setLocalBodies] = useState<StateObj[]>([]);
  const [ward, setWard] = useState<WardObj[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [createdFacilityId, setCreatedFacilityId] = useState("");
  const { width } = useWindowDimensions();
  const [showAutoFilledPincode, setShowAutoFilledPincode] = useState(false);
  const [capacityData, setCapacityData] = useState<Array<CapacityModal>>([]);
  const [doctorData, setDoctorData] = useState<Array<DoctorModal>>([]);
  const [bedCapacityKey, setBedCapacityKey] = useState(0);
  const [docCapacityKey, setDocCapacityKey] = useState(0);

  const [anchorEl, setAnchorEl] = React.useState<
    (EventTarget & Element) | null
  >(null);

  const headerText = !facilityId ? "Create Facility" : "Update Facility";
  const buttonText = !facilityId ? "Save Facility" : "Update Facility";

  const fetchDistricts = useCallback(
    async (id: number) => {
      if (id > 0) {
        setIsDistrictLoading(true);
        const districtList = await dispatchAction(getDistrictByState({ id }));
        if (districtList) {
          setDistricts([...districtList.data]);
        }
        setIsDistrictLoading(false);
        return districtList ? [...districtList.data] : [];
      }
    },
    [dispatchAction]
  );

  const fetchLocalBody = useCallback(
    async (id: number) => {
      if (id > 0) {
        setIsLocalbodyLoading(true);
        const localBodyList = await dispatchAction(
          getLocalbodyByDistrict({ id })
        );
        setIsLocalbodyLoading(false);
        if (localBodyList) {
          setLocalBodies([...localBodyList.data]);
        }
      }
    },
    [dispatchAction]
  );

  const getSteps = (): Step[] => {
    return [
      {
        id: 1,
        name: "Facility details",
        onClick: () => {
          setCurrentStep(1);
        },
        status: currentStep === 1 ? "current" : "complete",
        disabled: currentStep > 1,
      },
      {
        id: 2,
        name: "Bed Capacity",
        onClick: () => {
          setCurrentStep(2);
        },
        status:
          currentStep === 2
            ? "current"
            : currentStep > 2
            ? "complete"
            : "upcoming",
        disabled: createdFacilityId == "",
      },
      {
        id: 3,
        name: "Doctor Capacity",
        onClick: () => {
          setCurrentStep(3);
        },
        disabled: createdFacilityId == "",
        status: currentStep === 3 ? "current" : "upcoming",
      },
    ];
  };

  const fetchWards = useCallback(
    async (id: number) => {
      if (id > 0) {
        setIsWardLoading(true);
        const wardList = await dispatchAction(getWardByLocalBody({ id }));
        setIsWardLoading(false);
        if (wardList) {
          setWard([...wardList.data.results]);
        }
      }
    },
    [dispatchAction]
  );

  const fetchData = useCallback(
    async (status: statusType) => {
      if (facilityId) {
        setIsLoading(true);
        const res = await dispatchAction(getPermittedFacility(facilityId));
        if (!status.aborted && res.data) {
          const formData = {
            facility_type: res.data.facility_type,
            name: res.data.name,
            state: res.data.state ? res.data.state : 0,
            district: res.data.district ? res.data.district : 0,
            local_body: res.data.local_body ? res.data.local_body : 0,
            features: res.data.features || [],
            ward: res.data.ward_object ? res.data.ward_object.id : 0,
            kasp_empanelled: res.data.kasp_empanelled
              ? String(res.data.kasp_empanelled)
              : "false",
            address: res.data.address,
            pincode: res.data.pincode,
            phone_number:
              res.data.phone_number.length == 10
                ? "+91" + res.data.phone_number
                : res.data.phone_number,
            latitude: res.data.latitude || "",
            longitude: res.data.longitude || "",
            type_b_cylinders: res.data.type_b_cylinders,
            type_c_cylinders: res.data.type_c_cylinders,
            type_d_cylinders: res.data.type_d_cylinders,
            expected_type_b_cylinders: res.data.expected_type_b_cylinders,
            expected_type_c_cylinders: res.data.expected_type_c_cylinders,
            expected_type_d_cylinders: res.data.expected_type_d_cylinders,
            expected_oxygen_requirement: res.data.expected_oxygen_requirement,
            oxygen_capacity: res.data.oxygen_capacity,
          };
          dispatch({ type: "set_form", form: formData });
          Promise.all([
            fetchDistricts(res.data.state),
            fetchLocalBody(res.data.district),
            fetchWards(res.data.local_body),
          ]);
        } else {
          navigate(`/facility/${facilityId}`);
        }
        setIsLoading(false);
      }
    },
    [dispatchAction, facilityId, fetchDistricts, fetchLocalBody, fetchWards]
  );

  const fetchStates = useCallback(
    async (status: statusType) => {
      setIsStateLoading(true);
      const statesRes = await dispatchAction(getStates());
      if (!status.aborted && statesRes.data.results) {
        setStates([...statesRes.data.results]);
      }
      setIsStateLoading(false);
    },
    [dispatchAction]
  );

  useAbortableEffect(
    (status: statusType) => {
      if (facilityId) {
        fetchData(status);
      }
      fetchStates(status);
    },
    [dispatch, fetchData]
  );

  const handleChange = (e: FieldChangeEvent<string>) => {
    dispatch({
      type: "set_form",
      form: { ...state.form, [e.name]: e.value },
    });
  };

  const handleLocationChange = (location: google.maps.LatLng | undefined) => {
    if (location) {
      dispatch({
        type: "set_form",
        form: {
          ...state.form,
          latitude: location.lat().toString(),
          longitude: location.lng().toString(),
        },
      });
    }
  };

  const handlePincodeChange = async (e: FieldChangeEvent<string>) => {
    handleChange(e);

    if (!validatePincode(e.value)) return;

    const pincodeDetails = await getPincodeDetails(e.value);
    if (!pincodeDetails) return;

    const matchedState = states.find((state) => {
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

  const handleValueChange = (value: any, field: string) => {
    dispatch({
      type: "set_form",
      form: { ...state.form, [field]: value },
    });
  };

  const handleSelectCurrentLocation = (
    setCenter: (lat: number, lng: number) => void
  ) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        dispatch({
          type: "set_form",
          form: {
            ...state.form,
            latitude: String(position.coords.latitude),
            longitude: String(position.coords.longitude),
          },
        });

        setCenter?.(position.coords.latitude, position.coords.longitude);
      });
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const validateForm = () => {
    const errors = { ...initError };
    let invalidForm = false;
    Object.keys(state.form).forEach((field) => {
      switch (field) {
        case "name":
        case "address":
          if (!state.form[field]) {
            errors[field] = "Field is required";
            invalidForm = true;
          }
          return;

        case "district":
        case "state":
        case "local_body":
        case "ward":
          if (!Number(state.form[field])) {
            errors[field] = "Field is required";
            invalidForm = true;
          }
          return;

        case "pincode":
          if (!validatePincode(state.form[field])) {
            errors[field] = "Please enter valid pincode";
            invalidForm = true;
          }
          return;
        case "phone_number":
          // eslint-disable-next-line no-case-declarations
          const phoneNumber = parsePhoneNumberFromString(state.form[field]);
          if (
            !state.form[field] ||
            !phoneNumber?.isPossible() ||
            !phonePreg(String(phoneNumber?.number))
          ) {
            errors[field] = "Please enter valid phone number";
            invalidForm = true;
          }
          return;
        case "latitude":
          if (!!state.form.latitude && !validateLatitude(state.form[field])) {
            errors[field] = "Please enter valid latitude between -90 and 90.";
            invalidForm = true;
          }
          return;
        case "longitude":
          if (!!state.form.longitude && !validateLongitude(state.form[field])) {
            errors[field] =
              "Please enter valid longitude between -180 and 180.";
            invalidForm = true;
          }
          return;

        default:
          return;
      }
    });
    if (invalidForm) {
      dispatch({ type: "set_error", errors });
      return false;
    }
    dispatch({ type: "set_error", errors });
    return true;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const validated = validateForm();
    console.log(state.form);
    if (validated) {
      setIsLoading(true);
      const data = {
        facility_type: state.form.facility_type,
        name: state.form.name,
        district: state.form.district,
        state: state.form.state,
        address: state.form.address,
        pincode: state.form.pincode,
        local_body: state.form.local_body,
        features: state.form.features,
        ward: state.form.ward,
        kasp_empanelled: JSON.parse(state.form.kasp_empanelled),
        latitude: state.form.latitude || null,
        longitude: state.form.longitude || null,
        phone_number: parsePhoneNumberFromString(
          state.form.phone_number
        )?.format("E.164"),
        oxygen_capacity: state.form.oxygen_capacity
          ? state.form.oxygen_capacity
          : 0,
        type_b_cylinders: state.form.type_b_cylinders
          ? state.form.type_b_cylinders
          : 0,
        type_c_cylinders: state.form.type_c_cylinders
          ? state.form.type_c_cylinders
          : 0,
        type_d_cylinders: state.form.type_d_cylinders
          ? state.form.type_d_cylinders
          : 0,
        expected_oxygen_requirement: state.form.expected_oxygen_requirement
          ? state.form.expected_oxygen_requirement
          : 0,
        expected_type_b_cylinders: state.form.expected_type_b_cylinders
          ? state.form.expected_type_b_cylinders
          : 0,

        expected_type_c_cylinders: state.form.expected_type_c_cylinders
          ? state.form.expected_type_c_cylinders
          : 0,

        expected_type_d_cylinders: state.form.expected_type_d_cylinders
          ? state.form.expected_type_d_cylinders
          : 0,
      };
      const res = await dispatchAction(
        facilityId ? updateFacility(facilityId, data) : createFacility(data)
      );

      if (res && (res.status === 200 || res.status === 201) && res.data) {
        const id = res.data.id;
        dispatch({ type: "set_form", form: initForm });
        if (!facilityId) {
          Notification.Success({
            msg: "Facility added successfully",
          });
          setCreatedFacilityId(id);
          setCurrentStep(2);
        } else {
          Notification.Success({
            msg: "Facility updated successfully",
          });
          navigate(`/facility/${facilityId}`);
        }
      } else {
        if (res?.data)
          Notification.Error({
            msg: "Something went wrong: " + (res.data.detail || ""),
          });
      }
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  const extremeSmallScreenBreakpoint = 320;
  const isExtremeSmallScreen =
    width <= extremeSmallScreenBreakpoint ? true : false;
  const open = Boolean(anchorEl);
  const id = open ? "map-popover" : undefined;

  let capacityList: any = null;
  let totalBedCount = 0;
  let totalOccupiedBedCount = 0;

  if (!capacityData || !capacityData.length) {
    capacityList = (
      <h5 className="mt-4 text-xl text-gray-500 font-bold flex items-center justify-center bg-white rounded-lg shadow p-4 w-full">
        No Bed Types Found
      </h5>
    );
  } else {
    capacityData.forEach((x) => {
      totalBedCount += x.total_capacity ? x.total_capacity : 0;
      totalOccupiedBedCount += x.current_capacity ? x.current_capacity : 0;
    });

    capacityList = (
      <div className="mt-4 grid xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 gap-7 w-full">
        <BedTypeCard
          label={"Total Beds"}
          bedCapacityId={0}
          used={totalOccupiedBedCount}
          total={totalBedCount}
          handleUpdate={() => {
            return;
          }}
        />
        {BED_TYPES.map((x) => {
          const res = capacityData.find((data) => {
            return data.room_type === x.id;
          });
          if (res && res.current_capacity && res.total_capacity) {
            const removeCurrentBedType = (bedTypeId: number | undefined) => {
              setCapacityData((state) =>
                state.filter((i) => i.id !== bedTypeId)
              );
              setBedCapacityKey((bedCapacityKey) => bedCapacityKey + 1);
            };
            return (
              <BedTypeCard
                facilityId={createdFacilityId}
                bedCapacityId={res.id}
                key={`bed_${res.id}`}
                room_type={res.room_type}
                label={x.text}
                used={res.current_capacity}
                total={res.total_capacity}
                lastUpdated={res.modified_date}
                removeBedType={removeCurrentBedType}
                handleUpdate={async () => {
                  const capacityRes = await dispatchAction(
                    listCapacity({}, { facilityId: createdFacilityId })
                  );
                  if (capacityRes && capacityRes.data) {
                    setCapacityData(capacityRes.data.results);
                  }
                }}
              />
            );
          }
        })}
      </div>
    );
  }

  let doctorList: any = null;
  if (!doctorData || !doctorData.length) {
    doctorList = (
      <h5 className="text-xl text-gray-500 font-bold flex items-center justify-center bg-white rounded-lg shadow p-4 w-full">
        No Doctors Found
      </h5>
    );
  } else {
    doctorList = (
      <div className="mt-4 grid xl:grid-cols-4 lg:grid-cols-3 sm:grid-cols-2 gap-6">
        {doctorData.map((data: DoctorModal) => {
          const removeCurrentDoctorData = (doctorId: number | undefined) => {
            setDoctorData((state) =>
              state.filter((i: DoctorModal) => i.id !== doctorId)
            );
            setDocCapacityKey((docCapacityKey) => docCapacityKey + 1);
          };

          return (
            <DoctorsCountCard
              facilityId={createdFacilityId || ""}
              key={`bed_${data.id}`}
              handleUpdate={async () => {
                const doctorRes = await dispatchAction(
                  listDoctor({}, { facilityId: createdFacilityId })
                );
                if (doctorRes && doctorRes.data) {
                  setDoctorData(doctorRes.data.results);
                }
              }}
              {...data}
              removeDoctor={removeCurrentDoctorData}
            />
          );
        })}
      </div>
    );
  }

  switch (currentStep) {
    case 3:
      return (
        <div className="px-2 pb-2">
          <PageTitle
            title={headerText}
            crumbsReplacements={{
              [createdFacilityId || "????"]: { name: state.form.name },
            }}
          />
          <Steps steps={getSteps()} />
          <div className="mt-3">
            <DoctorCapacity
              key={docCapacityKey}
              className="max-w-2xl w-full mx-auto"
              facilityId={createdFacilityId || ""}
              handleClose={() => {
                navigate(`/facility/${createdFacilityId}`);
              }}
              handleUpdate={async () => {
                const doctorRes = await dispatchAction(
                  listDoctor({}, { facilityId: createdFacilityId })
                );
                if (doctorRes && doctorRes.data) {
                  setDoctorData(doctorRes.data.results);
                }
              }}
            />
          </div>
          <div className="bg-white rounded p-3 md:p-6 shadow-sm mt-5">
            <div className="md:flex justify-between md:pb-2">
              <div className="font-bold text-xl mb-2">Doctors List</div>
            </div>
            <div className="mt-4">{doctorList}</div>
          </div>
        </div>
      );
    case 2:
      return (
        <div className="px-2 pb-2">
          <PageTitle
            title={headerText}
            crumbsReplacements={{
              [createdFacilityId || "????"]: { name: state.form.name },
            }}
          />
          <Steps steps={getSteps()} />
          <div className="mt-3">
            <BedCapacity
              key={bedCapacityKey}
              className="max-w-2xl w-full mx-auto"
              facilityId={createdFacilityId || ""}
              handleClose={() => {
                setCurrentStep(3);
              }}
              handleUpdate={async () => {
                const capacityRes = await dispatchAction(
                  listCapacity({}, { facilityId: createdFacilityId })
                );
                if (capacityRes && capacityRes.data) {
                  setCapacityData(capacityRes.data.results);
                }
              }}
            />
          </div>
          <div className="bg-white rounded p-3 md:p-6 shadow-sm mt-5">
            <div className="md:flex justify-between  md:border-b md:pb-2">
              <div className="font-semibold text-xl mb-2">Bed Capacity</div>
            </div>
            <div>{capacityList}</div>
          </div>
        </div>
      );
    case 1:
    default:
      return (
        <div className="px-2 pb-2">
          <PageTitle
            title={headerText}
            crumbsReplacements={{
              [facilityId || "????"]: { name: state.form.name },
            }}
          />
          {!facilityId && <Steps steps={getSteps()} />}
          <Card className="mt-4">
            <CardContent>
              <form onSubmit={(e) => handleSubmit(e)}>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div>
                    <FieldLabel
                      htmlFor="facility-type"
                      className="mb-2"
                      required={true}
                    >
                      Facility Type
                    </FieldLabel>
                    <SelectMenuV2
                      id="facility-type"
                      required
                      options={FACILITY_TYPES}
                      value={state.form.facility_type}
                      optionLabel={(o) => o.text}
                      optionValue={(o) => o.text}
                      onChange={(e) => handleValueChange(e, "facility_type")}
                    />
                    <ErrorHelperText error={state.errors.facility_type} />
                  </div>
                  <div>
                    <FieldLabel
                      htmlFor="facility-name"
                      className="mb-2"
                      required={true}
                    >
                      Facility Name
                    </FieldLabel>
                    <TextFormField
                      id="facility-name"
                      name="name"
                      required
                      onChange={handleChange}
                      value={state.form.name}
                      error={state.errors.name}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="facility-features" className="mb-2">
                      Features
                    </FieldLabel>
                    <MultiSelectMenuV2
                      id="facility-features"
                      placeholder="Features"
                      value={state.form.features}
                      options={FACILITY_FEATURE_TYPES}
                      optionLabel={(o) => o.name}
                      optionValue={(o) => o.id}
                      onChange={(o) => handleValueChange(o, "features")}
                    />
                    <ErrorHelperText error={state.errors.features} />
                  </div>
                  <div>
                    <FieldLabel
                      htmlFor="facility-pincode"
                      className="mb-2"
                      required={true}
                    >
                      Pincode
                    </FieldLabel>
                    <TextFormField
                      id="facility-pincode"
                      name="pincode"
                      required
                      onChange={handlePincodeChange}
                      value={state.form.pincode}
                      error={state.errors.pincode}
                    />
                    {showAutoFilledPincode && (
                      <div>
                        <i className="fas fa-circle-check text-green-500 mr-2 text-sm" />
                        <span className="text-primary-500 text-sm">
                          State and district auto-filled from pincode
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <FieldLabel
                      htmlFor="facility-state"
                      className="mb-2"
                      required={true}
                    >
                      State
                    </FieldLabel>
                    {isStateLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <>
                        <SelectMenuV2
                          id="facility-state"
                          placeholder="Choose State *"
                          options={states}
                          optionLabel={(o) => o.name}
                          optionValue={(o) => o.id}
                          value={state.form.state}
                          onChange={(e) => {
                            if (e) {
                              return [
                                handleValueChange(e, "state"),
                                fetchDistricts(e),
                              ];
                            }
                          }}
                        />
                        <ErrorHelperText error={state.errors.state} />
                      </>
                    )}
                  </div>
                  <div>
                    <FieldLabel
                      htmlFor="facility-district"
                      className="mb-2"
                      required={true}
                    >
                      District
                    </FieldLabel>

                    {isDistrictLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <>
                        <SelectMenuV2
                          id="facility-district"
                          placeholder="Choose District"
                          options={districts}
                          optionLabel={(o) => o.name}
                          optionValue={(o) => o.id}
                          value={state.form.district}
                          onChange={(e) => {
                            if (e) {
                              return [
                                handleValueChange(e, "district"),
                                fetchLocalBody(e),
                              ];
                            }
                          }}
                        />
                        <ErrorHelperText error={state.errors.district} />
                      </>
                    )}
                  </div>

                  <div>
                    <FieldLabel
                      htmlFor="facility-localbody"
                      className="mb-2"
                      required={true}
                    >
                      LocalBody
                    </FieldLabel>
                    {isLocalbodyLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <>
                        <SelectMenuV2
                          id="facility-localbody"
                          placeholder="Choose LocalBody"
                          options={localBodies}
                          optionLabel={(o) => o.name}
                          optionValue={(o) => o.id}
                          value={state.form.local_body}
                          onChange={(e) => {
                            if (e) {
                              return [
                                handleValueChange(e, "local_body"),
                                fetchWards(e),
                              ];
                            }
                          }}
                        />
                        <ErrorHelperText error={state.errors.local_body} />
                      </>
                    )}
                  </div>
                  <div>
                    <FieldLabel
                      htmlFor="facility-ward"
                      className="mb-2"
                      required={true}
                    >
                      Ward
                    </FieldLabel>
                    {isWardLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <>
                        <SelectMenuV2
                          id="facility-ward"
                          placeholder="Choose Ward"
                          options={ward
                            .sort((a, b) => a.number - b.number)
                            .map((e) => {
                              return {
                                id: e.id,
                                name: e.number + ": " + e.name,
                              };
                            })}
                          optionLabel={(o) => o.name}
                          optionValue={(o) => o.id}
                          value={state.form.ward}
                          onChange={(e) => {
                            if (e) {
                              return [handleValueChange(e, "ward")];
                            }
                          }}
                        />
                        <ErrorHelperText error={state.errors.ward} />
                      </>
                    )}
                  </div>

                  <div>
                    <FieldLabel
                      htmlFor="facility-address"
                      className="mb-2"
                      required={true}
                    >
                      Address
                    </FieldLabel>
                    <TextAreaFormField
                      id="facility-address"
                      name="address"
                      required
                      onChange={handleChange}
                      value={state.form.address}
                      error={state.errors.address}
                    />
                  </div>
                  <div>
                    <PhoneNumberFormField
                      name="phone_number"
                      label="Emergency Contact Number"
                      required
                      value={state.form.phone_number}
                      onChange={handleChange}
                      error={state.errors.phone_number}
                      onlyIndia
                    />
                  </div>

                  <div className="md:col-span-2 grid grid-cols-1 xl:grid-cols-2 gap-4 py-4">
                    <div className="grid vs:grid-cols-2 grid-cols-1 gap-4">
                      <div>
                        <FieldLabel
                          htmlFor="facility-oxygen_capacity"
                          className="mb-2"
                        >
                          Liquid Oxygen Capacity
                        </FieldLabel>
                        <TextFormField
                          id="facility-oxygen_capacity"
                          name="oxygen_capacity"
                          type="number"
                          required
                          onChange={(e) => handleValueChange(e.value, e.name)}
                          value={String(state.form.oxygen_capacity)}
                          errorClassName="hidden"
                        />
                      </div>
                      <div>
                        <FieldLabel
                          htmlFor="facility-expected_oxygen_requirement"
                          className="mb-2"
                        >
                          Expected Burn Rate
                        </FieldLabel>
                        <TextFormField
                          id="facility-expected_oxygen_requirement"
                          name="expected_oxygen_requirement"
                          type="number"
                          required
                          placeholder="Litres / day"
                          onChange={handleChange}
                          value={String(state.form.expected_oxygen_requirement)}
                          error={state.errors.expected_oxygen_requirement}
                        />
                      </div>
                    </div>

                    <div className="grid vs:grid-cols-2 grid-cols-1 gap-4">
                      <div>
                        <FieldLabel
                          htmlFor="facility-type_b_cylinders"
                          className="mb-2"
                        >
                          B Type Cylinders
                        </FieldLabel>
                        <TextFormField
                          id="facility-type_b_cylinders"
                          name="type_b_cylinders"
                          type="number"
                          required
                          onChange={handleChange}
                          value={String(state.form.type_b_cylinders)}
                          error={state.errors.type_b_cylinders}
                        />
                      </div>
                      <div>
                        <FieldLabel
                          htmlFor="facility-expected_type_b_cylinders"
                          className="mb-2"
                        >
                          Expected Burn Rate
                        </FieldLabel>
                        <TextFormField
                          id="facility-expected_type_b_cylinders"
                          name="expected_type_b_cylinders"
                          type="number"
                          required
                          placeholder="Cylinders / day"
                          onChange={handleChange}
                          value={String(state.form.expected_type_b_cylinders)}
                          error={state.errors.expected_type_b_cylinders}
                        />
                      </div>
                    </div>

                    <div className="grid vs:grid-cols-2 grid-cols-1 gap-4">
                      <div>
                        <FieldLabel
                          htmlFor="facility-type_c_cylinders"
                          className="mb-2"
                        >
                          C Type Cylinders
                        </FieldLabel>
                        <TextFormField
                          id="facility-type_c_cylinders"
                          name="type_c_cylinders"
                          type="number"
                          required
                          onChange={handleChange}
                          value={String(state.form.type_c_cylinders)}
                          error={state.errors.type_c_cylinders}
                        />
                      </div>
                      <div>
                        <FieldLabel
                          htmlFor="facility-expected_type_c_cylinders"
                          className="mb-2"
                        >
                          Expected Burn Rate
                        </FieldLabel>
                        <TextFormField
                          id="facility-expected_type_c_cylinders"
                          name="expected_type_c_cylinders"
                          type="number"
                          required
                          placeholder="Cylinders / day"
                          onChange={handleChange}
                          value={String(state.form.expected_type_c_cylinders)}
                          error={state.errors.expected_type_c_cylinders}
                        />
                      </div>
                    </div>

                    <div className="grid vs:grid-cols-2 grid-cols-1 gap-4">
                      <div>
                        <FieldLabel
                          htmlFor="facility-type_d_cylinders"
                          className="mb-2"
                        >
                          D Type Cylinders
                        </FieldLabel>
                        <TextFormField
                          id="facility-type_d_cylinders"
                          name="type_d_cylinders"
                          type="number"
                          required
                          onChange={handleChange}
                          value={String(state.form.type_d_cylinders)}
                          error={state.errors.type_d_cylinders}
                        />
                      </div>
                      <div>
                        <FieldLabel
                          htmlFor="facility-expected_type_d_cylinders"
                          className="mb-2"
                        >
                          Expected Burn Rate
                        </FieldLabel>
                        <TextFormField
                          id="facility-expected_type_d_cylinders"
                          name="expected_type_d_cylinders"
                          type="number"
                          required
                          placeholder="Cylinders / day"
                          onChange={handleChange}
                          value={String(state.form.expected_type_d_cylinders)}
                          error={state.errors.expected_type_d_cylinders}
                        />
                      </div>
                    </div>
                  </div>

                  {KASP_ENABLED && (
                    <div>
                      <FieldLabel
                        htmlFor="facility-kasp_empanelled"
                        className="mb-2"
                      >
                        Is this facility {KASP_STRING} empanelled?
                      </FieldLabel>
                      <RadioInputsV2
                        name="kasp_empanelled"
                        selected={state.form.kasp_empanelled}
                        onSelect={(value) =>
                          handleValueChange(value, "kasp_empanelled")
                        }
                        error={state.errors.kasp_empanelled}
                        options={[
                          { label: "Yes", value: "true" },
                          { label: "No", value: "false" },
                        ]}
                      />
                    </div>
                  )}
                </div>
                <div
                  className={`${
                    isExtremeSmallScreen
                      ? " grid grid-cols-1 "
                      : " flex items-center "
                  } -mx-2`}
                >
                  <div className="flex-1 px-2">
                    <FieldLabel className="mb-2">Location</FieldLabel>
                    <TextFormField
                      name="latitude"
                      placeholder="Latitude"
                      value={state.form.latitude}
                      onChange={handleChange}
                      error={state.errors.latitude}
                    />
                  </div>
                  <div className="flex flex-col justify-center md:block">
                    <FieldLabel className="mb-1">&nbsp;</FieldLabel>
                    <IconButton
                      id="facility-location-button"
                      onClick={(event) => setAnchorEl(event.currentTarget)}
                      className="tooltip"
                    >
                      <MyLocationIcon />
                      <span className="tooltip-text tooltip-bottom">
                        Select location from map
                      </span>
                    </IconButton>
                    <Popover
                      id={id}
                      open={open}
                      anchorEl={anchorEl}
                      onClose={handleClose}
                      anchorOrigin={{
                        vertical: "top",
                        horizontal: "left",
                      }}
                      transformOrigin={{
                        vertical: "top",
                        horizontal: "left",
                      }}
                    >
                      <GLocationPicker
                        lat={Number(state.form.latitude)}
                        lng={Number(state.form.longitude)}
                        handleOnChange={handleLocationChange}
                        handleOnClose={handleClose}
                        handleOnSelectCurrentLocation={
                          handleSelectCurrentLocation
                        }
                      />
                    </Popover>
                  </div>
                  <div className="flex-1 px-2">
                    <FieldLabel className="mb-1">&nbsp;</FieldLabel>
                    <TextFormField
                      name="longitude"
                      placeholder="Longitude"
                      value={state.form.longitude}
                      onChange={handleChange}
                      error={state.errors.longitude}
                    />
                  </div>
                </div>
                <div
                  className={`${
                    isExtremeSmallScreen
                      ? " grid grid-cols-1 "
                      : " flex justify-between "
                  } mt-2 gap-2 `}
                >
                  <Cancel onClick={() => goBack()} />
                  <Submit onClick={handleSubmit} label={buttonText} />
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      );
  }
};
