import { result } from "lodash";
import moment from "moment";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { dailyRoundsAnalyse } from "../../../Redux/actions";
import Pagination from "../../Common/Pagination";

const DataTable = (props: any) => {
  const { title, data } = props;
  return (
    <div>
      <div className="text-xl font-semibold">{title}</div>
      <div className="flex flex-row shadow overflow-hidden sm:rounded-lg divide-y divide-cool-gray-200 mb-4 w-max-content">
        <div className="flex flex-col justify-between min-w-max-content w-50">
          <div className="px-6 py-3 bg-cool-gray-50 text-center text-xs leading-4 font-medium text-cool-gray-500 uppercase tracking-wider">
            Time
          </div>
          <div className="px-6 py-3 bg-cool-gray-50 text-center text-xs leading-4 font-medium text-cool-gray-500 uppercase tracking-wider">
            Left
          </div>
          <div className="px-6 py-3 bg-cool-gray-50 text-center text-xs leading-4 font-medium text-cool-gray-500 uppercase tracking-wider">
            Right
          </div>
        </div>
        <div
          style={{ direction: "rtl" }}
          className="flex flex-row overflow-x-auto"
        >
          {data.map((x: any, i: any) => {
            return (
              <div
                key={`${title}_${i}`}
                className="flex flex-col w-1/6 min-w-max-content divide-x divide-cool-gray-200"
              >
                <div className="px-6 py-3 bg-cool-gray-50 text-center text-xs leading-4 font-medium text-cool-gray-500 uppercase tracking-wider">
                  {x.date}
                </div>
                <div className="px-6 py-4 bg-white text-center whitespace-no-wrap text-sm leading-5 text-cool-gray-500">
                  {x.left}
                </div>
                <div className="px-6 py-4 bg-white text-center whitespace-no-wrap text-sm leading-5 text-cool-gray-500">
                  {x.right}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const DataDescription = (props: any) => {
  const { title, data } = props;
  return (
    <div>
      <div className="text-xl font-semibold">{title}</div>
      <div className="p-4 bg-white border rounded-lg shadow">
        {data.map((x: any, i: any) => (
          <div key={`${title}_${i}`} className="mb-2">
            <div className="text-sm font-bold">{`- ${x.date}`}</div>
            <div className="text-cool-gray-800 pl-2">
              <span className="font-semibold">Left: </span>
              {x.left}
            </div>
            <div className="text-cool-gray-800 pl-2">
              <span className="font-semibold">Right: </span>
              {x.right}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const NeurologicalTable = (props: any) => {
  const { facilityId, patientId, consultationId } = props;
  const dispatch: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const LOC_OPTIONS = [
    { id: 0, value: "Unknown" },
    { id: 5, value: "Alert" },
    { id: 10, value: "Drowsy" },
    { id: 15, value: "Stuporous" },
    { id: 20, value: "Comatose" },
    { id: 25, value: "Cannot Be Assessed" },
  ];

  const REACTION_OPTIONS = [
    { id: 0, value: "Unknown" },
    { id: 5, value: "Brisk" },
    { id: 10, value: "Sluggish" },
    { id: 15, value: "Fixed" },
    { id: 20, value: "Cannot Be Assessed" },
  ];

  const LIMP_OPTIONS = [
    { id: 0, value: "Unknown" },
    { id: 5, value: "Strong" },
    { id: 10, value: "Moderate" },
    { id: 15, value: "Weak" },
    { id: 20, value: "Flexion" },
    { id: 25, value: "Extension" },
    { id: 30, value: "None" },
  ];

  const fetchDailyRounds = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(
        dailyRoundsAnalyse(
          {
            page: currentPage,
            fields: [
              "consciousness_level",
              "consciousness_level_detail",
              "left_pupil_size",
              "left_pupil_size_detail",
              "right_pupil_size",
              "right_pupil_size_detail",
              "left_pupil_light_reaction",
              "left_pupil_light_reaction_detail",
              "right_pupil_light_reaction",
              "right_pupil_light_reaction_detail",
              "limb_response_upper_extremity_right",
              "limb_response_upper_extremity_left",
              "limb_response_lower_extremity_left",
              "limb_response_lower_extremity_right",
            ],
          },
          { consultationId }
        )
      );
      if (!status.aborted) {
        if (res && res.data && res.data.results) {
          setResults(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      }
    },
    [consultationId, dispatch, currentPage]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchDailyRounds(status);
    },
    [currentPage]
  );

  const handlePagination = (page: number, limit: number) => {
    setCurrentPage(page);
  };

  const locData: any = [];
  const locDescription: any = [];
  const sizeData: any = [];
  const sizeDescription: any = [];
  const reactionData: any = [];
  const reactionDescription: any = [];
  const upperLimbData: any = [];
  const lowerLimbData: any = [];
  Object.entries(results).map((x: any) => {
    if (x[1].consciousness_level) {
      locData.push({
        date: moment(x[0]).format("LLL"),
        loc:
          LOC_OPTIONS.find((item) => item.id === x[1].consciousness_level)
            ?.value || "--",
      });
    }

    if (x[1].consciousness_level_detail) {
      locDescription.push({
        date: moment(x[0]).format("LLL"),
        loc: x[1].consciousness_level_detail,
      });
    }

    if (x[1].left_pupil_size || x[1].right_pupil_size) {
      sizeData.push({
        date: moment(x[0]).format("LLL"),
        left: x[1].left_pupil_size || "-",
        right: x[1].right_pupil_size || "-",
      });
    }

    if (x[1].left_pupil_size_detail || x[1].right_pupil_size_detail) {
      sizeDescription.push({
        date: moment(x[0]).format("LLL"),
        left: x[1].left_pupil_size_detail || "-",
        right: x[1].right_pupil_size_detail || "-",
      });
    }

    if (x[1].left_pupil_light_reaction || x[1].right_pupil_light_reaction) {
      reactionData.push({
        date: moment(x[0]).format("LLL"),
        left:
          REACTION_OPTIONS.find(
            (item) => item.id === x[1].left_pupil_light_reaction
          )?.value || "--",
        right:
          REACTION_OPTIONS.find(
            (item) => item.id === x[1].right_pupil_light_reaction
          )?.value || "--",
      });
    }

    if (
      x[1].left_pupil_light_reaction_detail ||
      x[1].right_pupil_light_reaction_detail
    ) {
      reactionDescription.push({
        date: moment(x[0]).format("LLL"),
        left: x[1].left_pupil_light_reaction_detail || "-",
        right: x[1].right_pupil_light_reaction_detail || "-",
      });
    }
    if (
      x[1].limb_response_upper_extremity_left ||
      x[1].limb_response_upper_extremity_right
    ) {
      upperLimbData.push({
        date: moment(x[0]).format("LLL"),
        left:
          LIMP_OPTIONS.find(
            (item) => item.id === x[1].limb_response_upper_extremity_left
          )?.value || "--",
        right:
          LIMP_OPTIONS.find(
            (item) => item.id === x[1].limb_response_upper_extremity_right
          )?.value || "--",
      });
    }

    if (
      x[1].limb_response_lower_extremity_left ||
      x[1].limb_response_lower_extremity_right
    ) {
      lowerLimbData.push({
        date: moment(x[0]).format("LLL"),
        left:
          LIMP_OPTIONS.find(
            (item) => item.id === x[1].limb_response_lower_extremity_left
          )?.value || "--",
        right:
          LIMP_OPTIONS.find(
            (item) => item.id === x[1].limb_response_lower_extremity_right
          )?.value || "--",
      });
    }
  });

  return (
    <div className="mt-2">
      <div className="mb-6">
        <div className="text-xl font-semibold">Level Of Consciousness</div>
        <div className="flex flex-row shadow overflow-hidden sm:rounded-lg divide-y divide-cool-gray-200 my-4 w-max-content">
          <div
            style={{ direction: "rtl" }}
            className="flex flex-row overflow-x-auto"
          >
            {locData.map((x: any, i: any) => (
              <div
                key={`loc_${i}`}
                className="flex flex-col  w-1/6 min-w-max-content  divide-x divide-cool-gray-200"
              >
                <div className="px-6 py-3 bg-cool-gray-50 text-center text-xs leading-4 font-medium text-cool-gray-500 uppercase tracking-wider">
                  {x.date}
                </div>
                <div className="px-6 py-4 bg-white text-center whitespace-no-wrap text-sm leading-5 text-cool-gray-500">
                  {x.loc}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xl font-semibold">
            Level Of Consciousness Description
          </div>
          <div className="p-4 bg-white border rounded-lg shadow">
            {locDescription.map((x: any, i: any) => (
              <div key={`loc_desc_${i}`} className="mb-2">
                <div className="text-sm font-semibold">{`- ${x.date}`}</div>
                <div className="text-cool-gray-800 pl-2">{x.loc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mb-6">
        <DataTable title={"Pupil Size"} data={sizeData} />
        <DataDescription
          title={"Pupil Size Description"}
          data={sizeDescription}
        />
      </div>
      <div className="mb-6">
        <DataTable title={"Pupil Reaction"} data={reactionData} />
        <DataDescription
          title={"Pupil Reaction Description"}
          data={reactionDescription}
        />
      </div>
      <div className="mb-6">
        <DataTable title={"Upper Extremity"} data={upperLimbData} />
        <DataTable title={"Lower Extremity"} data={lowerLimbData} />
      </div>
      <div className="mt-4 flex w-full justify-center">
        <Pagination
          cPage={currentPage}
          defaultPerPage={36}
          data={{ totalCount }}
          onChange={handlePagination}
        />
      </div>
    </div>
  );
};
