import { useReducer, useState, useCallback, useEffect } from "react";
import loadable from "@loadable/component";
import { FacilitySelect } from "../Common/FacilitySelect";
import {
  MultilineInputField,
  ErrorHelperText,
} from "../Common/HelperInputFields";
import * as Notification from "../../Utils/Notifications.js";
import { useDispatch } from "react-redux";
import { navigate, useQueryParams } from "raviger";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getShiftDetails, updateShift, getUserList } from "../../Redux/actions";
import { SelectField } from "../Common/HelperInputFields";
import {
  SHIFTING_CHOICES,
  FACILITY_TYPES,
  SHIFTING_VEHICLE_CHOICES,
  BREATHLESSNESS_LEVEL,
} from "../../Common/constants";
import { UserSelect } from "../Common/UserSelect";
import { CircularProgress } from "@material-ui/core";
import { useTranslation } from "react-i18next";

import {
  Card,
  CardContent,
  InputLabel,
  Radio,
  RadioGroup,
  Box,
  FormControlLabel,
} from "@material-ui/core";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import useConfig from "../../Common/hooks/useConfig";
import useAppHistory from "../../Common/hooks/useAppHistory";
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

interface patientShiftProps {
  id: string;
}

const shiftStatusOptions = SHIFTING_CHOICES.map((obj) => obj.text);

const initForm: any = {
  shifting_approving_facility_object: null,
  assigned_facility_object: null,
  emergency: "false",
  is_kasp: "false",
  is_up_shift: "true",
  reason: "",
  vehicle_preference: "",
  comments: "",
  assigned_facility_type: "",
  preferred_vehicle_choice: "",
  assigned_to: "",
  initial_status: "",
};

const initError = Object.assign(
  {},
  ...Object.keys(initForm).map((k) => ({ [k]: "" }))
);

const initialState = {
  form: { ...initForm },
  errors: { ...initError },
};

export const ShiftDetailsUpdate = (props: patientShiftProps) => {
  const { goBack } = useAppHistory();
  const { kasp_full_string } = useConfig();
  const dispatchAction: any = useDispatch();
  const [qParams, _] = useQueryParams();
  const [isLoading, setIsLoading] = useState(true);
  const [assignedUser, SetAssignedUser] = useState(null);
  const [assignedUserLoading, setAssignedUserLoading] = useState(false);
  const { t } = useTranslation();

  const requiredFields: any = {
    shifting_approving_facility_object: {
      errorText: t("shifting_approving_facility_can_not_be_empty"),
    },
    assigned_facility_type: {
      errorText: t("please_select_facility_type"),
    },
    preferred_vehicle_choice: {
      errorText: t("please_select_preferred_vehicle_type"),
    },
    reason: {
      errorText: t("please_enter_a_reason_for_the_shift"),
    },
  };

  const shiftFormReducer = (state = initialState, action: any) => {
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

  const [state, dispatch] = useReducer(shiftFormReducer, initialState);

  useEffect(() => {
    async function fetchData() {
      if (state.form.assigned_to) {
        setAssignedUserLoading(true);

        const res = await dispatchAction(
          getUserList({ id: state.form.assigned_to })
        );

        if (res && res.data && res.data.count)
          SetAssignedUser(res.data.results[0]);

        setAssignedUserLoading(false);
      }
    }
    fetchData();
  }, [dispatchAction, state.form.assigned_to]);

  const validateForm = () => {
    const errors = { ...initError };
    let isInvalidForm = false;
    Object.keys(requiredFields).forEach((field) => {
      if (!state.form[field] || !/\S+/.test(state.form[field])) {
        errors[field] = requiredFields[field].errorText;
        isInvalidForm = true;
      }
    });

    dispatch({ type: "set_error", errors });
    return !isInvalidForm;
  };

  const handleChange = (e: any) => {
    const form = { ...state.form };
    const { name, value } = e.target;
    form[name] = value;
    dispatch({ type: "set_form", form });
  };

  const handleOnSelect = (user: any) => {
    const form = { ...state.form };
    form["assigned_to"] = user?.id;
    SetAssignedUser(user);
    dispatch({ type: "set_form", form });
  };

  const setFacility = (selected: any, name: string) => {
    const form = { ...state.form };
    form[name] = selected;
    dispatch({ type: "set_form", form });
  };

  const handleSubmit = async () => {
    const validForm = validateForm();

    if (validForm) {
      setIsLoading(true);

      const data: any = {
        orgin_facility: state.form.orgin_facility_object?.id,
        shifting_approving_facility:
          state.form?.shifting_approving_facility_object?.id,
        assigned_facility: state.form?.assigned_facility_object?.id,
        patient: state.form.patient_object?.id,
        emergency: [true, "true"].includes(state.form.emergency),
        is_kasp: [true, "true"].includes(state.form.is_kasp),
        is_up_shift: [true, "true"].includes(state.form.is_up_shift),
        reason: state.form.reason,
        vehicle_preference: state.form.vehicle_preference,
        comments: state.form.comments,
        assigned_facility_type: state.form.assigned_facility_type,
        preferred_vehicle_choice: state.form.preferred_vehicle_choice,
        assigned_to: state.form.assigned_to,
        breathlessness_level: state.form.breathlessness_level,
      };

      if (state.form.status !== state.form.initial_status) {
        data["status"] = state.form.status;
      }

      const res = await dispatchAction(updateShift(props.id, data));
      setIsLoading(false);

      if (res && res.status == 200 && res.data) {
        dispatch({ type: "set_form", form: res.data });
        Notification.Success({
          msg: t("shift_request_updated_successfully"),
        });

        navigate(`/shifting/${props.id}`);
      } else {
        setIsLoading(false);
      }
    }
  };

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(getShiftDetails({ id: props.id }));
      if (!status.aborted) {
        if (res && res.data) {
          const d = res.data;
          d["initial_status"] = res.data.status;
          d["status"] = qParams.status || res.data.status;
          dispatch({ type: "set_form", form: d });
        }
        setIsLoading(false);
      }
    },
    [props.id, dispatchAction, qParams.status]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );

  const vehicleOptions = SHIFTING_VEHICLE_CHOICES.map((obj) => obj.text);
  const facilityOptions = FACILITY_TYPES.map((obj) => obj.text);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="px-2 pb-2">
      <PageTitle
        title={t("update_shift_request")}
        backUrl={`/shifting/${props.id}`}
      />
      <div className="mt-4">
        <Card>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="md:col-span-1">
                <InputLabel>{t("status")}</InputLabel>
                <SelectField
                  name="status"
                  variant="outlined"
                  margin="dense"
                  optionArray={true}
                  value={state.form.status}
                  options={shiftStatusOptions}
                  onChange={handleChange}
                  className="bg-white h-14 w-full mt-2 shadow-sm md:text-sm md:leading-5"
                />
              </div>
              <div className="flex-none">
                <InputLabel>{t("assigned_to")}</InputLabel>
                <div>
                  {assignedUserLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <UserSelect
                      multiple={false}
                      selected={assignedUser}
                      setSelected={handleOnSelect}
                      errors={""}
                      facilityId={
                        state.form?.shifting_approving_facility_object?.id
                      }
                    />
                  )}
                </div>
              </div>
              <div>
                <InputLabel>
                  {t("name_of_shifting_approving_facility")}
                </InputLabel>
                <FacilitySelect
                  multiple={false}
                  name="shifting_approving_facility"
                  facilityType={1300}
                  selected={state.form.shifting_approving_facility_object}
                  setSelected={(obj) =>
                    setFacility(obj, "shifting_approving_facility_object")
                  }
                  errors={state.errors.shifting_approving_facility_object}
                />
              </div>

              <div>
                <InputLabel>
                  {t("what_facility_assign_the_patient_to")}
                </InputLabel>
                <FacilitySelect
                  multiple={false}
                  name="assigned_facility"
                  selected={state.form.assigned_facility_object}
                  setSelected={(obj) =>
                    setFacility(obj, "assigned_facility_object")
                  }
                  errors={state.errors.assigned_facility}
                />
              </div>

              <div>
                <InputLabel>{t("is_this_an_emergency")}</InputLabel>
                <RadioGroup
                  aria-label="emergency"
                  name="emergency"
                  value={[true, "true"].includes(state.form.emergency)}
                  onChange={handleChange}
                  style={{ padding: "0px 5px" }}
                >
                  <Box>
                    <FormControlLabel
                      value={true}
                      control={<Radio />}
                      label={t("yes")}
                    />
                    <FormControlLabel
                      value={false}
                      control={<Radio />}
                      label={t("no")}
                    />
                  </Box>
                </RadioGroup>
                <ErrorHelperText error={state.errors.emergency} />
              </div>

              <div>
                <InputLabel>
                  {t("is")} {kasp_full_string}?
                </InputLabel>
                <RadioGroup
                  aria-label="is_kasp"
                  name="is_kasp"
                  value={[true, "true"].includes(state.form.is_kasp)}
                  onChange={handleChange}
                  style={{ padding: "0px 5px" }}
                >
                  <Box>
                    <FormControlLabel
                      value={true}
                      control={<Radio />}
                      label={t("yes")}
                    />
                    <FormControlLabel
                      value={false}
                      control={<Radio />}
                      label={t("no")}
                    />
                  </Box>
                </RadioGroup>
                <ErrorHelperText error={state.errors.is_kasp} />
              </div>

              <div>
                <InputLabel>{t("is_this_an_upshift")}</InputLabel>
                <RadioGroup
                  aria-label={t("is_it_upshift")}
                  name="is_up_shift"
                  value={[true, "true"].includes(state.form.is_up_shift)}
                  onChange={handleChange}
                  style={{ padding: "0px 5px" }}
                >
                  <Box>
                    <FormControlLabel
                      value={true}
                      control={<Radio />}
                      label={t("yes")}
                    />
                    <FormControlLabel
                      value={false}
                      control={<Radio />}
                      label={t("no")}
                    />
                  </Box>
                </RadioGroup>
                <ErrorHelperText error={state.errors.is_up_shift} />
              </div>
              <div className="md:col-span-1">
                <InputLabel>{t("preferred_vehicle")}</InputLabel>
                <SelectField
                  name="preferred_vehicle_choice"
                  variant="outlined"
                  margin="dense"
                  optionArray={true}
                  value={state.form.preferred_vehicle_choice}
                  options={["", ...vehicleOptions]}
                  onChange={handleChange}
                  className="bg-white h-11 w-full mt-2 shadow-sm md:leading-5"
                  errors={state.errors.preferred_vehicle_choice}
                />
              </div>
              <div className="md:col-span-1">
                <InputLabel>{t("preferred_facility_type")}*</InputLabel>
                <SelectField
                  name="assigned_facility_type"
                  variant="outlined"
                  margin="dense"
                  optionArray={true}
                  value={state.form.assigned_facility_type}
                  options={["", ...facilityOptions]}
                  onChange={handleChange}
                  className="bg-white h-11 w-full mt-2 shadow-sm md:leading-5"
                  errors={state.errors.assigned_facility_type}
                />
              </div>
              <div className="md:col-span-1">
                <InputLabel>{t("severity_of_breathlessness")}*</InputLabel>
                <SelectField
                  name="breathlessness_level"
                  variant="outlined"
                  margin="dense"
                  optionArray={true}
                  value={state.form.breathlessness_level}
                  options={BREATHLESSNESS_LEVEL}
                  onChange={handleChange}
                  className="bg-white h-11 w-full mt-2 shadow-sm md:leading-5"
                />
              </div>
              <div className="">
                <InputLabel>{t("reason_for_shift")}*</InputLabel>
                <MultilineInputField
                  rows={5}
                  name="reason"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  placeholder={t("type_your_reason_here") + "*"}
                  value={state.form.reason}
                  onChange={handleChange}
                  errors={state.errors.reason}
                />
              </div>

              <div className="">
                <InputLabel>{t("any_other_comments")}</InputLabel>
                <MultilineInputField
                  rows={5}
                  name="comments"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  placeholder={t("type_any_extra_comments_here")}
                  value={state.form.comments}
                  onChange={handleChange}
                  errors={state.errors.comments}
                />
              </div>

              <div className="md:col-span-2 flex flex-col md:flex-row gap-2 justify-between mt-4">
                <Cancel onClick={() => goBack()} />
                <Submit onClick={handleSubmit} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
