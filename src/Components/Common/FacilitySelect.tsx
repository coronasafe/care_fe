import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { getAllFacilities, getPermittedFacilities } from "../../Redux/actions";
import AutoCompleteAsync from "../Form/AutoCompleteAsync";
import { FacilityModel } from "../Facility/models";

interface FacilitySelectProps {
  name: string;
  exclude_user?: string;
  errors?: string | undefined;
  className?: string;
  searchAll?: boolean;
  multiple?: boolean;
  facilityType?: number;
  district?: string;
  showAll?: boolean;
  showNOptions?: number;
  freeText?: boolean;
  selected: FacilityModel | FacilityModel[] | null;
  setSelected: (selected: FacilityModel | FacilityModel[] | null) => void;
}

export const FacilitySelect = (props: FacilitySelectProps) => {
  const {
    name,
    exclude_user,
    multiple,
    selected,
    setSelected,
    searchAll,
    showAll = true,
    showNOptions = 10,
    className = "",
    facilityType,
    district,
    freeText = false,
    errors = "",
  } = props;

  const dispatchAction: any = useDispatch();

  const facilitySearch = useCallback(
    async (text: string) => {
      const params = {
        limit: 50,
        offset: 0,
        search_text: text,
        all: searchAll,
        facility_type: facilityType,
        exclude_user: exclude_user,
        district,
      };

      const res = await dispatchAction(
        showAll ? getAllFacilities(params) : getPermittedFacilities(params)
      );
      if (freeText)
        res?.data?.results?.push({
          id: -1,
          name: text,
        });
      return res?.data?.results;
    },
    [dispatchAction, searchAll, showAll, facilityType, district]
  );

  return (
    <AutoCompleteAsync
      name={name}
      multiple={multiple}
      selected={selected}
      onChange={setSelected}
      fetchData={facilitySearch}
      showNOptions={showNOptions}
      optionLabel={(option: any) =>
        option.name +
        (option.district_object ? `, ${option.district_object.name}` : "")
      }
      compareBy="id"
      className={className}
      error={errors}
    />
  );
};
