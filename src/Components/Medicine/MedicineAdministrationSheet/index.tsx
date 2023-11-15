import { useTranslation } from "react-i18next";
import useSlug from "../../../Common/hooks/useSlug";
import useQuery from "../../../Utils/request/useQuery";
import MedicineRoutes from "../routes";
import { useMemo, useState } from "react";
import { computeActivityBounds } from "./utils";
import useBreakpoints from "../../../Common/hooks/useBreakpoints";
import SubHeading from "../../../CAREUI/display/SubHeading";
import ButtonV2 from "../../Common/components/ButtonV2";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import BulkAdminister from "./BulkAdminister";
import useRangePagination from "../../../Common/hooks/useRangePagination";
import MedicineAdministrationTable from "./AdministrationTable";
import Loading from "../../Common/Loading";
import ScrollOverlay from "../../../CAREUI/interactive/ScrollOverlay";

interface Props {
  readonly?: boolean;
  is_prn: boolean;
}

const DEFAULT_BOUNDS = { start: new Date(), end: new Date() };

const MedicineAdministrationSheet = ({ readonly, is_prn }: Props) => {
  const { t } = useTranslation();
  const consultation = useSlug("consultation");

  const [showDiscontinued, setShowDiscontinued] = useState(false);

  const filters = { is_prn, prescription_type: "REGULAR", limit: 100 };

  const { data, loading, refetch } = useQuery(
    MedicineRoutes.listPrescriptions,
    {
      pathParams: { consultation },
      query: { ...filters, discontinued: showDiscontinued ? undefined : false },
    }
  );

  const discontinuedPrescriptions = useQuery(MedicineRoutes.listPrescriptions, {
    pathParams: { consultation },
    query: {
      ...filters,
      limit: showDiscontinued ? 100 : 1,
      discontinued: true,
    },
    prefetch: !showDiscontinued,
  });

  const discontinuedCount = discontinuedPrescriptions.data?.count;

  const { activityTimelineBounds, prescriptions } = useMemo(
    () => ({
      prescriptions: data?.results?.sort(
        (a, b) => +a.discontinued - +b.discontinued
      ),
      activityTimelineBounds: data
        ? computeActivityBounds(data.results)
        : undefined,
    }),
    [data]
  );

  const daysPerPage = useBreakpoints({ default: 1, "2xl": 2 });
  const pagination = useRangePagination({
    bounds: activityTimelineBounds ?? DEFAULT_BOUNDS,
    perPage: daysPerPage * 24 * 60 * 60 * 1000,
    slots: (daysPerPage * 24) / 4, // Grouped by 4 hours
    defaultEnd: true,
  });

  return (
    <div>
      <SubHeading
        title={is_prn ? "PRN Prescriptions" : "Prescriptions"}
        lastModified={
          prescriptions?.[0]?.last_administered_on ??
          prescriptions?.[0]?.modified_date
        }
        options={
          !readonly &&
          !!data?.results && (
            <>
              <ButtonV2
                variant="secondary"
                border
                href="prescriptions"
                className="w-full"
              >
                <CareIcon icon="l-pen" className="text-lg" />
                <span className="hidden lg:block">
                  {t("edit_prescriptions")}
                </span>
                <span className="block lg:hidden">{t("edit")}</span>
              </ButtonV2>
              <BulkAdminister
                prescriptions={data.results}
                onDone={() => refetch()}
              />
            </>
          )
        }
      />
      <div className="rounded-lg border shadow">
        <ScrollOverlay
          overlay={
            <div className="flex items-center gap-2 pb-2">
              <span className="text-sm">Scroll to view more prescriptions</span>
              <CareIcon
                icon="l-arrow-down"
                className="animate-bounce text-2xl"
              />
            </div>
          }
          disableOverlay={
            loading || !prescriptions?.length || !(prescriptions?.length > 1)
          }
        >
          {loading ? (
            <Loading />
          ) : (
            <>
              {prescriptions?.length === 0 && <NoPrescriptions prn={is_prn} />}
              {!!prescriptions?.length && (
                <MedicineAdministrationTable
                  prescriptions={prescriptions}
                  pagination={pagination}
                  onRefetch={() => {
                    refetch();
                    discontinuedPrescriptions.refetch();
                  }}
                />
              )}
            </>
          )}
        </ScrollOverlay>
        {!!discontinuedCount && (
          <ButtonV2
            variant="secondary"
            className="group sticky left-0 w-full rounded-b-lg rounded-t-none bg-gray-100"
            onClick={() => !loading && setShowDiscontinued(!showDiscontinued)}
          >
            {loading ? (
              <span className="flex w-full items-center justify-start gap-1 text-xs transition-all duration-200 ease-in-out group-hover:gap-3 md:text-sm">
                <CareIcon icon="l-spinner-alt" className="text-lg" />
                <span>Loading...</span>
              </span>
            ) : (
              <span className="flex w-full items-center justify-start gap-1 text-xs transition-all duration-200 ease-in-out group-hover:gap-3 md:text-sm">
                <CareIcon
                  icon={showDiscontinued ? "l-eye-slash" : "l-eye"}
                  className="text-lg"
                />
                <span>
                  {showDiscontinued ? "Hide" : "Show"}{" "}
                  <strong>{discontinuedCount}</strong> discontinued
                  prescription(s)
                </span>
              </span>
            )}
          </ButtonV2>
        )}
      </div>
    </div>
  );
};

export default MedicineAdministrationSheet;

const NoPrescriptions = ({ prn }: { prn: boolean }) => {
  return (
    <div className="my-16 flex w-full flex-col items-center justify-center gap-4 text-gray-500">
      <CareIcon icon="l-tablets" className="text-5xl" />
      <h3 className="text-lg font-medium">
        {prn
          ? "No PRN Prescriptions Prescribed"
          : "No Prescriptions Prescribed"}
      </h3>
    </div>
  );
};
