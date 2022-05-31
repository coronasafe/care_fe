import loadable from "@loadable/component";
import Grid from "@material-ui/core/Grid";
import { Button } from "@material-ui/core";
import CircularProgress from "@material-ui/core/CircularProgress";
import { navigate, useQueryParams } from "raviger";
// import { parsePhoneNumberFromString } from "libphonenumber-js";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { externalResultList } from "../../Redux/actions";
// import { PhoneNumberField } from "../Common/HelperInputFields";
import Pagination from "../Common/Pagination";
import { InputSearchBox } from "../Common/SearchBox";
import { make as SlideOver } from "../Common/SlideOver.gen";
import ListFilter from "./ListFilter";
import moment from "moment";
import { CSVLink } from "react-csv";
// import { externalResultFormatter } from "./Commons";
import GetAppIcon from "@material-ui/icons/GetApp";
import FacilitiesSelectDialogue from "./FacilitiesSelectDialogue";
import { FacilityModel } from "../Facility/models";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

// function Badge(props: { color: string; icon: string; text: string }) {
//   return (
//     <span
//       className="m-1 h-full inline-flex items-center px-3 py-1 rounded-full text-xs font-medium leading-4 bg-gray-100 text-gray-700"
//       title={props.text}
//     >
//       <i
//         className={
//           "mr-2 text-md text-" + props.color + "-500 fas fa-" + props.icon
//         }
//       ></i>
//       {props.text}
//     </span>
//   );
// }

const RESULT_LIMIT = 14;
const now = moment().format("DD-MM-YYYY:hh:mm:ss");

export default function ResultList() {
  const dispatch: any = useDispatch();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [downloadFile, setDownloadFile] = useState("");
  const [qParams, setQueryParams] = useQueryParams();
  const [showFilters, setShowFilters] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  // state to change download button to loading while file is not ready
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<FacilityModel>({
    name: "",
  });
  const [resultId, setResultId] = useState(-1);
  const [dataList, setDataList] = useState({
    lsgList: [],
    wardList: [],
  });
  let manageResults: any = null;
  const local = JSON.parse(localStorage.getItem("external-filters") || "{}");
  const localLsgWard = JSON.parse(
    localStorage.getItem("lsg-ward-data") ||
      JSON.stringify({ lsgList: [], wardList: [] })
  );

  useEffect(() => {
    setIsLoading(true);
    const params = {
      page: qParams.page || 1,
      name: qParams.name || "",
      mobile_number: qParams.mobile_number ? qParams.mobile_number : "",
      wards: qParams.wards || undefined,
      local_bodies: qParams.local_bodies || undefined,
      created_date_before: qParams.created_date_before || undefined,
      created_date_after: qParams.created_date_after || undefined,
      result_date_before: qParams.result_date_before || undefined,
      result_date_after: qParams.result_date_after || undefined,
      sample_collection_date_after:
        qParams.sample_collection_date_after || undefined,
      sample_collection_date_before:
        qParams.sample_collection_date_before || undefined,
      offset: (qParams.page ? qParams.page - 1 : 0) * RESULT_LIMIT,
      srf_id: qParams.srf_id || undefined,
    };

    dispatch(externalResultList(params, "externalResultList"))
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
    qParams.name,
    qParams.page,
    qParams.mobile_number,
    qParams.wards,
    qParams.created_date_before,
    qParams.created_date_after,
    qParams.result_date_before,
    qParams.result_date_after,
    qParams.sample_collection_date_after,
    qParams.sample_collection_date_before,
    qParams.local_bodies,
    qParams.srf_id,
    dataList,
  ]);

  const updateQuery = (filter: any) => {
    const nParams = Object.keys(filter).reduce(
      (a, k) =>
        filter[k] && filter[k] !== "--"
          ? Object.assign(a, { [k]: filter[k] })
          : a,
      {}
    );
    setQueryParams(nParams, true);
  };

  const handlePagination = (page: number, limit: number) => {
    updateQuery({ ...qParams, page, limit });
  };

  const searchByName = (value: string) => {
    updateQuery({ ...qParams, name: value, page: 1 });
  };

  const searchByPhone = (value: string) => {
    updateQuery({ ...qParams, mobile_number: value, page: 1 });
  };

  // const handleFilter = (value: string) => {
  //   updateQuery({ disease_status: value, page: 1 });
  // };

  const applyFilter = (data: any) => {
    const filter = { ...qParams, ...data };
    updateQuery(filter);
    setShowFilters(false);
  };

  useEffect(() => {
    applyFilter(local);
    setDataList({ ...localLsgWard });
  }, []);

  const removeFilter = (paramKey: any) => {
    const localData: any = { ...local };

    updateQuery({
      ...qParams,
      [paramKey]: "",
    });
    localData[paramKey] = "";

    localStorage.setItem("external-filters", JSON.stringify(localData));
  };

  const removeLSGFilter = (paramKey: any, id: any) => {
    const updatedLsgList = dataList.lsgList.filter((x: any) => x.id !== id);
    const lsgParams = updatedLsgList.map((x: any) => x.id);
    const localData: any = { ...local };

    const updatedWardList = dataList.wardList.filter(
      (x: any) => x.local_body_id !== id
    );
    const wardParams = updatedWardList.map((x: any) => x.id);

    updateQuery({
      ...qParams,
      [paramKey]: lsgParams,
      ["wards"]: wardParams,
    });
    localData[paramKey] = lsgParams.length ? lsgParams : "";
    localData["wards"] = wardParams.length ? wardParams : "";

    localStorage.setItem("external-filters", JSON.stringify(localData));
    localStorage.setItem(
      "lsg-ward-data",
      JSON.stringify({ lsgList: updatedLsgList, wardList: updatedWardList })
    );
    setDataList({ lsgList: updatedLsgList, wardList: updatedWardList });
  };

  const removeWardFilter = (paramKey: any, id: any) => {
    const updatedList = dataList.wardList.filter((x: any) => x.id !== id);
    const params = updatedList.map((x: any) => x.id);
    const localData: any = { ...local };

    updateQuery({
      ...qParams,
      [paramKey]: params,
    });
    localData[paramKey] = params.length ? params : "";

    localStorage.setItem("external-filters", JSON.stringify(localData));
    localStorage.setItem(
      "lsg-ward-data",
      JSON.stringify({ ...dataList, wardList: updatedList })
    );
    setDataList({ ...dataList, wardList: updatedList });
  };

  const lsgWardData = (lsgs: any, wards: any) => {
    setDataList({ lsgList: lsgs, wardList: wards });
  };

  const triggerDownload = async () => {
    // while is getting ready
    setDownloadLoading(true);
    const res = await dispatch(
      externalResultList({ ...qParams, csv: true }, "externalResultList")
    );
    // file ready to download
    setDownloadLoading(false);
    setDownloadFile(res?.data);
    document.getElementById("downloadCSV")?.click();
  };

  const badge = (key: string, value: any, paramKey: string) => {
    return (
      value && (
        <span className="inline-flex h-full items-center px-3 py-1 rounded-full text-xs font-medium leading-4 bg-white text-gray-600 border">
          {key}
          {": "}
          {value}
          <i
            className="fas fa-times ml-2 rounded-full cursor-pointer hover:bg-gray-500 px-1 py-0.5"
            onClick={() => removeFilter(paramKey)}
          ></i>
        </span>
      )
    );
  };

  const lsgWardBadge = (key: string, value: any, paramKey: string) => {
    return (
      value && (
        <span
          key={`${key}-${value.id}`}
          className="inline-flex h-full items-center px-3 py-1 rounded-full text-xs font-medium leading-4 bg-white text-gray-600 border"
        >
          {key}
          {": "}
          {value.name}
          <i
            className="fas fa-times ml-2 rounded-full cursor-pointer hover:bg-gray-500 px-1 py-0.5"
            onClick={() =>
              paramKey === "local_bodies"
                ? removeLSGFilter(paramKey, value.id)
                : paramKey === "wards"
                ? removeWardFilter(paramKey, value.id)
                : null
            }
          ></i>
        </span>
      )
    );
  };

  let resultList: any[] = [];
  if (data && data.length) {
    resultList = data.map((result: any) => {
      const resultUrl = `/external_results/${result.id}`;
      return (
        <tr key={`usr_${result.id}`} className="bg-white">
          <td
            onClick={() => navigate(resultUrl)}
            className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-900"
          >
            <div className="flex">
              <a
                href="#"
                className="group inline-flex space-x-2 text-sm leading-5"
              >
                <p className="text-gray-500 group-hover:text-gray-900 transition ease-in-out duration-150">
                  {result.name} - {result.age} {result.age_in}
                </p>
              </a>
            </div>
          </td>
          <td className="px-6 py-4 text-left whitespace-no-wrap text-sm leading-5 text-gray-500">
            <span className="text-gray-900 font-medium">
              {result.test_type}
            </span>
          </td>
          <td className="px-6 py-4 text-left whitespace-no-wrap text-sm leading-5 text-gray-500">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium leading-4 bg-blue-100 text-blue-800 capitalize">
              {result.result}
            </span>
            {result.patient_created ? (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium leading-4 bg-green-100 text-green-800 capitalize">
                Patient Created
              </span>
            ) : null}
          </td>
          <td className="px-6 py-4 text-left whitespace-no-wrap text-sm leading-5 text-gray-500">
            {result.result_date || "-"}
          </td>
          <td className="px-6 py-4 text-left whitespace-no-wrap text-sm leading-5 text-gray-500">
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                setShowDialog(true);
                setResultId(result.id);
              }}
            >
              Create
            </Button>
          </td>
        </tr>
      );
    });
  }

  if (isLoading || !data) {
    manageResults = (
      <tr className="bg-white">
        <td colSpan={5}>
          <Loading />
        </td>
      </tr>
    );
  } else if (data && data.length) {
    manageResults = (
      <>
        {resultList}
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
    manageResults = (
      <Grid item xs={12} md={12}>
        <Grid container justify="center" alignItems="center">
          <h5> No Results Found</h5>
        </Grid>
      </Grid>
    );
  }

  return (
    <div className="px-6">
      {showDialog && (
        <FacilitiesSelectDialogue
          setSelected={(e) => setSelectedFacility(e)}
          selectedFacility={selectedFacility}
          handleOk={() =>
            navigate(`facility/${selectedFacility.id}/patient`, {
              extId: resultId,
            })
          }
          handleCancel={() => setShowDialog(false)}
        />
      )}
      <PageTitle
        title="Results"
        hideBack={true}
        className="mt-4"
        breadcrumbs={false}
      />
      <div className="mt-5 md:grid grid-cols-1 gap-5 sm:grid-cols-3 my-4 px-2 md:px-0 relative">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dl>
              <dt className="text-sm leading-5 font-medium text-gray-500 truncate">
                Total Results
              </dt>
              <dd className="mt-4 text-5xl leading-9 font-semibold text-gray-900">
                {totalCount}
              </dd>
            </dl>
          </div>
        </div>
        <div>
          <div>
            <div className="text-sm font-semibold mb-2">Search by Name</div>
            <InputSearchBox
              search={searchByName}
              value={qParams.name || ""}
              placeholder="Search by Patient Name"
              errors=""
            />
          </div>
          <div>
            <div className="text-sm font-semibold mt-2">Search by number</div>
            <InputSearchBox
              value={qParams.mobile_number || ""}
              search={searchByPhone}
              placeholder="Search by Phone Number"
              errors=""
            />
          </div>
        </div>
        <div className="flex flex-col justify-between">
          <div className="flex">
            <div
              className="btn mt-8 ml-auto btn-primary"
              onClick={(_) => navigate("external_results/upload")}
            >
              Upload List
            </div>
            <div
              className={`btn mt-8 ml-4 gap-2 btn-primary ${
                downloadLoading ? "pointer-events-none" : ""
              }`}
              onClick={triggerDownload}
            >
              <span className="flex flex-row justify-center">
                {downloadLoading ? (
                  <CircularProgress className="w-5 h-5 mr-1 text-white" />
                ) : (
                  <GetAppIcon className="cursor-pointer" />
                )}
                Export
              </span>
            </div>
          </div>
          <div className="flex ml-auto  gap-2">
            <button
              className="flex leading-none border-2 border-gray-200 bg-white rounded-full items-center transition-colors duration-300 ease-in focus:outline-none hover:text-primary-600 focus:text-primary-600 focus:border-gray-400 hover:border-gray-400 rounded-r-full px-4 py-2 text-sm"
              onClick={(_) => setShowFilters((show) => !show)}
            >
              <i className="fa fa-filter mr-1" aria-hidden="true"></i>
              <span>Filters</span>
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2 my-2 flex-wrap w-full col-span-3">
        {dataList.lsgList.map((x) => lsgWardBadge("LSG", x, "local_bodies"))}
      </div>
      <div className="flex items-center space-x-2 my-2 flex-wrap w-full col-span-3">
        {dataList.wardList.map((x) => lsgWardBadge("Ward", x, "wards"))}
      </div>
      <div className="flex items-center space-x-2 my-2 flex-wrap w-full col-span-3">
        {badge("Name", qParams.name || local.name, "name")}
        {badge(
          "Phone Number",
          qParams.mobile_number || local.mobile_number,
          "mobile_number"
        )}
        {badge(
          "Created before",
          qParams.created_date_before || local.created_date_before,
          "created_date_before"
        )}
        {badge(
          "Created after",
          qParams.created_date_after || local.created_date_after,
          "created_date_after"
        )}
        {badge(
          "Result before",
          qParams.result_date_before || local.result_date_before,
          "result_date_before"
        )}
        {badge(
          "Result after",
          qParams.result_date_after || local.result_date_after,
          "result_date_after"
        )}
        {badge(
          "Sample created before",
          qParams.sample_collection_date_before ||
            local.sample_collection_date_before,
          "sample_collection_date_before"
        )}
        {badge(
          "Sample created after",
          qParams.sample_collection_date_after ||
            local.sample_collection_date_after,
          "sample_collection_date_after"
        )}
        {badge("SRF ID", qParams.srf_id, "srf_id")}
      </div>
      <div className="align-middle min-w-full overflow-x-auto shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                Test Type
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wide">
                Status
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                Result Date
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                Create Patient
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {manageResults}
          </tbody>
        </table>
      </div>
      <CSVLink
        data={downloadFile}
        filename={`external-result--${now}.csv`}
        target="_blank"
        className="hidden"
        id={"downloadCSV"}
      />
      <SlideOver show={showFilters} setShow={setShowFilters}>
        <div className="bg-white min-h-screen p-4">
          <ListFilter
            filter={qParams}
            onChange={applyFilter}
            closeFilter={() => setShowFilters(false)}
            dataList={lsgWardData}
            local={local}
          />
        </div>
      </SlideOver>
    </div>
  );
}
