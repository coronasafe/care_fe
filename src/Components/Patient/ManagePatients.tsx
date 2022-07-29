/* eslint-disable @typescript-eslint/no-unused-vars */
import loadable from "@loadable/component";
import { navigate, useQueryParams } from "raviger";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import moment from "moment";
import React, { useEffect, useState, useCallback } from "react";
import { CSVLink } from "react-csv";
import { useDispatch } from "react-redux";
import SwipeableViews from "react-swipeable-views";
import FacilitiesSelectDialogue from "../ExternalResult/FacilitiesSelectDialogue";
import {
  getAllPatient,
  getDistrict,
  getLocalBody,
  getAnyFacility,
} from "../../Redux/actions";
import { PhoneNumberField } from "../Common/HelperInputFields";
import NavTabs from "../Common/NavTabs";
import Pagination from "../Common/Pagination";
import { InputSearchBox } from "../Common/SearchBox";
import {
  ADMITTED_TO,
  GENDER_TYPES,
  TELEMEDICINE_ACTIONS,
  PATIENT_FILTER_ADMITTED_TO,
  KASP_STRING,
} from "../../Common/constants";
import { make as SlideOver } from "../Common/SlideOver.gen";
import PatientFilterV2 from "./PatientFilterV2";
import { parseOptionId } from "../../Common/utils";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { FacilityModel } from "../Facility/models";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

interface TabPanelProps {
  children?: React.ReactNode;
  dir?: string;
  index: any;
  value: any;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && <div>{children}</div>}
    </div>
  );
}

export function Badge(props: { color: string; icon: string; text: string }) {
  return (
    <span
      className="m-1 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium leading-4 bg-gray-100 text-gray-700"
      title={props.text}
    >
      <i
        className={
          "mr-2 text-md text-" + props.color + "-500 fas fa-" + props.icon
        }
      ></i>
      {props.text}
    </span>
  );
}

const now = moment().format("DD-MM-YYYY:hh:mm:ss");

const RESULT_LIMIT = 14;

export const PatientManager = (props: any) => {
  const { facilityId } = props;
  const dispatch: any = useDispatch();

  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [DownloadFile, setDownloadFile] = useState("");
  const [qParams, setQueryParams] = useQueryParams();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<FacilityModel>({
    name: "",
  });
  const [showDialog, setShowDialog] = useState(false);

  const [districtName, setDistrictName] = useState("");
  const [localbodyName, setLocalbodyName] = useState("");
  const [facilityBadgeName, setFacilityBadgeName] = useState("");
  const [facilityCrumbName, setFacilityCrumbName] = useState("");

  const tabValue = qParams.is_active === "False" ? 1 : 0;

  const params = {
    page: qParams.page || 1,
    name: qParams.name || undefined,
    is_active: qParams.is_active || "True",
    disease_status: qParams.disease_status || undefined,
    phone_number: qParams.phone_number
      ? parsePhoneNumberFromString(qParams.phone_number)?.format("E.164")
      : undefined,
    emergency_phone_number: qParams.emergency_phone_number
      ? parsePhoneNumberFromString(qParams.emergency_phone_number)?.format(
          "E.164"
        )
      : undefined,
    local_body: qParams.lsgBody || undefined,
    facility: facilityId || qParams.facility,
    facility_type: qParams.facility_type || undefined,
    district: qParams.district || undefined,
    offset: (qParams.page ? qParams.page - 1 : 0) * RESULT_LIMIT,
    created_date_before: qParams.created_date_before || undefined,
    created_date_after: qParams.created_date_after || undefined,
    modified_date_before: qParams.modified_date_before || undefined,
    modified_date_after: qParams.modified_date_after || undefined,
    ordering: qParams.ordering || undefined,
    category: qParams.category || undefined,
    gender: qParams.gender || undefined,
    age_min: qParams.age_min || undefined,
    age_max: qParams.age_max || undefined,
    date_declared_positive_before:
      qParams.date_declared_positive_before || undefined,
    date_declared_positive_after:
      qParams.date_declared_positive_after || undefined,
    date_of_result_before: qParams.date_of_result_before || undefined,
    date_of_result_after: qParams.date_of_result_after || undefined,
    last_consultation_admission_date_before:
      qParams.last_consultation_admission_date_before || undefined,
    last_consultation_admission_date_after:
      qParams.last_consultation_admission_date_after || undefined,
    last_consultation_discharge_date_before:
      qParams.last_consultation_discharge_date_before || undefined,
    last_consultation_discharge_date_after:
      qParams.last_consultation_discharge_date_after || undefined,
    last_consultation_admitted_to_list:
      qParams.last_consultation_admitted_to_list || undefined,
    srf_id: qParams.srf_id || undefined,
    number_of_doses: qParams.number_of_doses || undefined,
    covin_id: qParams.covin_id || undefined,
    is_kasp: qParams.is_kasp || undefined,
    is_declared_positive: qParams.is_declared_positive || undefined,
    last_consultation_symptoms_onset_date_before:
      qParams.last_consultation_symptoms_onset_date_before || undefined,
    last_consultation_symptoms_onset_date_after:
      qParams.last_consultation_symptoms_onset_date_after || undefined,
    last_vaccinated_date_before:
      qParams.last_vaccinated_date_before || undefined,
    last_vaccinated_date_after: qParams.last_vaccinated_date_after || undefined,
    last_consultation_is_telemedicine:
      qParams.last_consultation_is_telemedicine || undefined,
    is_antenatal: qParams.is_antenatal || undefined,
  };

  const date_range_fields = [
    [params.created_date_before, params.created_date_after],
    [params.modified_date_before, params.modified_date_after],
    [params.date_declared_positive_before, params.date_declared_positive_after],
    [params.date_of_result_before, params.date_of_result_after],
    [params.last_vaccinated_date_before, params.last_vaccinated_date_after],
    [
      params.last_consultation_admission_date_before,
      params.last_consultation_admission_date_after,
    ],
    [
      params.last_consultation_discharge_date_before,
      params.last_consultation_discharge_date_after,
    ],
    [
      params.last_consultation_symptoms_onset_date_before,
      params.last_consultation_symptoms_onset_date_after,
    ],
  ];

  const durations = date_range_fields.map((field: string[]) => {
    // XOR (checks if only one of the dates is set)
    if (!field[0] !== !field[1]) {
      return -1;
    }
    if (field[0] && field[1]) {
      return moment(field[0]).diff(moment(field[1]), "days");
    }
    return 0;
  });

  const isDownloadAllowed =
    durations.every((x) => x >= 0 && x <= 7) &&
    !durations.every((x) => x === 0);

  let managePatients: any = null;
  const handleDownload = async (isFiltered: boolean) => {
    const res = await dispatch(
      getAllPatient(
        {
          ...params,
          csv: true,
          facility: facilityId,
        },
        "downloadPatients"
      )
    );
    if (res && res.data && res.status === 200) {
      setDownloadFile(res.data);
      document.getElementById("downloadlink")?.click();
    }
  };
  const handleDownloadAll = async () => {
    await handleDownload(false);
  };
  const handleDownloadFiltered = async () => {
    await handleDownload(true);
  };

  useEffect(() => {
    async function fetchFacilityName() {
      if (facilityId) {
        const res = await dispatch(getAnyFacility(facilityId));

        setFacilityCrumbName(res?.data?.name || "");
      } else {
        setFacilityCrumbName("");
      }
    }
    fetchFacilityName();
  }, [dispatch, facilityId]);

  useEffect(() => {
    setIsLoading(true);
    dispatch(getAllPatient(params, "listPatients"))
      .then((res: any) => {
        if (res && res.data) {
          setData(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [
    dispatch,
    facilityId,
    qParams.last_consultation_admission_date_before,
    qParams.last_consultation_admission_date_after,
    qParams.last_consultation_discharge_date_before,
    qParams.last_consultation_discharge_date_after,
    qParams.age_max,
    qParams.age_min,
    qParams.last_consultation_admitted_to_list,
    qParams.facility,
    qParams.facility_type,
    qParams.district,
    qParams.category,
    qParams.gender,
    qParams.ordering,
    qParams.created_date_before,
    qParams.created_date_after,
    qParams.modified_date_before,
    qParams.modified_date_after,
    qParams.is_active,
    qParams.disease_status,
    qParams.name,
    qParams.page,
    qParams.phone_number,
    qParams.emergency_phone_number,
    qParams.srf_id,
    qParams.covin_id,
    qParams.number_of_doses,
    qParams.lsgBody,
    qParams.is_kasp,
    qParams.is_declared_positive,
    qParams.date_declared_positive_before,
    qParams.date_declared_positive_after,
    qParams.date_of_result_before,
    qParams.date_of_result_after,
    qParams.last_consultation_symptoms_onset_date_before,
    qParams.last_consultation_symptoms_onset_date_after,
    qParams.last_vaccinated_date_before,
    qParams.last_vaccinated_date_after,
    qParams.last_consultation_is_telemedicine,
    qParams.is_antenatal,
  ]);

  const fetchDistrictName = useCallback(
    async (status: statusType) => {
      const res =
        Number(qParams.district) &&
        (await dispatch(getDistrict(qParams.district)));
      if (!status.aborted) {
        setDistrictName(res?.data?.name);
      }
    },
    [dispatch, qParams.district]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchDistrictName(status);
    },
    [fetchDistrictName]
  );

  const fetchLocalbodyName = useCallback(
    async (status: statusType) => {
      const res =
        Number(qParams.lsgBody) &&
        (await dispatch(getLocalBody({ id: qParams.lsgBody })));
      if (!status.aborted) {
        setLocalbodyName(res?.data?.name);
      }
    },
    [dispatch, qParams.lsgBody]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchLocalbodyName(status);
    },
    [fetchLocalbodyName]
  );

  const fetchFacilityBadgeName = useCallback(
    async (status: statusType) => {
      const res =
        qParams.facility && (await dispatch(getAnyFacility(qParams.facility)));

      if (!status.aborted) {
        setFacilityBadgeName(res?.data?.name);
      }
    },
    [dispatch, qParams.facility]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchFacilityBadgeName(status);
    },
    [fetchFacilityBadgeName]
  );

  const updateQuery = (params: any) => {
    const nParams = Object.assign({}, qParams, params);
    setQueryParams(nParams, { replace: true });
  };

  const handleTabChange = async (tab: number) => {
    updateQuery({
      ...qParams,
      is_active: tab ? "False" : "True",
      page: 1,
    });
  };

  const handlePagination = (page: number, limit: number) => {
    updateQuery({ page, limit });
  };

  const searchByName = (value: string) => {
    updateQuery({ name: value, page: 1 });
  };

  const searchByPhone = (value: string, name: string) => {
    updateQuery({ [name]: value, page: 1 });
  };

  const applyFilter = (data: any) => {
    const filter = { ...qParams, ...data };
    updateQuery(filter);
    setShowFilters(false);
  };
  const removeFilter = (paramKey: any) => {
    updateQuery({
      ...qParams,
      [paramKey]: "",
    });
  };

  const badge = (key: string, value: any, paramKey: string) => {
    return (
      value && (
        <span className="inline-flex items-center px-3 py-1 mt-2 ml-2 rounded-full text-xs font-medium leading-4 bg-white text-gray-600 border">
          {key}
          {": "}
          {value}
          <i
            className="fas fa-times ml-2 rounded-full cursor-pointer hover:bg-gray-500 px-1 py-0.5"
            onClick={(e) => removeFilter(paramKey)}
          ></i>
        </span>
      )
    );
  };

  const LastAdmittedToTypeBadges = () => {
    const badge = (key: string, value: any, id: string) => {
      return (
        value && (
          <span className="inline-flex items-center px-3 py-1 mt-2 ml-2 rounded-full text-xs font-medium leading-4 bg-white text-gray-600 border">
            {key}
            {": "}
            {value}
            <i
              className="fas fa-times ml-2 rounded-full cursor-pointer hover:bg-gray-500 px-1 py-0.5"
              onClick={(_) => {
                const lcat = qParams.last_consultation_admitted_to_list
                  .split(",")
                  .filter((x: string) => x != id)
                  .join(",");
                updateQuery({
                  ...qParams,
                  last_consultation_admitted_to_list: lcat,
                });
              }}
            ></i>
          </span>
        )
      );
    };

    return qParams.last_consultation_admitted_to_list
      .split(",")
      .map((id: string) => {
        const text = PATIENT_FILTER_ADMITTED_TO.find(
          (obj) => obj.id == id
        )?.text;
        return badge("Bed Type", text, id);
      });
  };

  const showReviewAlert = (patient: any) => {
    return (
      patient.review_time &&
      !patient.last_consultation?.discharge_date &&
      moment(patient.review_time).isAfter(
        patient.last_consultation?.last_daily_round?.modified_date
      )
    );
  };

  let patientList: any[] = [];
  if (data && data.length) {
    patientList = data.map((patient: any, idx: number) => {
      let patientUrl = "";
      if (
        patient.last_consultation &&
        patient.last_consultation?.facility === patient.facility
      ) {
        patientUrl = `/facility/${patient.facility}/patient/${patient.id}/consultation/${patient.last_consultation.id}`;
      } else if (patient.facility) {
        patientUrl = `/facility/${patient.facility}/patient/${patient.id}`;
      } else {
        patientUrl = `/patient/${patient.id}`;
      }
      return (
        <div
          key={`usr_${patient.id}`}
          onClick={() => navigate(patientUrl)}
          className={
            "w-full cursor-pointer border-b-4 md:flex justify-between items-center py-2 " +
            (patient.disease_status == "POSITIVE" ? "bg-red-100" : "")
          }
        >
          <div className="pl-2 sm:flex md:block lg:flex gap-2 w-full">      
            <div>
              <div className="md:flex justify-between w-full">
                <div className="text-xl font-normal capitalize">
                  {patient.name} - {patient.age}
                  {patient.action && patient.action != 10 && (
                    <span className="font-semibold ml-2">
                      -{" "}
                      {
                        TELEMEDICINE_ACTIONS.find(
                          (i) => i.id === patient.action
                        )?.desc
                      }
                    </span>
                  )}
                </div>
              </div>
              {patient.facility_object && (
                <div className="font-normal text-sm">
                  {patient.facility_object.name},
                  <span className="text-xs ml-1">
                    Updated at: {moment(patient.modified_date).format("lll")}
                  </span>
                  {showReviewAlert(patient) && (
                    <span
                      className={
                        "m-1 inline-block items-center px-3 py-1 rounded-full text-xs leading-4 font-semibold " +
                        (moment().isBefore(patient.review_time)
                          ? " bg-gray-100"
                          : "rounded p-1 bg-red-400 text-white")
                      }
                    >
                      {(moment().isBefore(patient.review_time)
                        ? "Review at: "
                        : "Review Missed: ") +
                        moment(patient.review_time).format("lll")}
                    </span>
                  )}
                </div>
              )}
            </div>
            {patient?.last_consultation &&
              patient?.last_consultation?.current_bed && (
                <div
                  className="w-fit self-stretch shrink-0 bg-gray-100 border border-gray-400 text-lg flex items-center justify-center rounded-md pr-2 mt-2
                "
                >
                  <div className="grid grid-cols-2">
                    <div className="ml-2 mt-2">
                      <i className="fa-solid fa-bed-pulse"></i>
                    </div>
                    <div>
                      <div className="text-gray-900 text-sm">
                        {
                          patient?.last_consultation?.current_bed?.bed_object
                            ?.location_object?.name
                        }
                      </div>
                      <div className="text-md font-bold">
                        {
                          patient?.last_consultation?.current_bed?.bed_object
                            .name
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}
          </div>

          <div className="flex w-full">
            <div className="flex flex-wrap flex-row justify-start">
              {patient.allow_transfer ? (
                <Badge color="yellow" icon="unlock" text="Transfer Allowed" />
              ) : (
                <Badge color="primary" icon="lock" text="Transfer Blocked" />
              )}
              {patient.disease_status === "POSITIVE" && (
                <Badge color="red" icon="radiation" text="Positive" />
              )}
              {["NEGATIVE", "RECOVERED"].indexOf(patient.disease_status) >=
                0 && (
                <Badge
                  color="primary"
                  icon="smile-beam"
                  text={patient.disease_status}
                />
              )}
              {patient.gender === 2 &&
                patient.is_antenatal &&
                patient.is_active && (
                <Badge color="blue" icon="baby-carriage" text="Antenatal" />
              )}
              {patient.is_medical_worker && patient.is_active && (
                <Badge color="blue" icon="user-md" text="Medical Worker" />
              )}
              {patient.contact_with_confirmed_carrier && (
                <Badge
                  color="red"
                  icon="exclamation-triangle"
                  text="Contact with confirmed carrier"
                />
              )}
              {patient.contact_with_suspected_carrier && (
                <Badge
                  color="yellow"
                  icon="exclamation-triangle"
                  text="Contact with suspected carrier"
                />
              )}
              {patient.disease_status === "EXPIRED" && (
                <Badge
                  color="yellow"
                  icon="exclamation-triangle"
                  text="Patient Expired"
                />
              )}
              {(!patient.last_consultation ||
                patient.last_consultation?.facility !== patient.facility) && (
                <span className="relative inline-flex">
                  <Badge
                    color="red"
                    icon="notes-medical"
                    text="No Consultation Filed"
                  />
                  <span className="flex absolute h-3 w-3 top-0 right-0 -mt-1 -mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                  </span>
                </span>
              )}
            </div>
          </div>
          <div className="px-2">
            <div className="btn btn-default bg-white">Details</div>
          </div>
        </div>
      );
    });
  }

  if (isLoading || !data) {
    managePatients = <Loading />;
  } else if (data && data.length) {
    managePatients = (
      <>
        {patientList}
        {totalCount > RESULT_LIMIT && (
          <div className="mt-4 flex w-full justify-center">
            <Pagination
              cPage={qParams.page}
              defaultPerPage={RESULT_LIMIT}
              data={{ totalCount }}
              onChange={handlePagination}
            />
          </div>
        )}
      </>
    );
  } else if (data && data.length === 0) {
    managePatients = (
      <div className="w-full text-center">
        <p className="text-lg font-semibold ">No Patients Found</p>
      </div>
    );
  }

  return (
    <div>
      {showDialog && (
        <FacilitiesSelectDialogue
          setSelected={(e) => setSelectedFacility(e)}
          selectedFacility={selectedFacility}
          handleOk={() => navigate(`facility/${selectedFacility.id}/patient`)}
          handleCancel={() => setShowDialog(false)}
        />
      )}
      <PageTitle
        title="Patients"
        hideBack={!facilityId}
        breadcrumbs={!!facilityId}
        crumbsReplacements={{ [facilityId]: { name: facilityCrumbName } }}
      />
      <div className="mt-5 manualGrid grid-cols-1 gap-3 sm:grid-cols-3 my-4 px-2 md:px-0 relative">
        <div className="title-text sm:flex align-center">
          <div className="text-center">
            <button
              onClick={handleDownloadFiltered}
              className="btn text-green-500 font-medium hover:bg-green-50 border border-solid"
            >
              <i className="fa-solid fa-arrow-down-long mr-2"></i>DOWNLOAD{" "}
              {tabValue === 0 ? "LIVE" : "DISCHARGED"} LIST
            </button>
            <CSVLink
              id="downloadlink"
              className="hidden"
              data={DownloadFile}
              filename={`patients-${now}.csv`}
              target="_blank"
            ></CSVLink>
          </div>
          <div className="flex flex-col gap-2">
            <button
              disabled={!isDownloadAllowed}
              onClick={handleDownloadAll}
              className="btn text-green-500 disabled:text-gray-500 font-medium border border-solid"
            >
              <i className="fa-solid fa-arrow-down-long mr-2"></i>DOWNLOAD ALL
              PATIENTS
            </button>
            {!isDownloadAllowed && (
              <p className="self-end text-sm italic text-red-400">
                * Select a 7 day period
              </p>
            )}
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dl>
              <dt className="text-sm leading-5 font-medium text-gray-500 truncate">
                Total Patients
              </dt>
              {/* Show spinner until count is fetched from server */}
              {isLoading ? (
                <dd className="mt-4 text-5xl leading-9">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-10 w-10 text-primary-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </dd>
              ) : (
                <dd className="mt-4 text-5xl leading-9 font-semibold text-gray-900">
                  {totalCount}
                </dd>
              )}
            </dl>
          </div>
        </div>
        <div>
          <div>
            <div className="text-sm font-semibold mb-2">Search by Name</div>
            <InputSearchBox
              search={searchByName}
              value={qParams.name}
              placeholder="Search by Patient Name"
              errors=""
            />
          </div>
          <div>
            <div className="text-sm font-semibold mt-2">
              Search by Primary Number
            </div>
            <PhoneNumberField
              value={qParams.phone_number || "+91"}
              onChange={(value: string) => searchByPhone(value, "phone_number")}
              turnOffAutoFormat={false}
              errors=""
            />
          </div>
        </div>
        <div className="flex flex-col-reverse md:flex-col">
          <div>
            <div className="md:flex items-end gap-2 mb-2">
              <button
                className="btn btn-primary-ghost w-full mt-2 md:mt-7 "
                onClick={(_) => setShowFilters((show) => !show)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="fill-current w-4 h-4 mr-2"
                >
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12">
                    {" "}
                  </line>
                  <line x1="8" y1="18" x2="21" y2="18">
                    {" "}
                  </line>
                  <line x1="3" y1="6" x2="3.01" y2="6">
                    {" "}
                  </line>
                  <line x1="3" y1="12" x2="3.01" y2="12">
                    {" "}
                  </line>
                  <line x1="3" y1="18" x2="3.01" y2="18">
                    {" "}
                  </line>
                </svg>
                <span>Advanced Filters</span>
              </button>
              <button
                className="btn-primary btn md:mt-7 mt-2 w-full md:w-fit"
                onClick={() => {
                  if (facilityId) {
                    navigate(`/facility/${facilityId}/patient`);
                  } else {
                    setShowDialog(true);
                  }
                }}
                data-testid="add-patient-button"
              >
                <i className="fas fa-plus mr-2 text-white"></i>
                Add Details of a Patient
              </button>
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold mt-2">
              Search by Emergency Number
            </div>
            <PhoneNumberField
              value={qParams.emergency_phone_number || "+91"}
              onChange={(value: string) =>
                searchByPhone(value, "emergency_phone_number")
              }
              turnOffAutoFormat={false}
              errors=""
            />
          </div>
        </div>
        <div className="flex flex-wrap w-full col-span-3">
          {qParams.phone_number?.trim().split(" ").length - 1
            ? badge("Primary Number", qParams.phone_number, "phone_number")
            : null}
          {qParams.emergency_phone_number?.trim().split(" ").length - 1
            ? badge(
                "Emergency Number",
                qParams.emergency_phone_number,
                "emergency_phone_number"
              )
            : null}
          {badge("Patient Name", qParams.name, "name")}
          {badge(
            "Modified After",
            qParams.modified_date_after,
            "modified_date_after"
          )}
          {badge(
            "Modified Before",
            qParams.modified_date_before,
            "modified_date_before"
          )}
          {badge(
            "Created Before",
            qParams.created_date_before,
            "created_date_before"
          )}
          {badge(
            "Created After",
            qParams.created_date_after,
            "created_date_after"
          )}
          {badge(
            "Admitted Before",
            qParams.last_consultation_admission_date_before,
            "last_consultation_admission_date_before"
          )}
          {badge(
            "Admitted After",
            qParams.last_consultation_admission_date_after,
            "last_consultation_admission_date_after"
          )}
          {badge(
            "Discharged Before",
            qParams.last_consultation_discharge_date_before,
            "last_consultation_discharge_date_before"
          )}
          {badge(
            "Discharged After",
            qParams.last_consultation_discharge_date_after,
            "last_consultation_discharge_date_after"
          )}
          {qParams.last_consultation_admitted_to_list &&
            LastAdmittedToTypeBadges()}
          {qParams.number_of_doses &&
            badge(
              "Number of Vaccination Doses",
              qParams.number_of_doses,
              "number_of_doses"
            )}
          {qParams.is_kasp &&
            badge(
              KASP_STRING,
              qParams.is_kasp === "true" ? KASP_STRING : `Non ${KASP_STRING}`,
              "is_kasp"
            )}
          {badge("COWIN ID", qParams.covin_id, "covin_id")}
          {badge("Is Antenatal", qParams.is_antenatal, "is_antenatal")}
          {badge("Facility", facilityBadgeName, "facility")}
          {badge("Facility Type", qParams.facility_type, "facility_type")}
          {badge("District", districtName, "district")}
          {badge("Ordering", qParams.ordering, "ordering")}
          {badge("Category", qParams.category, "category")}
          {badge("Disease Status", qParams.disease_status, "disease_status")}
          {badge(
            "Gender",
            parseOptionId(GENDER_TYPES, qParams.gender),
            "gender"
          )}
          {badge(
            "Admitted to",
            ADMITTED_TO[qParams.last_consultation_admitted_to],
            "last_consultation_admitted_to"
          )}
          {badge("Age min", qParams.age_min, "age_min")}
          {badge("Age max", qParams.age_max, "age_max")}
          {badge("SRF ID", qParams.srf_id, "srf_id")}
          {badge("LSG Body", localbodyName, "lsgBody")}
          {badge(
            "Declared Status",
            qParams.is_declared_positive,
            "is_declared_positive"
          )}
          {badge(
            "Result before",
            qParams.date_of_result_before,
            "date_of_result_before"
          )}
          {badge(
            "Result after",
            qParams.date_of_result_after,
            "date_of_result_after"
          )}

          {badge(
            "Declared positive before",
            qParams.date_declared_positive_before,
            "date_declared_positive_before"
          )}

          {badge(
            "Declared positive after",
            qParams.date_declared_positive_after,
            "date_declared_positive_after"
          )}

          {badge(
            "Onset of symptoms before",
            qParams.last_consultation_symptoms_onset_date_before,
            "last_consultation_symptoms_onset_date_before"
          )}

          {badge(
            "Onset of symptoms after",
            qParams.last_consultation_symptoms_onset_date_after,
            "last_consultation_symptoms_onset_date_after"
          )}
          {badge(
            "Vaccinated Date before",
            qParams.last_vaccinated_date_before,
            "last_vaccinated_date_before"
          )}

          {badge(
            "Vaccinated Date after",
            qParams.last_vaccinated_date_after,
            "last_vaccinated_date_after"
          )}
          {badge(
            "Telemedicine",
            qParams.last_consultation_is_telemedicine,
            "last_consultation_is_telemedicine"
          )}
        </div>
      </div>
      <div>
        <SlideOver show={showFilters} setShow={setShowFilters}>
          <div className="bg-white min-h-screen p-4">
            <PatientFilterV2
              filter={qParams}
              onChange={applyFilter}
              closeFilter={() => setShowFilters(false)}
            />
          </div>
        </SlideOver>
        <NavTabs
          onChange={handleTabChange}
          options={[
            { value: 0, label: "Live" },
            { value: 1, label: "Discharged" },
          ]}
          active={tabValue}
        />
        <SwipeableViews index={tabValue}>
          <TabPanel value={tabValue} index={0}>
            <div className="flex flex-wrap">{managePatients}</div>
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <div className="flex flex-wrap">{managePatients}</div>
          </TabPanel>
        </SwipeableViews>
      </div>
    </div>
  );
};
