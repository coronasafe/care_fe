import React, { useEffect, useState, useReducer } from "react";
import axios from "axios";
import {
  SAMPLE_TEST_STATUS,
  SAMPLE_TEST_RESULT,
  SAMPLE_FLOW_RULES,
} from "../../Common/constants";
import { SampleTestModel } from "./models";
import * as Notification from "../../Utils/Notifications.js";
import { createUpload } from "../../Redux/actions";
import { useDispatch } from "react-redux";
import { header_content_type, LinearProgressWithLabel } from "./FileUpload";
import { Submit } from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import ConfirmDialogV2 from "../Common/ConfirmDialogV2";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import { FieldChangeEvent } from "../Form/FormFields/Utils";
import TextFormField from "../Form/FormFields/TextFormField";
import CheckBoxFormField from "../Form/FormFields/CheckBoxFormField";

interface Props {
  sample: SampleTestModel;
  handleOk: (sample: SampleTestModel, status: number, result: number) => void;
  handleCancel: () => void;
  userType: "Staff" | "DistrictAdmin" | "StateLabAdmin";
}

const statusChoices = [...SAMPLE_TEST_STATUS];

const statusFlow = { ...SAMPLE_FLOW_RULES };

const initForm: any = {
  confirm: false,
  status: 0,
  result: 0,
  disabled: true,
};

const initialState = {
  form: { ...initForm },
};

const updateStatusReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case "set_form": {
      return {
        ...state,
        form: action.form,
      };
    }
    default:
      return state;
  }
};

const UpdateStatusDialog = (props: Props) => {
  const { sample, handleOk, handleCancel } = props;
  const [state, dispatch] = useReducer(updateStatusReducer, initialState);
  const [file, setfile] = useState<File>();
  const [contentType, setcontentType] = useState<string>("");
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadStarted, setUploadStarted] = useState<boolean>(false);
  const [uploadDone, setUploadDone] = useState<boolean>(false);
  const redux_dispatch: any = useDispatch();

  const currentStatus = SAMPLE_TEST_STATUS.find(
    (i) => i.text === sample.status
  );

  const status = String(sample.status) as keyof typeof SAMPLE_FLOW_RULES;
  const validStatusChoices = statusChoices.filter(
    (i) => status && statusFlow[status] && statusFlow[status].includes(i.text)
  );

  useEffect(() => {
    const form = { ...state.form };
    form.status = 0;
    dispatch({ type: "set_form", form });
  }, []);

  const okClicked = () => {
    handleOk(sample, state.form.status, state.form.result);
    dispatch({ type: "set_form", form: initForm });
  };

  const cancelClicked = () => {
    handleCancel();
    dispatch({ type: "set_form", form: initForm });
  };

  const handleChange = ({ name, value }: FieldChangeEvent<unknown>) => {
    const form = { ...state.form };
    form[name] = name === "status" || name === "result" ? Number(value) : value;
    form.disabled =
      !form.status || !form.confirm || (form.status === 7 && !form.result);
    dispatch({ type: "set_form", form });
  };

  const uploadfile = (response: any) => {
    const url = response.data.signed_url;
    const internal_name = response.data.internal_name;
    const f = file;
    if (f === undefined) return;
    const newFile = new File([f], `${internal_name}`);

    const config = {
      headers: {
        "Content-type": contentType,
        "Content-disposition": "inline",
      },
      onUploadProgress: (progressEvent: any) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadPercent(percentCompleted);
      },
    };
    axios
      .put(url, newFile, config)
      .then(() => {
        setUploadStarted(false);
        setUploadDone(true);
        Notification.Success({
          msg: "File Uploaded Successfully",
        });
      })
      .catch(() => {
        setUploadStarted(false);
      });
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>): any => {
    if (e.target.files == null) {
      throw new Error("Error finding e.target.files");
    }
    setfile(e.target.files[0]);
    const fileName = e.target.files[0].name;
    const ext: string = fileName.split(".")[1];
    setcontentType(header_content_type[ext]);
    return e.target.files[0];
  };
  const handleUpload = async () => {
    const f = file;
    if (f === undefined) return;
    const category = "UNSPECIFIED";
    const name = f.name;
    setUploadStarted(true);
    setUploadDone(false);
    const requestData = {
      original_name: name,
      file_type: "SAMPLE_MANAGEMENT",
      name: `${sample.patient_name} Sample Report`,
      associating_id: sample.id,
      file_category: category,
    };
    redux_dispatch(createUpload(requestData))
      .then(uploadfile)
      .catch(() => {
        setUploadStarted(false);
      });
  };

  return (
    <ConfirmDialogV2
      title="Update Sample Test Status"
      show
      onClose={cancelClicked}
      onConfirm={okClicked}
      disabled={state.form.disabled}
      action="Update Status"
    >
      <div className="mt-4 flex flex-col">
        <TextFormField
          label="Current Status"
          name="currentStatus"
          value={currentStatus?.desc}
          disabled
          onChange={handleChange}
        />
        <SelectFormField
          label="New Status"
          name="status"
          value={state.form.status}
          options={validStatusChoices}
          optionLabel={(i) => i.desc}
          optionValue={(i) => i.id}
          onChange={handleChange}
        />
        {Number(state.form.status) === 7 && (
          <>
            <SelectFormField
              label="Result"
              name="result"
              value={state.form.result}
              options={SAMPLE_TEST_RESULT}
              optionLabel={(i) => i.text}
              optionValue={(i) => i.id}
              onChange={handleChange}
            />
            <span className="font-semibold leading-relaxed">
              Upload Report :
            </span>
            <input title="reportFile" onChange={onFileChange} type="file" />
            {uploadStarted && <LinearProgressWithLabel value={uploadPercent} />}
            <div className="flex justify-end mt-3 mb-4">
              <Submit
                type="submit"
                onClick={handleUpload}
                disabled={uploadDone}
              >
                <CareIcon className="care-l-cloud-upload text-2xl font-bold" />
                <span>Upload</span>
              </Submit>
            </div>
          </>
        )}
        <CheckBoxFormField
          label="I agree to update the sample test status."
          name="confirm"
          value={state.form.confirm}
          onChange={handleChange}
        />
      </div>
    </ConfirmDialogV2>
  );
};

export default UpdateStatusDialog;
