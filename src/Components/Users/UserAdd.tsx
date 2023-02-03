import { Card, CardContent, CircularProgress } from "@material-ui/core";
import loadable from "@loadable/component";
import { Link, navigate } from "raviger";
import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import moment from "moment";
import { useCallback, useEffect, useReducer, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  GENDER_TYPES,
  USER_TYPES,
  USER_TYPE_OPTIONS,
} from "../../Common/constants";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  validateEmailAddress,
  validateName,
  validatePassword,
  validateUsername,
} from "../../Common/validation";
import {
  addUser,
  getDistrictByState,
  getLocalbodyByDistrict,
  getStates,
  getUserListFacility,
  checkUsername,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { FacilitySelect } from "../Common/FacilitySelect";
import { FacilityModel } from "../Facility/models";

import { classNames, getExperienceSuffix, goBack } from "../../Utils/utils";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import PhoneNumberFormField from "../Form/FormFields/PhoneNumberFormField";
import TextFormField from "../Form/FormFields/TextFormField";
import { FieldChangeEvent } from "../Form/FormFields/Utils";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import MonthFormField from "../Form/FormFields/Month";
import Checkbox from "../Common/components/CheckBox";
import DateFormField from "../Form/FormFields/DateFormField";
import { FieldLabel } from "../Form/FormFields/FormField";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

interface UserProps {
  userId?: number;
}

interface StateObj {
  id: number;
  name: string;
}

type UserForm = {
  user_type: string;
  gender: string;
  password: string;
  c_password: string;
  facilities: Array<FacilityModel>;
  home_facility: FacilityModel | null;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  alt_phone_number: string;
  age: number;
  date_of_birth: Date | null;
  state: number;
  district: number;
  local_body: number;
  doctor_qualification: string | undefined;
  doctor_experience_commenced_on: string | undefined;
  doctor_medical_council_registration: string | undefined;
};

const initForm: UserForm = {
  user_type: "",
  gender: "",
  password: "",
  c_password: "",
  facilities: [],
  home_facility: null,
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  alt_phone_number: "",
  age: 0,
  date_of_birth: null,
  state: 0,
  district: 0,
  local_body: 0,
  doctor_qualification: undefined,
  doctor_experience_commenced_on: undefined,
  doctor_medical_council_registration: undefined,
};

const initError = Object.assign(
  {},
  ...Object.keys(initForm).map((k) => ({ [k]: "" }))
);

const initialState = {
  form: { ...initForm },
  errors: { ...initError },
};

const user_create_reducer = (state = initialState, action: any) => {
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

const getDate = (value: any) =>
  value && moment(value).isValid() && moment(value).toDate();

export const UserAdd = (props: UserProps) => {
  const dispatchAction: any = useDispatch();
  const { userId } = props;

  const [state, dispatch] = useReducer(user_create_reducer, initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [isStateLoading, setIsStateLoading] = useState(false);
  const [isDistrictLoading, setIsDistrictLoading] = useState(false);
  const [isLocalbodyLoading, setIsLocalbodyLoading] = useState(false);
  const [_current_user_facilities, setFacilities] = useState<
    Array<FacilityModel>
  >([]);
  const [states, setStates] = useState<StateObj[]>([]);
  const [districts, setDistricts] = useState<StateObj[]>([]);
  const [localBodies, setLocalBodies] = useState<StateObj[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<FacilityModel[]>([]);
  const [phoneIsWhatsApp, setPhoneIsWhatsApp] = useState(true);
  const [usernameInputInFocus, setUsernameInputInFocus] = useState(false);
  const [passwordInputInFocus, setPasswordInputInFocus] = useState(false);
  const [confirmPasswordInputInFocus, setConfirmPasswordInputInFocus] =
    useState(false);
  const [usernameInput, setUsernameInput] = useState("");

  const userExistsEnums = {
    idle: 0,
    checking: 1,
    exists: 2,
    available: 3,
  };

  const [usernameExists, setUsernameExists] = useState<number>(0);

  const check_username = async (username: string) => {
    setUsernameExists(userExistsEnums.checking);
    const usernameCheck = await dispatchAction(
      checkUsername({ username: username })
    );
    if (usernameCheck === undefined || usernameCheck.status === 409)
      setUsernameExists(userExistsEnums.exists);
    else if (usernameCheck.status === 200)
      setUsernameExists(userExistsEnums.available);
    else
      Notification.Error({
        msg: "Some error checking username availabality. Please try again later.",
      });
  };

  useEffect(() => {
    setUsernameExists(userExistsEnums.idle);
    if (
      usernameInput.length > 1 &&
      !(state.form.username?.length < 2) &&
      /[^.@+_-]/.test(state.form.username[state.form.username?.length - 1])
    ) {
      const timeout = setTimeout(() => {
        check_username(usernameInput);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [usernameInput]);

  const rootState: any = useSelector((rootState) => rootState);
  const { currentUser } = rootState;
  const isSuperuser = currentUser.data.is_superuser;

  const username = currentUser.data.username;

  const userType = currentUser.data.user_type;

  const userIndex = USER_TYPES.indexOf(userType);

  const readOnlyUsers = USER_TYPE_OPTIONS.filter((user) => user.readOnly);

  const defaultAllowedUserTypes = USER_TYPE_OPTIONS.slice(0, userIndex + 1);
  const userTypes = isSuperuser
    ? [...USER_TYPE_OPTIONS]
    : userType === "StaffReadOnly"
    ? readOnlyUsers.slice(0, 1)
    : userType === "DistrictReadOnlyAdmin"
    ? readOnlyUsers.slice(0, 2)
    : userType === "StateReadOnlyAdmin"
    ? readOnlyUsers.slice(0, 3)
    : userType === "Pharmacist"
    ? USER_TYPE_OPTIONS.slice(0, 1)
    : // Exception to allow Staff to Create Doctors
      defaultAllowedUserTypes;

  const headerText = !userId ? "Add User" : "Update User";
  const buttonText = !userId ? "Save User" : "Update Details";
  const showLocalbody = !(
    state.form.user_type === "Pharmacist" ||
    state.form.user_type === "Volunteer" ||
    state.form.user_type === "Doctor" ||
    state.form.user_type === "Staff" ||
    state.form.user_type === "StaffReadOnly"
  );

  const fetchDistricts = useCallback(
    async (id: number) => {
      if (id > 0) {
        setIsDistrictLoading(true);
        const districtList = await dispatchAction(getDistrictByState({ id }));
        if (districtList) {
          if (userIndex <= USER_TYPES.indexOf("DistrictAdmin")) {
            setDistricts([
              {
                id: currentUser.data.district,
                name: currentUser.data.district_object.name,
              },
            ]);
          } else {
            setDistricts(districtList.data);
          }
        }
        setIsDistrictLoading(false);
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
          if (userIndex <= USER_TYPES.indexOf("LocalBodyAdmin")) {
            setLocalBodies([
              {
                id: currentUser.data.local_body,
                name: currentUser.data.local_body_object.name,
              },
            ]);
          } else {
            setLocalBodies(localBodyList.data);
          }
        }
      }
    },
    [dispatchAction]
  );

  const fetchStates = useCallback(
    async (status: statusType) => {
      setIsStateLoading(true);
      const statesRes = await dispatchAction(getStates());
      if (!status.aborted && statesRes.data.results) {
        if (userIndex <= USER_TYPES.indexOf("StateAdmin")) {
          setStates([
            {
              id: currentUser.data.state,
              name: currentUser.data.state_object.name,
            },
          ]);
        } else {
          setStates(statesRes.data.results);
        }
      }
      setIsStateLoading(false);
    },
    [dispatchAction]
  );

  const fetchFacilities = useCallback(
    async (status: any) => {
      setIsStateLoading(true);
      const res = await dispatchAction(getUserListFacility({ username }));
      if (!status.aborted && res && res.data) {
        setFacilities(res.data);
      }
      setIsStateLoading(false);
    },
    [dispatchAction, username]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchStates(status);
      if (userType === "Staff" || userType === "StaffReadOnly") {
        fetchFacilities(status);
      }
    },
    [dispatch]
  );

  const handleDateChange = (e: FieldChangeEvent<Date>) => {
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

  const handleFieldChange = (event: FieldChangeEvent<unknown>) => {
    dispatch({
      type: "set_form",
      form: {
        ...state.form,
        [event.name]: event.value,
      },
    });
  };

  useAbortableEffect(() => {
    phoneIsWhatsApp &&
      handleFieldChange({
        name: "alt_phone_number",
        value: state.form.phone_number,
      });
  }, [phoneIsWhatsApp, state.form.phone_number]);

  const setFacility = (selected: FacilityModel | FacilityModel[] | null) => {
    setSelectedFacility(selected as FacilityModel[]);
    const form = { ...state.form };
    form.facilities = selected
      ? (selected as FacilityModel[]).map((i) => i.id)
      : [];
    dispatch({ type: "set_form", form });
  };

  const validateForm = () => {
    const errors = { ...initError };
    let invalidForm = false;
    Object.keys(state.form).forEach((field) => {
      switch (field) {
        case "facilities":
          if (
            state.form[field].length === 0 &&
            (userType === "Staff" || userType === "StaffReadOnly") &&
            (state.form["user_type"] === "Staff" ||
              state.form["user_type"] === "StaffReadOnly")
          ) {
            errors[field] =
              "Please select atleast one of the facilities you are linked to";
            invalidForm = true;
          }
          return;
        case "user_type":
          if (!state.form[field]) {
            errors[field] = "Please select the User Type";
            invalidForm = true;
          }
          return;
        case "doctor_qualification":
        case "doctor_experience_commenced_on":
        case "doctor_medical_council_registration":
          if (state.form.user_type === "Doctor" && !state.form[field]) {
            errors[field] = "Field is required";
            invalidForm = true;
          }
          return;
        case "first_name":
        case "last_name":
          if (!state.form[field]) {
            errors[field] = `${field
              .split("_")
              .map((word) => word[0].toUpperCase() + word.slice(1))
              .join(" ")} is required`;
            invalidForm = true;
          } else if (!validateName(state.form[field])) {
            errors[field] = "Please enter a valid name";
            invalidForm = true;
          }
          return;
        case "gender":
          if (!state.form[field]) {
            errors[field] = "Please select the Gender";
            invalidForm = true;
          }
          return;
        case "username":
          if (!state.form[field]) {
            errors[field] = "Please enter the username";
            invalidForm = true;
          } else if (!validateUsername(state.form[field])) {
            errors[field] =
              "Please enter letters, digits and @ . + - _ only and username should not end with @, ., +, - or _";
            invalidForm = true;
          } else if (usernameExists !== userExistsEnums.available) {
            errors[field] = "This username already exists";
            invalidForm = true;
          }
          return;
        case "password":
          if (!state.form[field]) {
            errors[field] = "Please enter the password";
            invalidForm = true;
          } else if (!validatePassword(state.form[field])) {
            errors.password =
              "Password should have 1 lowercase letter, 1 uppercase letter, 1 number, and be at least 8 characters long";
            invalidForm = true;
          }
          return;
        case "c_password":
          if (!state.form.password) {
            errors.c_password = "Confirm password is required";
            invalidForm = true;
          } else if (state.form.password !== state.form.c_password) {
            errors.c_password = "Passwords not matching";
            invalidForm = true;
          }
          return;
        case "phone_number":
          // eslint-disable-next-line no-case-declarations
          const phoneNumber = parsePhoneNumberFromString(
            state.form[field],
            "IN"
          );
          // eslint-disable-next-line no-case-declarations
          let is_valid = false;
          if (phoneNumber) {
            is_valid = phoneNumber.isValid();
          }
          if (!state.form[field] || !is_valid) {
            errors[field] = "Please enter valid phone number";
            invalidForm = true;
          }
          return;

        case "alt_phone_number":
          // eslint-disable-next-line no-case-declarations
          let alt_is_valid = false;
          if (state.form[field] && state.form[field] !== "+91") {
            const altPhoneNumber = parsePhoneNumberFromString(
              state.form[field],
              "IN"
            );
            if (altPhoneNumber) {
              alt_is_valid = altPhoneNumber.isValid();
            }
          }
          if (
            state.form[field] &&
            state.form[field] !== "+91" &&
            !alt_is_valid
          ) {
            errors[field] = "Please enter valid mobile number";
            invalidForm = true;
          }
          return;
        case "email":
          if (
            state.form[field].length &&
            !validateEmailAddress(state.form[field])
          ) {
            errors[field] = "Please enter a valid email address";
            invalidForm = true;
          }
          return;
        case "date_of_birth":
          if (!state.form[field]) {
            errors[field] = "Please enter date in DD/MM/YYYY format";
            invalidForm = true;
          }
          return;
        case "state":
          if (!Number(state.form[field])) {
            errors[field] = "Please select the state";
            invalidForm = true;
          }
          return;
        case "district":
          if (!Number(state.form[field]) || state.form[field] === "") {
            errors[field] = "Please select the district";
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

  const validateRule = (condition: boolean, content: JSX.Element | string) => {
    return (
      <div>
        {condition ? (
          <i className="fas fa-circle-check text-green-500" />
        ) : (
          <i className="fas fa-circle-xmark text-red-500" />
        )}{" "}
        <span
          className={classNames(
            condition ? "text-primary-500" : "text-red-500"
          )}
        >
          {content}
        </span>
      </div>
    );
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const validated = validateForm();
    if (validated) {
      setIsLoading(true);
      const data = {
        user_type: state.form.user_type,
        gender: state.form.gender,
        password: state.form.password,
        facilities: state.form.facilities ? state.form.facilities : undefined,
        home_facility: state.form.home_facility ?? undefined,
        username: state.form.username,
        first_name: state.form.first_name ? state.form.first_name : undefined,
        last_name: state.form.last_name ? state.form.last_name : undefined,
        email: state.form.email,
        state: state.form.state,
        district: state.form.district,
        local_body: showLocalbody ? state.form.local_body : null,
        phone_number: parsePhoneNumberFromString(
          state.form.phone_number
        )?.format("E.164"),
        alt_phone_number:
          parsePhoneNumberFromString(state.form.alt_phone_number)?.format(
            "E.164"
          ) || "",
        date_of_birth: moment(state.form.date_of_birth).format("YYYY-MM-DD"),
        age: Number(moment().diff(state.form.date_of_birth, "years", false)),
        doctor_qualification: state.form.doctor_qualification,
        doctor_experience_commenced_on: moment(
          state.form.doctor_experience_commenced_on
        ).format("YYYY-MM-DD"),
        doctor_medical_council_registration:
          state.form.doctor_medical_council_registration,
      };

      const res = await dispatchAction(addUser(data));
      // userId ? updateUser(userId, data) : addUser(data)
      if (
        res &&
        (res.data || res.data === "") &&
        res.status >= 200 &&
        res.status < 300
      ) {
        // const id = res.data.id;
        dispatch({ type: "set_form", form: initForm });
        if (!userId) {
          Notification.Success({
            msg: "User added successfully",
          });
        } else {
          Notification.Success({
            msg: "User updated successfully",
          });
        }
        navigate("/users");
      }
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  const field = (name: string) => {
    return {
      id: name,
      name,
      onChange: handleFieldChange,
      value: state.form[name],
      error: state.errors[name],
    };
  };

  return (
    <div className="px-2 pb-2">
      <PageTitle
        title={headerText}
        componentRight={
          <Link
            href="https://school.coronasafe.network/targets/12953"
            className="text-gray-600 border border-gray-600 bg-gray-50 hover:bg-gray-100 transition rounded px-4 py-2 inline-block"
            target="_blank"
          >
            <i className="fas fa-info-circle" /> &nbsp;Need Help?
          </Link>
        }
        justifyContents="justify-between"
      />

      <Card className="mt-4">
        <CardContent>
          <form onSubmit={(e) => handleSubmit(e)}>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="md:col-span-2">
                <FieldLabel>Facilities</FieldLabel>
                <FacilitySelect
                  multiple={true}
                  name="facilities"
                  selected={selectedFacility}
                  setSelected={setFacility}
                  errors={state.errors.facilities}
                  showAll={false}
                />
              </div>
              <SelectFormField
                {...field("user_type")}
                required
                label="User Type"
                options={userTypes}
                optionLabel={(o) =>
                  o.role + ((o.readOnly && " (Read Only)") || "")
                }
                optionValue={(o) => o.id}
              />

              {state.form.user_type === "Doctor" && (
                <>
                  <TextFormField
                    {...field("doctor_qualification")}
                    required
                    label="Qualification"
                    placeholder="Qualification of the Doctor"
                  />

                  <MonthFormField
                    {...field("doctor_experience_commenced_on")}
                    required
                    label="Experience commenced on"
                    suffix={(date) => (
                      <span className="ml-2 text-sm whitespace-nowrap">
                        {getExperienceSuffix(date)}
                      </span>
                    )}
                  />

                  <TextFormField
                    {...field("doctor_medical_council_registration")}
                    required
                    label="Medical Council Registration"
                    placeholder="Doctor's medical council registration number"
                  />
                </>
              )}

              <SelectFormField
                {...field("home_facility")}
                required
                label="Home facility"
                options={selectedFacility || []}
                optionLabel={(option) => option.name}
                optionValue={(option) => option.id}
                onChange={handleFieldChange}
              />

              <div>
                <PhoneNumberFormField
                  {...field("phone_number")}
                  placeholder="Phone Number"
                  label="Phone Number"
                  required
                  onlyIndia
                />
                <Checkbox
                  checked={phoneIsWhatsApp}
                  onCheck={setPhoneIsWhatsApp}
                  label="Is the phone number a WhatsApp number?"
                />
              </div>

              <PhoneNumberFormField
                {...field("alt_phone_number")}
                placeholder="WhatsApp Phone Number"
                label="Whatsapp Number"
                disabled={phoneIsWhatsApp}
                onlyIndia
              />

              <div>
                <TextFormField
                  {...field("username")}
                  label="Username"
                  placeholder="Username"
                  required
                  autoComplete="new-username"
                  value={usernameInput}
                  onChange={(e) => {
                    handleFieldChange(e);
                    setUsernameInput(e.value);
                  }}
                  onFocus={() => setUsernameInputInFocus(true)}
                  onBlur={() => {
                    setUsernameInputInFocus(false);
                  }}
                />
                {usernameInputInFocus && (
                  <div className="pl-2 text-small text-gray-500">
                    <div>
                      {usernameExists !== userExistsEnums.idle && (
                        <>
                          {usernameExists === userExistsEnums.checking ? (
                            <span>
                              <i className="fas fa-circle-dot" /> checking...
                            </span>
                          ) : (
                            <>
                              {usernameExists === userExistsEnums.exists ? (
                                <div>
                                  <i className="fas fa-circle-xmark text-red-500" />{" "}
                                  <span className="text-red-500">
                                    Username is not available
                                  </span>
                                </div>
                              ) : (
                                <div>
                                  <i className="fas fa-circle-check text-green-500" />{" "}
                                  <span className="text-primary-500">
                                    Username is available
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                    <div>
                      {validateRule(
                        state.form.username?.length >= 2,
                        "Username should be atleast 2 characters long"
                      )}
                    </div>
                    <div>
                      {validateRule(
                        /[^.@+_-]/.test(
                          state.form.username[state.form.username?.length - 1]
                        ),
                        "Username can't end with ^ . @ + _ -"
                      )}
                    </div>
                  </div>
                )}
              </div>

              <DateFormField
                {...field("date_of_birth")}
                label="Date of Birth"
                required
                value={getDate(state.form.date_of_birth)}
                onChange={handleDateChange}
                position="LEFT"
                disableFuture
              />

              <div>
                <TextFormField
                  {...field("password")}
                  label="Password"
                  placeholder="Password"
                  required
                  autoComplete="new-password"
                  type="password"
                  onFocus={() => setPasswordInputInFocus(true)}
                  onBlur={() => setPasswordInputInFocus(false)}
                />
                {passwordInputInFocus && (
                  <div className="pl-2 text-small text-gray-500">
                    {validateRule(
                      state.form.password?.length >= 8,
                      "Password should be atleast 8 characters long"
                    )}
                    {validateRule(
                      state.form.password !== state.form.password.toUpperCase(),
                      "Password should contain at least 1 lowercase letter"
                    )}
                    {validateRule(
                      state.form.password !== state.form.password.toLowerCase(),
                      "Password should contain at least 1 uppercase letter"
                    )}
                    {validateRule(
                      /\d/.test(state.form.password),
                      "Password should contain at least 1 number"
                    )}
                  </div>
                )}
              </div>
              <div>
                <TextFormField
                  {...field("c_password")}
                  label="Confirm Password"
                  placeholder="Confirm Password"
                  required
                  type="password"
                  autoComplete="off"
                  onFocus={() => setConfirmPasswordInputInFocus(true)}
                  onBlur={() => setConfirmPasswordInputInFocus(false)}
                />
                {confirmPasswordInputInFocus &&
                  state.form.c_password.length > 0 &&
                  validateRule(
                    state.form.c_password === state.form.password,
                    "Confirm password should match the entered password"
                  )}
              </div>
              <TextFormField
                {...field("first_name")}
                label="First name"
                placeholder="First name"
                required
              />
              <TextFormField
                {...field("last_name")}
                label="Last name"
                placeholder="Last name"
                required
              />
              <TextFormField
                {...field("email")}
                label="Email"
                placeholder="Email"
                required
              />
              <SelectFormField
                {...field("gender")}
                label="Gender"
                required
                value={state.form.gender}
                options={GENDER_TYPES}
                optionLabel={(o) => o.text}
                optionValue={(o) => o.text}
              />

              {isStateLoading ? (
                <CircularProgress size={20} />
              ) : (
                <SelectFormField
                  {...field("state")}
                  label="State"
                  required
                  placeholder="Choose State"
                  options={states}
                  optionLabel={(o) => o.name}
                  optionValue={(o) => o.id}
                  onChange={(e) => {
                    handleFieldChange(e);
                    if (e) fetchDistricts(e.value);
                  }}
                />
              )}

              {isDistrictLoading ? (
                <CircularProgress size={20} />
              ) : (
                <SelectFormField
                  {...field("district")}
                  label="District"
                  required
                  placeholder="Choose District"
                  options={districts}
                  optionLabel={(o) => o.name}
                  optionValue={(o) => o.id}
                  onChange={(e) => {
                    handleFieldChange(e);
                    if (e) fetchLocalBody(e.value);
                  }}
                />
              )}

              {showLocalbody &&
                (isLocalbodyLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <>
                    <SelectFormField
                      {...field("local_body")}
                      label="Local Body"
                      required
                      position="above"
                      placeholder="Choose Local Body"
                      options={localBodies}
                      optionLabel={(o) => o.name}
                      optionValue={(o) => o.id}
                    />
                  </>
                ))}
            </div>
            <div className="flex flex-col md:flex-row gap-2 justify-between mt-4">
              <Cancel onClick={() => goBack()} />
              <Submit onClick={handleSubmit} label={buttonText} />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
