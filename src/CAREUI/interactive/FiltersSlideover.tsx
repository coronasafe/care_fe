import { useTranslation } from "react-i18next";
import useFilters from "../../Common/hooks/useFilters";
import ButtonV2 from "../../Components/Common/components/ButtonV2";
import CareIcon from "../icons/CareIcon";
import SlideOver from "./SlideOver";
import { ReactNode } from "react";

type AdvancedFilter = ReturnType<typeof useFilters>["advancedFilter"];

interface Props {
  children: ReactNode | ReactNode[];
  advancedFilter: AdvancedFilter;
  onClear?: () => void;
  onApply?: () => void;
}

export default function FiltersSlideover({
  children,
  advancedFilter,
  onClear,
  onApply,
}: Props) {
  const { t } = useTranslation();
  return (
    <SlideOver
      {...advancedFilter}
      open={advancedFilter.show}
      setOpen={advancedFilter.setShow}
      title={
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">{t("advanced_filters")}</span>
          <div className="mr-2 flex items-center justify-end gap-1">
            <ButtonV2
              variant="danger"
              ghost
              onClick={onClear}
              id="clear-filter"
            >
              <CareIcon className="care-l-filter-slash text-lg" />
              <span>{t("clear")}</span>
            </ButtonV2>
            <ButtonV2 ghost onClick={onApply} id="apply-filter">
              {t("apply")}
            </ButtonV2>
          </div>
        </div>
      }
      dialogClass="w-full max-w-[28rem]"
    >
      <div className="flex flex-col gap-6 p-2">{children}</div>
    </SlideOver>
  );
}

export const AdvancedFilterButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <ButtonV2
      ghost
      border
      className=" bg-white px-4 py-3"
      onClick={onClick}
      id="advanced-filter"
    >
      <CareIcon className="care-l-filter" />
    </ButtonV2>
  );
};
