import CareIcon from "../icons/CareIcon";

export interface FilterBadgeProps {
  name: string;
  value: string;
  onRemove: () => void;
}

/**
 * **Note: If this component is intended to be used with query params, use the
 * wrapped `FilterBadge` from `useFilters` hook instead.**
 */
const FilterBadge = ({ name, value, onRemove }: FilterBadgeProps) => {
  return (
    <span
      data-testid={name}
      className={`${
        !value && "hidden"
      } flex flex-row items-center rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium leading-4 text-gray-600`}
    >
      {`${name}: ${value}`}
      <CareIcon
        id="removeicon"
        icon="l-times"
        className="ml-2 box-content cursor-pointer rounded-full px-1 py-0.5 hover:bg-gray-500"
        onClick={onRemove}
      />
    </span>
  );
};

export default FilterBadge;
