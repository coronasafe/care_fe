import loadable from "@loadable/component";
import React, { useState, useCallback, useReducer } from "react";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { GENDER_TYPES } from "../../Common/constants";
import { useDispatch, useSelector } from "react-redux";
import {
  getUserDetails,
  partialUpdateUser,
  updateUserPassword,
} from "../../Redux/actions";
import { ErrorHelperText } from "../Common/HelperInputFields";
import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import { validateEmailAddress } from "../../Common/validation";
import * as Notification from "../../Utils/Notifications.js";
import LanguageSelector from "../../Components/Common/LanguageSelector";
import SelectMenuV2 from "../Form/SelectMenuV2";
import { FieldLabel } from "../Form/FormFields/FormField";
import TextFormField from "../Form/FormFields/TextFormField";
import ButtonV2, { Submit } from "../Common/components/ButtonV2";
import { handleSignOut } from "../../Utils/utils";
import CareIcon from "../../CAREUI/icons/CareIcon";
import PhoneNumberFormField from "../Form/FormFields/PhoneNumberFormField";

const Loading = loadable(() => import("../Common/Loading"));

type EditForm = {
  firstName: string;
  lastName: string;
  age: string;
  gender: string;
  email: string;
  phoneNumber: string;
  altPhoneNumber: string;
};
type State = {
  form: EditForm;
  errors: EditForm;
};
type Action =
  | { type: "set_form"; form: EditForm }
  | { type: "set_error"; errors: EditForm };

const initForm: EditForm = {
  firstName: "",
  lastName: "",
  age: "",
  gender: "",
  email: "",
  phoneNumber: "",
  altPhoneNumber: "",
};

const initError: EditForm = Object.assign(
  {},
  ...Object.keys(initForm).map((k) => ({ [k]: "" }))
);

const initialState: State = {
  form: { ...initForm },
  errors: { ...initError },
};

const editFormReducer = (state: State, action: Action) => {
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
  }
};
export default function UserProfile() {
  const [states, dispatch] = useReducer(editFormReducer, initialState);
  const reduxDispatch: any = useDispatch();

  const state: any = useSelector((state) => state);
  const { currentUser } = state;
  const username = currentUser.data.username;

  const [changePasswordForm, setChangePasswordForm] = useState<{
    username: string;
    old_password: string;
    new_password_1: string;
    new_password_2: string;
  }>({
    username: username,
    old_password: "",
    new_password_1: "",
    new_password_2: "",
  });

  const [changePasswordErrors] = useState<{
    old_password: string;
    password_confirmation: string;
  }>({
    old_password: "",
    password_confirmation: "",
  });

  const [showEdit, setShowEdit] = useState<boolean | false>(false);

  const [isLoading, setIsLoading] = useState(false);
  const dispatchAction: any = useDispatch();

  const initialDetails: any = [{}];
  const [details, setDetails] = useState(initialDetails);

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(getUserDetails(username));
      if (!status.aborted) {
        if (res && res.data) {
          setDetails(res.data);
          const formData: EditForm = {
            firstName: res.data.first_name,
            lastName: res.data.last_name,
            age: res.data.age,
            gender: res.data.gender,
            email: res.data.email,
            phoneNumber: res.data.phone_number,
            altPhoneNumber: res.data.alt_phone_number,
          };
          dispatch({
            type: "set_form",
            form: formData,
          });
        }
        setIsLoading(false);
      }
    },
    [dispatchAction, username]
  );
  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );

  const validateForm = () => {
    const errors = { ...initError };
    let invalidForm = false;
    Object.keys(states.form).forEach((field) => {
      switch (field) {
        case "firstName":
        case "lastName":
        case "gender":
          if (!states.form[field]) {
            errors[field] = "Field is required";
            invalidForm = true;
          }
          return;
        case "age":
          if (!states.form[field]) {
            errors[field] = "This field is required";
            invalidForm = true;
          } else if (
            Number(states.form[field]) <= 0 ||
            !/^\d+$/.test(states.form[field])
          ) {
            errors[field] = "Age must be a number greater than 0";
            invalidForm = true;
          }
          return;
        case "phoneNumber":
          // eslint-disable-next-line no-case-declarations
          const phoneNumber = parsePhoneNumberFromString(
            states.form[field],
            "IN"
          );

          // eslint-disable-next-line no-case-declarations
          let is_valid = false;
          if (phoneNumber) {
            is_valid = phoneNumber.isValid();
          }

          if (!states.form[field] || !is_valid) {
            errors[field] = "Please enter valid phone number";
            invalidForm = true;
          }
          return;
        case "altPhoneNumber":
          // eslint-disable-next-line no-case-declarations
          let alt_is_valid = false;
          if (states.form[field] && states.form[field] !== "+91") {
            const altPhoneNumber = parsePhoneNumberFromString(
              states.form[field],
              "IN"
            );
            if (altPhoneNumber) {
              alt_is_valid = altPhoneNumber.isValid();
            }
          }

          if (
            states.form[field] &&
            states.form[field] !== "+91" &&
            !alt_is_valid
          ) {
            errors[field] = "Please enter valid mobile number";
            invalidForm = true;
          }
          return;
        case "email":
          if (states.form[field] && !validateEmailAddress(states.form[field])) {
            errors[field] = "Enter a valid email address";
            invalidForm = true;
          }
          return;
      }
    });
    dispatch({ type: "set_error", errors });
    return !invalidForm;
  };

  const handleValueChange = (value: any, name: string) => {
    const form: EditForm = { ...states.form, [name]: value };
    dispatch({ type: "set_form", form });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validForm = validateForm();
    if (validForm) {
      const data = {
        username: username,
        first_name: states.form.firstName,
        last_name: states.form.lastName,
        email: states.form.email,
        phone_number: parsePhoneNumberFromString(
          states.form.phoneNumber
        )?.format("E.164"),
        alt_phone_number:
          parsePhoneNumberFromString(states.form.altPhoneNumber)?.format(
            "E.164"
          ) || "",
        gender: states.form.gender,
        age: states.form.age,
      };
      const res = await dispatchAction(partialUpdateUser(username, data));
      if (res && res.data) {
        Notification.Success({
          msg: "Details updated successfully",
        });
        window.location.reload();
        setDetails({
          ...details,
          first_name: states.form.firstName,
          last_name: states.form.lastName,
          age: states.form.age,
          gender: states.form.gender,
          email: states.form.email,
          phone_number: states.form.phoneNumber,
          alt_phone_number: states.form.altPhoneNumber,
        });
        setShowEdit(false);
      }
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  const changePassword = (e: any) => {
    e.preventDefault();
    //validating form
    if (
      changePasswordForm.new_password_1 != changePasswordForm.new_password_2
    ) {
      Notification.Error({
        msg: "Passwords are different in the new and the confirmation column.",
      });
    } else {
      setIsLoading(true);
      const form = {
        old_password: changePasswordForm.old_password,
        username: username,
        new_password: changePasswordForm.new_password_1,
      };
      reduxDispatch(updateUserPassword(form)).then((resp: any) => {
        setIsLoading(false);
        const res = resp && resp.data;
        if (res.message === "Password updated successfully") {
          Notification.Success({
            msg: "Password changed!",
          });
        } else {
          Notification.Error({
            msg: "There was some error. Please try again in some time.",
          });
        }
        setChangePasswordForm({
          ...changePasswordForm,
          new_password_1: "",
          new_password_2: "",
          old_password: "",
        });
      });
    }
  };
  return (
    <div>
      <div className="lg:p-20 p-10">
        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          <div className="lg:col-span-1">
            <div className="px-4 sm:px-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Personal Information
              </h3>
              <p className="mt-1 text-sm leading-5 text-gray-600 mb-1">
                Local Body, District and State are Non Editable Settings.
              </p>
              <div className="flex flex-col gap-2">
                <ButtonV2 onClick={(_) => setShowEdit(!showEdit)} type="button">
                  {showEdit ? "Cancel" : "Edit User Profile"}
                </ButtonV2>
                <ButtonV2 variant="danger" onClick={(_) => handleSignOut(true)}>
                  <CareIcon className="care-l-sign-out-alt" />
                  Sign out
                </ButtonV2>
              </div>
            </div>
          </div>
          <div className="mt-5 lg:mt-0 lg:col-span-2">
            {!showEdit && (
              <div className="px-4 py-5 sm:px-6 bg-white shadow overflow-hidden  sm:rounded-lg m-2 rounded-lg">
                <dl className="grid grid-cols-1 col-gap-4 row-gap-8 sm:grid-cols-2">
                  <div className="sm:col-span-1 my-2">
                    <dt className="text-sm leading-5 font-medium text-black">
                      Username
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.username || "-"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1  my-2">
                    <dt className="text-sm leading-5 font-medium text-black">
                      Contact No
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.phone_number || "-"}
                    </dd>
                  </div>

                  <div className="sm:col-span-1  my-2">
                    <dt className="text-sm leading-5 font-medium text-black">
                      Whatsapp No
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.alt_phone_number || "-"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1  my-2">
                    <dt className="text-sm leading-5 font-medium text-black">
                      Email address
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.email || "-"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1  my-2">
                    <dt className="text-sm leading-5 font-medium text-black">
                      First Name
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.first_name || "-"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1  my-2">
                    <dt className="text-sm leading-5 font-medium text-black">
                      Last Name
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.last_name || "-"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1  my-2">
                    <dt className="text-sm leading-5 font-medium text-black">
                      Age
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.age || "-"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1  my-2">
                    <dt className="text-sm leading-5 font-medium text-black">
                      Access Level
                    </dt>
                    <dd className="mt-1 badge badge-pill bg-primary-500 text-sm text-white">
                      <i className="fa-solid fa-user-check mr-1"></i>{" "}
                      {details.user_type || "-"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1  my-2">
                    <dt className="text-sm leading-5 font-medium text-black">
                      Gender
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.gender || "-"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1  my-2">
                    <dt className="text-sm leading-5 font-medium text-black">
                      Local Body
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.local_body_object?.name || "-"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1  my-2">
                    <dt className="text-sm leading-5 font-medium text-black">
                      District
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.district_object?.name || "-"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1  my-2">
                    <dt className="text-sm leading-5 font-medium text-black">
                      State
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.state_object?.name || "-"}
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            {showEdit && (
              <div>
                <form action="#" method="POST">
                  <div className="shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 pt-5 bg-white">
                      <div className="grid grid-cols-6 gap-4">
                        <div className="col-span-6 sm:col-span-3">
                          <TextFormField
                            name="firstName"
                            label="First Name"
                            value={states.form.firstName}
                            onChange={(e) =>
                              handleValueChange(e?.value, "firstName")
                            }
                            error={states.errors.firstName}
                            required
                          />
                        </div>

                        <div className="col-span-6 sm:col-span-3">
                          <TextFormField
                            name="lastName"
                            label="Last name"
                            value={states.form.lastName}
                            onChange={(e) =>
                              handleValueChange(e?.value, "lastName")
                            }
                            error={states.errors.lastName}
                            required
                          />
                        </div>
                        <div className="col-span-6 sm:col-span-3">
                          <TextFormField
                            name="age"
                            label="Age"
                            value={states.form.age}
                            onChange={(e) => handleValueChange(e, "age")}
                            error={states.errors.age}
                            required
                          />
                        </div>

                        <div className="col-span-6 sm:col-span-3">
                          <FieldLabel className="text-sm">Gender</FieldLabel>
                          <SelectMenuV2
                            required
                            placeholder="Select"
                            optionLabel={(o) => o.text}
                            optionValue={(o) => o.text}
                            optionIcon={(o) => (
                              <i className="text-base">{o.icon}</i>
                            )}
                            value={states.form.gender}
                            options={GENDER_TYPES}
                            onChange={(v) => {
                              dispatch({
                                type: "set_form",
                                form: {
                                  ...states.form,
                                  gender: v,
                                },
                              });
                            }}
                          />
                          <ErrorHelperText error={states.errors.gender} />
                        </div>

                        <div className="col-span-6 sm:col-span-3">
                          <PhoneNumberFormField
                            label="Phone Number"
                            required
                            name="phoneNumber"
                            placeholder="Phone Number"
                            value={states.form.phoneNumber}
                            onChange={(event) =>
                              handleValueChange(event.value, event.name)
                            }
                            error={states.errors.phoneNumber}
                          />
                        </div>

                        <div className="col-span-6 sm:col-span-3">
                          <PhoneNumberFormField
                            name="altPhoneNumber"
                            label="Whatsapp Number"
                            placeholder="WhatsApp Number"
                            value={states.form.altPhoneNumber}
                            onChange={(event) =>
                              handleValueChange(event.value, event.name)
                            }
                            error={states.errors.altPhoneNumber}
                          />
                        </div>
                        <div className="col-span-6 sm:col-span-3">
                          <TextFormField
                            name="email"
                            label="Email"
                            value={states.form.email}
                            onChange={(e) => handleValueChange(e, "email")}
                            error={states.errors.email}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="px-4 sm:px-6 py-3 bg-gray-50 text-right">
                      <Submit onClick={handleSubmit} label="Update" />
                    </div>
                  </div>
                </form>
                <form action="#" method="POST">
                  <div className="shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 pt-5 bg-white">
                      <div className="grid grid-cols-6 gap-4">
                        <div className="col-span-6 sm:col-span-3">
                          <TextFormField
                            name="old_password"
                            label="Current Password"
                            type="password"
                            value={changePasswordForm.old_password}
                            onChange={(e) =>
                              setChangePasswordForm({
                                ...changePasswordForm,
                                old_password: e.value,
                              })
                            }
                            error={changePasswordErrors.old_password}
                            required
                          />
                        </div>
                        <div className="col-span-6 sm:col-span-3">
                          <TextFormField
                            name="new_password_1"
                            label="New Password"
                            type="password"
                            value={changePasswordForm.new_password_1}
                            onChange={(e) =>
                              setChangePasswordForm({
                                ...changePasswordForm,
                                new_password_1: e.value,
                              })
                            }
                            error=""
                            required
                          />
                        </div>
                        <div className="col-span-6 sm:col-span-3">
                          <TextFormField
                            name="new_password_2"
                            label="New Password Confirmation"
                            type="password"
                            value={changePasswordForm.new_password_2}
                            onChange={(e) =>
                              setChangePasswordForm({
                                ...changePasswordForm,
                                new_password_2: e.value,
                              })
                            }
                            error={changePasswordErrors.password_confirmation}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="px-4 sm:px-6 py-3 bg-gray-50 text-right">
                      <Submit
                        onClick={changePassword}
                        label="Change Password"
                      />
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        <div className="md:grid md:grid-cols-3 md:gap-6 mt-6 mb-8">
          <div className="md:col-span-1">
            <div className="px-4 sm:px-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Language Selection
              </h3>
              <p className="mt-1 text-sm leading-5 text-gray-600">
                Set your local language
              </p>
            </div>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <LanguageSelector className="bg-white w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
