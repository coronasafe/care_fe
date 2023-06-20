import { useEffect, useState } from "react";
import {
  LegacyAutoCompleteAsyncField,
  LegacyTextInputField,
} from "../Common/HelperInputFields";
import { DateRangePicker, getDate } from "../Common/DateRangePicker";
import { getAllLocalBodyByDistrict } from "../../Redux/actions";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import useMergeState from "../../Common/hooks/useMergeState";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";
import FiltersSlideover from "../../CAREUI/interactive/FiltersSlideover";
import { FieldLabel } from "../Form/FormFields/FormField";

const clearFilterState = {
  created_date_before: "",
  created_date_after: "",
  result_date_before: "",
  result_date_after: "",
  sample_collection_date_before: "",
  sample_collection_date_after: "",
  srf_id: "",
};

export default function ListFilter(props: any) {
  const { filter, onChange, closeFilter, dataList } = props;
  const [wardList, setWardList] = useState<any[]>([]);
  const [lsgList, setLsgList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [wards, setWards] = useState<any[]>([]);
  const [selectedLsgs, setSelectedLsgs] = useState<any[]>([]);
  const dispatch: any = useDispatch();
  const state: any = useSelector((state) => state);
  const { currentUser } = state;
  const [filterState, setFilterState] = useMergeState({
    created_date_before: filter.created_date_before || null,
    created_date_after: filter.created_date_after || null,
    result_date_before: filter.result_date_before || null,
    result_date_after: filter.result_date_after || null,
    sample_collection_date_before: filter.sample_collection_date_before || null,
    sample_collection_date_after: filter.sample_collection_date_after || null,
    srf_id: filter.srf_id || null,
  });
  const { t } = useTranslation();

  const handleDateRangeChange = (
    startDateId: string,
    endDateId: string,
    { startDate, endDate }: any
  ) => {
    const filterData: any = { ...filterState };
    filterData[startDateId] = startDate?.toString();
    filterData[endDateId] = endDate?.toString();

    setFilterState(filterData);
  };

  const handleWardChange = (value: any) => {
    setWards(value);
  };
  const handleLsgChange = (value: any) => {
    setSelectedLsgs(value);
  };

  const formatDateTime = (dateTime: any) => {
    return dateTime && moment(dateTime).isValid()
      ? moment(dateTime).format("YYYY-MM-DD")
      : "";
  };

  const applyFilter = () => {
    const selectedWardIds = wards.map(function (obj) {
      return obj.id;
    });

    const selectedLsgIds = selectedLsgs.map(function (obj) {
      return obj.id;
    });

    const {
      created_date_before,
      created_date_after,
      result_date_before,
      result_date_after,
      sample_collection_date_after,
      sample_collection_date_before,
      srf_id,
    } = filterState;

    const data = {
      wards: selectedWardIds.length ? selectedWardIds : "",
      local_bodies: selectedLsgIds.length ? selectedLsgIds : "",
      created_date_before: formatDateTime(created_date_before),
      created_date_after: formatDateTime(created_date_after),
      result_date_before: formatDateTime(result_date_before),
      result_date_after: formatDateTime(result_date_after),
      sample_collection_date_after: formatDateTime(
        sample_collection_date_after
      ),
      sample_collection_date_before: formatDateTime(
        sample_collection_date_before
      ),
      srf_id: srf_id,
    };
    onChange(data);
    dataList(selectedLsgs, wards);
  };

  const sortByName = (items: any) => {
    items.sort(function (a: any, b: any) {
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    });
  };

  useEffect(() => {
    async function getWardList() {
      const id: number = currentUser.data.district;
      const res = await dispatch(getAllLocalBodyByDistrict({ id }));
      let allWards: any[] = [];
      let allLsgs: any[] = [];
      res?.data?.forEach((local: any) => {
        allLsgs = [...allLsgs, { id: local.id, name: local.name }];
        if (local.wards) {
          local.wards.forEach((ward: any) => {
            allWards = [
              ...allWards,
              {
                id: ward.id,
                name: ward.number + ": " + ward.name,
                panchayath: local.name,
                number: ward.number,
                local_body_id: local.id,
              },
            ];
          });
        }
      });
      sortByName(allWards);
      sortByName(allLsgs);
      setWardList(allWards || []);
      setLsgList(allLsgs || []);
      const filteredWard = filter?.wards?.split(",").map(Number);
      const selectedWards: any =
        filteredWard && allWards
          ? allWards.filter(({ id }: { id: number }) => {
              return filteredWard.includes(id);
            })
          : [];
      setWards(selectedWards);

      const filteredLsgs = filter?.local_bodies?.split(",").map(Number);
      const selectedLsgs: any =
        filteredLsgs && allLsgs
          ? allLsgs.filter(({ id }: { id: number }) => {
              return filteredLsgs.includes(id);
            })
          : [];
      setSelectedLsgs(selectedLsgs);
      setLoading(false);
    }
    getWardList();
  }, []);

  const filterWards = () => {
    const selectedLsgIds: any = selectedLsgs.map((e) => {
      return e.id;
    });

    const selectedwards: any =
      selectedLsgIds.length === 0
        ? wardList
        : wardList.filter(({ local_body_id }: { local_body_id: number }) => {
            return selectedLsgIds.includes(local_body_id);
          });

    return selectedwards;
  };

  const handleChange = (event: any) => {
    const { name, value } = event.target;

    const filterData: any = { ...filterState };
    filterData[name] = value;

    setFilterState(filterData);
  };

  return (
    <FiltersSlideover
      advancedFilter={props}
      onApply={applyFilter}
      onClear={() => {
        navigate("/external_results");
        setFilterState(clearFilterState);
        closeFilter();
      }}
    >
      <div>
        <FieldLabel>{t("lsg")}</FieldLabel>
        <LegacyAutoCompleteAsyncField
          className="-my-3"
          multiple
          name="local_bodies"
          options={lsgList}
          label={t("Local Bod")}
          variant="outlined"
          placeholder={t("select_local_body")}
          loading={loading}
          freeSolo={false}
          value={selectedLsgs}
          renderOption={(option: any) => <div>{option.name}</div>}
          getOptionSelected={(option: any, value: any) =>
            option.id === value.id
          }
          getOptionLabel={(option: any) => option.name}
          onChange={(e: object, value: any) => handleLsgChange(value)}
        />
      </div>

      <div>
        <FieldLabel>{t("Ward")}</FieldLabel>
        <LegacyAutoCompleteAsyncField
          className="-my-3"
          multiple={true}
          name="wards"
          options={filterWards()}
          label={t("Ward")}
          variant="outlined"
          placeholder={t("select_wards")}
          loading={loading}
          freeSolo={false}
          value={wards}
          renderOption={(option: any) => <div>{option.name}</div>}
          getOptionSelected={(option: any, value: any) =>
            option.id === value.id
          }
          getOptionLabel={(option: any) => option.name}
          onChange={(e: object, value: any) => handleWardChange(value)}
        />
      </div>

      <DateRangePicker
        startDate={getDate(filterState.created_date_after)}
        endDate={getDate(filterState.created_date_before)}
        onChange={(e) =>
          handleDateRangeChange("created_date_after", "created_date_before", e)
        }
        endDateId={"created_date_before"}
        startDateId={"created_date_after"}
        label={t("created_date")}
        size="small"
      />

      <DateRangePicker
        startDate={getDate(filterState.result_date_after)}
        endDate={getDate(filterState.result_date_before)}
        onChange={(e) =>
          handleDateRangeChange("result_date_after", "result_date_before", e)
        }
        endDateId={"result_date_before"}
        startDateId={"result_date_after"}
        label={t("result_date")}
        size="small"
      />

      <DateRangePicker
        startDate={getDate(filterState.sample_collection_date_after)}
        endDate={getDate(filterState.sample_collection_date_before)}
        onChange={(e) =>
          handleDateRangeChange(
            "sample_collection_date_after",
            "sample_collection_date_before",
            e
          )
        }
        endDateId={"sample_collection_date_before"}
        startDateId={"sample_collection_date_after"}
        label={t("sample_collection_date")}
        size="small"
      />

      <div className="w-full flex-none">
        <FieldLabel>{t("srf_id")}</FieldLabel>
        <LegacyTextInputField
          id="srf_id"
          name="srf_id"
          variant="outlined"
          margin="dense"
          errors=""
          value={filterState.srf_id}
          onChange={handleChange}
          label={t("srf_id")}
          className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9 mr-1"
        />
      </div>
    </FiltersSlideover>
  );
}
