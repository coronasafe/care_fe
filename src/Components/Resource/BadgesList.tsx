import React, { useState, useEffect } from "react";
import { getFacilityV2 } from "../../Redux/actions";
import { useDispatch } from "react-redux";

export default function BadgesList(props: any) {
  const { appliedFilters, updateFilter } = props;

  const [orginFacilityName, setOrginFacilityName] = useState("");
  const [approvingFacilityName, setApprovingFacilityName] = useState("");
  const [assignedFacilityName, setAssignedFacilityName] = useState("");
  const dispatch: any = useDispatch();

  useEffect(() => {
    async function fetchData() {
      if (appliedFilters.orgin_facility) {
        const res = await dispatch(
          getFacilityV2(appliedFilters.orgin_facility, "orgin_facility")
        );

        setOrginFacilityName(res?.data?.name);
      } else {
        setOrginFacilityName("");
      }
    }
    fetchData();
  }, [dispatch, appliedFilters.orgin_facility]);

  useEffect(() => {
    async function fetchData() {
      if (appliedFilters.approving_facility) {
        const res = await dispatch(
          getFacilityV2(appliedFilters.approving_facility, "approving_facility")
        );

        setApprovingFacilityName(res?.data?.name);
      } else {
        setApprovingFacilityName("");
      }
    }
    fetchData();
  }, [dispatch, appliedFilters.approving_facility]);

  useEffect(() => {
    async function fetchData() {
      if (appliedFilters.assigned_facility) {
        const res = await dispatch(
          getFacilityV2(appliedFilters.assigned_facility, "assigned_facility")
        );

        setAssignedFacilityName(res?.data?.name);
      } else {
        setAssignedFacilityName("");
      }
    }
    fetchData();
  }, [dispatch, appliedFilters.assigned_facility]);

  const removeFilter = (paramKey: any) => {
    const params = { ...appliedFilters };
    params[paramKey] = "";
    updateFilter(params);
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

  return (
    <div className="flex flex-wrap mt-4 ml-2">
      {badge("Ordering", appliedFilters.ordering, "ordering")}
      {badge(
        "status",
        appliedFilters.status != "--" && appliedFilters.status,
        "status"
      )}
      {badge(
        "Emergency",
        appliedFilters.emergency === "true"
          ? "yes"
          : appliedFilters.emergency === "false"
          ? "no"
          : undefined,
        "emergency"
      )}
      {badge(
        "Modified After",
        appliedFilters.modified_date_after,
        "modified_date_after"
      )}
      {badge(
        "Modified Before",
        appliedFilters.modified_date_before,
        "modified_date_before"
      )}
      {badge(
        "Created Before",
        appliedFilters.created_date_before,
        "created_date_before"
      )}
      {badge(
        "Created After",
        appliedFilters.created_date_after,
        "created_date_after"
      )}
      {badge("Origin Facility", orginFacilityName, "orgin_facility")}
      {badge("Approving Facility", approvingFacilityName, "approving_facility")}
      {badge("Assigned Facility", assignedFacilityName, "assigned_facility")}
    </div>
  );
}
