import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@material-ui/core";
import React, { useEffect, useState, useReducer } from "react";
import axios from "axios";
import {
  SAMPLE_TEST_STATUS,
  SAMPLE_TEST_RESULT,
  SAMPLE_FLOW_RULES,
} from "../../Common/constants";
import { CheckboxField, SelectField } from "../Common/HelperInputFields";
import { SampleTestModel } from "./models";
import * as Notification from "../../Utils/Notifications.js";
import { createUpload } from "../../Redux/actions";
import { useDispatch } from "react-redux";
import { header_content_type, LinearProgressWithLabel } from "./FileUpload";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";

interface Props {
  sample: SampleTestModel;
  handleOk: (sample: SampleTestModel, status: number, result: number) => void;
  handleCancel: () => void;
  userType: "Staff" | "DistrictAdmin" | "StateLabAdmin";
}

const statusChoices = [...SAMPLE_TEST_STATUS];

const statusFlow = { ...SAMPLE_FLOW_RULES };

const resultTypes = [
  {
    id: 0,
    text: "Select",
  },
  ...SAMPLE_TEST_RESULT,
];

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

  const newStatusChoices = [
    {
      id: 0,
      desc: "Select",
    },
    ...validStatusChoices,
  ];

  const okClicked = () => {
    handleOk(sample, state.form.status, state.form.result);
    dispatch({ type: "set_form", form: initForm });
  };

  const cancelClicked = () => {
    handleCancel();
    dispatch({ type: "set_form", form: initForm });
  };

  const handleChange = (name: string, value: any) => {
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

  const handleEscKeyPress = (event: any) => {
    if (event.key === "Escape") {
      cancelClicked();
    }
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
    <Dialog open={true} onKeyDown={(e) => handleEscKeyPress(e)}>
      <DialogTitle id="test-sample-title">
        Update Sample Test Status
      </DialogTitle>
      <DialogContent>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <div className="font-semibold leading-relaxed">Current Status :</div>
          <div className="md:col-span-2">{currentStatus?.desc}</div>
          <div className="font-semibold leading-relaxed">New Status :</div>
          <div className="md:col-span-2">
            <SelectField
              name="status"
              variant="standard"
              optionValue="desc"
              value={state.form.status}
              options={newStatusChoices}
              onChange={(e: any) => handleChange(e.target.name, e.target.value)}
            />
          </div>
          {Number(state.form.status) === 7 && (
            <>
              <div className="font-semibold leading-relaxed text-right">
                Result :
              </div>
              <div className="md:col-span-2">
                <SelectField
                  name="result"
                  variant="standard"
                  value={state.form.result}
                  options={resultTypes}
                  onChange={(e: any) =>
                    handleChange(e.target.name, e.target.value)
                  }
                />
              </div>
            </>
          )}
          {Number(state.form.status) === 7 && (
            <>
              <div className="font-semibold leading-relaxed text-right">
                Upload Report :
              </div>
              <div className="md:col-span-2">
                <input title="reportFile" onChange={onFileChange} type="file" />
              </div>
              <div className="col-start-2 col-span-2">
                {uploadStarted && (
                  <LinearProgressWithLabel value={uploadPercent} />
                )}
              </div>
              <div className="flex justify-end col-start-2 col-span-2">
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
          <div className="md:col-span-3">
            <CheckboxField
              checked={state.form.confirm}
              onChange={(e: any) =>
                handleChange(e.target.name, e.target.checked)
              }
              name="confirm"
              label="I agree to update the sample test status."
            />
          </div>
        </div>
      </DialogContent>
      <DialogActions style={{ justifyContent: "space-between" }}>
        <Cancel onClick={cancelClicked} />
        <Submit
          onClick={okClicked}
          disabled={state.form.disabled}
          label="Update Status"
        />
      </DialogActions>
    </Dialog>
  );
};

export default UpdateStatusDialog;
