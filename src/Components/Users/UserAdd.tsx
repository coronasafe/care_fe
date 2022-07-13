import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  InputLabel,
} from "@material-ui/core";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import loadable from "@loadable/component";
import { navigate } from "raviger";
import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import moment from "moment";
import { useCallback, useReducer, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { GENDER_TYPES, USER_TYPES } from "../../Common/constants";
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
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { FacilitySelect } from "../Common/FacilitySelect";
import {
  DateInputField,
  PhoneNumberField,
  SelectField,
  TextInputField,
  MultiSelectField,
  CheckboxField,
} from "../Common/HelperInputFields";
import { FacilityModel } from "../Facility/models";
import HelpToolTip from "../Common/utils/HelpToolTip";
import { Cancel, CheckCircle } from "@material-ui/icons";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

const genderTypes = [
  {
    id: 0,
    text: "Select",
  },
  ...GENDER_TYPES,
];

interface UserProps {
  userId?: number;
}

const initialStates = [{ id: 0, name: "Choose State *" }];
const initialDistricts = [{ id: 0, name: "Choose District" }];
const selectStates = [{ id: 0, name: "Please select your state" }];
const initialLocalbodies = [{ id: 0, name: "Choose Localbody" }];
const selectDistrict = [{ id: 0, name: "Please select your district" }];

const initForm: any = {
  user_type: "",
  gender: "",
  password: "",
  c_password: "",
  facilities: [],
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  alt_phone_number: "",
  age: "",
  date_of_birth: null,
  state: "",
  district: "",
  local_body: "",
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

const goBack = () => {
  window.history.go(-1);
};

export const UserAdd = (props: UserProps) => {
  const dispatchAction: any = useDispatch();
  const { userId } = props;

  const [state, dispatch] = useReducer(user_create_reducer, initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [isStateLoading, setIsStateLoading] = useState(false);
  const [isDistrictLoading, setIsDistrictLoading] = useState(false);
  const [isLocalbodyLoading, setIsLocalbodyLoading] = useState(false);
  const [current_user_facilities, setFacilities] = useState<
    Array<FacilityModel>
  >([]);
  const [states, setStates] = useState(initialStates);
  const [districts, setDistricts] = useState(selectStates);
  const [localBody, setLocalBody] = useState(selectDistrict);
  const [selectedFacility, setSelectedFacility] = useState<
    FacilityModel[] | null
  >([]);
  const [phoneIsWhatsApp, setPhoneIsWhatsApp] = useState(true);
  const [usernameInputInFocus, setUsernameInputInFocus] = useState(false);

  const rootState: any = useSelector((rootState) => rootState);
  const { currentUser } = rootState;
  const isSuperuser = currentUser.data.is_superuser;

  const username = currentUser.data.username;

  const userType = currentUser.data.user_type;

  const userIndex = USER_TYPES.indexOf(userType);

  const defaultAllowedUserTypes = USER_TYPES.slice(0, userIndex + 1);

  const userTypes = isSuperuser
    ? [...USER_TYPES]
    : userType === "StaffReadOnly"
    ? ["StaffReadOnly"]
    : userType === "DistrictReadOnlyAdmin"
    ? ["StaffReadOnly", "DistrictReadOnlyAdmin"]
    : userType === "StateReadOnlyAdmin"
    ? ["StaffReadOnly", "DistrictReadOnlyAdmin", "StateReadOnlyAdmin"]
    : userType === "Pharmacist"
    ? ["Pharmacist"]
    : // Exception to allow Staff to Create Doctors
    userType === "Staff"
    ? ["Doctor", ...defaultAllowedUserTypes]
    : defaultAllowedUserTypes;

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
    async (id: string) => {
      if (Number(id) > 0) {
        setIsDistrictLoading(true);
        const districtList = await dispatchAction(getDistrictByState({ id }));
        if (districtList) {
          setDistricts([...initialDistricts, ...districtList.data]);
        }
        setIsDistrictLoading(false);
      } else {
        setDistricts(selectStates);
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
        if (localBodyList) {
          setLocalBody([...initialLocalbodies, ...localBodyList.data]);
        }
      } else {
        setLocalBody(selectDistrict);
      }
    },
    [dispatchAction]
  );

  // const fetchData = useCallback(
  //   async (status: statusType) => {
  //     if (userId) {
  //       setIsLoading(true);
  //       const res = await dispatchAction(getFacility(userId));
  //       if (!status.aborted && res.data) {
  //         const formData = {
  //           facility_type: res.data.facility_type,
  //           name: res.data.name,
  //           state: res.data.state ? res.data.state : "",
  //           district: res.data.district ? res.data.district : "",
  //           local_body: res.data.local_body ? res.data.local_body : "",
  //           address: res.data.address,
  //           phone_number: res.data.phone_number,
  //           latitude: res.data.location ? res.data.location.latitude : "",
  //           longitude: res.data.location ? res.data.location.longitude : "",
  //           oxygen_capacity: res.data.oxygen_capacity
  //             ? res.data.oxygen_capacity
  //             : ""
  //         };
  //         dispatch({ type: "set_form", form: formData });
  //         Promise.all([
  //           fetchDistricts(res.data.state),
  //           fetchLocalBody(res.data.district)
  //         ]);
  //       } else {
  //         navigate(`/facility/${userId}`);
  //       }
  //       setIsLoading(false);
  //     }
  //   },
  //   [dispatchAction, fetchDistricts, fetchLocalBody, userId]
  // );

  const fetchStates = useCallback(
    async (status: statusType) => {
      setIsStateLoading(true);
      const statesRes = await dispatchAction(getStates());
      if (!status.aborted && statesRes.data.results) {
        setStates([...initialStates, ...statesRes.data.results]);
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
      // if (userId) {
      //   fetchData(status);
      // }
      fetchStates(status);
      if (userType === "Staff" || userType === "StaffReadOnly") {
        fetchFacilities(status);
      }
    },
    [dispatch]
  );

  const handleChange = (e: any) => {
    const { value, name } = e.target;
    const form = { ...state.form };
    form[name] = value;
    if (name === "username") {
      form[name] = value.toLowerCase();
    }
    if (name === "state") {
      form["district"] = "";
    }
    dispatch({ type: "set_form", form });
  };

  const handleDateChange = (date: any, field: string) => {
    if (moment(date).isValid()) {
      const form = { ...state.form };
      form[field] = date;
      dispatch({ type: "set_form", form });
    }
  };

  const handleValueChange = (value: any, name: string) => {
    const form = { ...state.form };
    form[name] = value;
    dispatch({ type: "set_form", form });
  };

  useAbortableEffect(() => {
    phoneIsWhatsApp &&
      handleValueChange(state.form.phone_number, "alt_phone_number");
  }, [phoneIsWhatsApp, state.form.phone_number]);

  const setFacility = (selected: FacilityModel | FacilityModel[] | null) => {
    setSelectedFacility(selected as FacilityModel[]);
    const form = { ...state.form };
    form.facilities = selected
      ? (selected as FacilityModel[]).map((i) => i.id)
      : [];
    dispatch({ type: "set_form", form });
  };

  const handleMultiSelect = (event: any) => {
    const { name, value } = event.target;
    const form = { ...state.form };
    form[name] = value;
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
            errors.password = "Confirm password is required";
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
        username: state.form.username,
        first_name: state.form.first_name ? state.form.first_name : undefined,
        last_name: state.form.last_name ? state.form.last_name : undefined,
        email: state.form.email,
        state: state.form.state,
        district: state.form.district,
        local_body: state.form.local_body,
        phone_number: parsePhoneNumberFromString(
          state.form.phone_number
        )?.format("E.164"),
        alt_phone_number:
          parsePhoneNumberFromString(state.form.alt_phone_number)?.format(
            "E.164"
          ) || "",
        date_of_birth: moment(state.form.date_of_birth).format("YYYY-MM-DD"),
        age: Number(moment().diff(state.form.date_of_birth, "years", false)),
      };
      const res = await dispatchAction(addUser(data));
      // userId ? updateUser(userId, data) : addUser(data)
      if (res && (res.data || res.data === "") && res.status >= 200 && res.status < 300) {
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

  return (
    <div className="px-2 pb-2">
      <PageTitle title={headerText} />

      <Card className="mt-4">
        <HelpToolTip
          text="Need help? Go to the docs "
          link="https://school.coronasafe.network/targets/12953"
        />
        <CardContent>
          <form onSubmit={(e) => handleSubmit(e)}>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div>
                <InputLabel>User Type*</InputLabel>
                <SelectField
                  showEmpty={true}
                  name="user_type"
                  variant="outlined"
                  margin="dense"
                  optionArray={true}
                  value={state.form.user_type}
                  options={userTypes}
                  onChange={handleChange}
                  errors={state.errors.user_type}
                />
              </div>

              <div>
                <PhoneNumberField
                  placeholder="phone_number"
                  label="Phone Number*"
                  value={state.form.phone_number}
                  onChange={(value: any) =>
                    handleValueChange(value, "phone_number")
                  }
                  errors={state.errors.phone_number}
                  onlyIndia={true}
                />
                <CheckboxField
                  checked={phoneIsWhatsApp}
                  onChange={(_, checked) => {
                    setPhoneIsWhatsApp(checked);
                    !checked && handleValueChange("+91", "alt_phone_number");
                  }}
                  label="Is the phone number a WhatsApp number?"
                  className="font-bold"
                />
              </div>

              <div>
                <PhoneNumberField
                  placeholder="whatsapp_number"
                  label="Whatsapp Number"
                  value={state.form.alt_phone_number}
                  onChange={(value: any) =>
                    handleValueChange(value, "alt_phone_number")
                  }
                  disabled={phoneIsWhatsApp}
                  errors={state.errors.alt_phone_number}
                  onlyIndia={true}
                />
              </div>

              <div className="md:col-span-2">
                <InputLabel>Facilities</InputLabel>
                {userType === "Staff" || userType === "StaffReadOnly" ? (
                  <MultiSelectField
                    name="facilities"
                    variant="outlined"
                    value={state.form.facilities}
                    options={current_user_facilities}
                    onChange={handleMultiSelect}
                    optionValue="name"
                    errors={state.errors.facilities}
                  />
                ) : (
                  <FacilitySelect
                    multiple={true}
                    name="facilities"
                    selected={selectedFacility}
                    setSelected={setFacility}
                    errors={state.errors.facilities}
                  />
                )}
              </div>

              <div>
                <InputLabel>Username*</InputLabel>
                <TextInputField
                  fullWidth
                  name="username"
                  autoComplete="new-username"
                  variant="outlined"
                  margin="dense"
                  onChange={handleChange}
                  errors={state.errors.username}
                  onFocus={() => setUsernameInputInFocus(true)}
                  onBlur={() => setUsernameInputInFocus(false)}
                />

                {usernameInputInFocus && (
                  <div className="pl-2 text-small text-gray-500">
                    <div>
                      {state.form.username?.length < 2 ? (
                        <Cancel fontSize="inherit" color="error" />
                      ) : (
                        <CheckCircle fontSize="inherit" color="primary" />
                      )}{" "}
                      username should be atleast 2 characters long
                    </div>
                    <div>
                      {!/[^.@+_-]/.test(
                        state.form.username[state.form.username?.length - 1]
                      ) ? (
                        <Cancel fontSize="inherit" color="error" />
                      ) : (
                        <CheckCircle fontSize="inherit" color="primary" />
                      )}{" "}
                      {"username can't end with ^ . @ + _ -"}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <InputLabel>Date of birth*</InputLabel>
                <DateInputField
                  name="dob"
                  fullWidth={true}
                  value={state.form.date_of_birth}
                  onChange={(date) => handleDateChange(date, "date_of_birth")}
                  errors={state.errors.date_of_birth}
                  inputVariant="outlined"
                  margin="dense"
                  openTo="year"
                  disableFuture={true}
                />
              </div>

              <div>
                <InputLabel>Password*</InputLabel>
                <TextInputField
                  fullWidth
                  name="password"
                  autoComplete="new-password"
                  type="password"
                  variant="outlined"
                  margin="dense"
                  value={state.form.password}
                  onChange={handleChange}
                  errors={state.errors.password}
                />
              </div>

              <div>
                <InputLabel>Confirm Password*</InputLabel>
                <TextInputField
                  fullWidth
                  name="c_password"
                  type="password"
                  variant="outlined"
                  margin="dense"
                  autoComplete="off"
                  value={state.form.c_password}
                  onChange={handleChange}
                  errors={state.errors.c_password}
                />
              </div>

              <div>
                <InputLabel>First name*</InputLabel>
                <TextInputField
                  fullWidth
                  name="first_name"
                  variant="outlined"
                  margin="dense"
                  value={state.form.first_name}
                  onChange={handleChange}
                  errors={state.errors.first_name}
                />
              </div>

              <div>
                <InputLabel>Last name*</InputLabel>
                <TextInputField
                  fullWidth
                  name="last_name"
                  variant="outlined"
                  margin="dense"
                  value={state.form.last_name}
                  onChange={handleChange}
                  errors={state.errors.last_name}
                />
              </div>

              <div>
                <InputLabel>Email</InputLabel>
                <TextInputField
                  fullWidth
                  name="email"
                  variant="outlined"
                  margin="dense"
                  value={state.form.email}
                  onChange={handleChange}
                  errors={state.errors.email}
                />
              </div>

              <div>
                <InputLabel>Gender*</InputLabel>
                <SelectField
                  name="gender"
                  variant="outlined"
                  margin="dense"
                  value={state.form.gender}
                  options={genderTypes}
                  onChange={handleChange}
                  errors={state.errors.gender}
                />
              </div>

              <div>
                <InputLabel>State*</InputLabel>
                {isStateLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <SelectField
                    name="state"
                    variant="outlined"
                    margin="dense"
                    value={state.form.state}
                    options={states}
                    optionValue="name"
                    onChange={(e) => [
                      handleChange(e),
                      fetchDistricts(String(e.target.value)),
                    ]}
                    errors={state.errors.state}
                  />
                )}
              </div>

              <div>
                <InputLabel>District*</InputLabel>
                {isDistrictLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <SelectField
                    name="district"
                    variant="outlined"
                    margin="dense"
                    value={state.form.district}
                    options={districts}
                    optionValue="name"
                    onChange={(e) => [
                      handleChange(e),
                      fetchLocalBody(String(e.target.value)),
                    ]}
                    errors={state.errors.district}
                  />
                )}
              </div>

              {showLocalbody && (
                <div>
                  <InputLabel>Localbody</InputLabel>
                  {isLocalbodyLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <SelectField
                      name="local_body"
                      variant="outlined"
                      margin="dense"
                      value={state.form.local_body}
                      options={localBody}
                      optionValue="name"
                      onChange={handleChange}
                      errors={state.errors.local_body}
                    />
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-between mt-4">
              <Button color="default" variant="contained" onClick={goBack}>
                Cancel
              </Button>
              <Button
                color="primary"
                variant="contained"
                type="submit"
                style={{ marginLeft: "auto" }}
                onClick={(e) => handleSubmit(e)}
                startIcon={
                  <CheckCircleOutlineIcon>save</CheckCircleOutlineIcon>
                }
              >
                {buttonText}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
