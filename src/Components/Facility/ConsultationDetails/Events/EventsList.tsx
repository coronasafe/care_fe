import { useTranslation } from "react-i18next";
import { useSlugs } from "../../../../Common/hooks/useSlug";
import PaginatedList from "../../../../CAREUI/misc/PaginatedList";
import routes from "../../../../Redux/api";
import { TimelineNode } from "../../../../CAREUI/display/Timeline";
import LoadingLogUpdateCard from "../../Consultations/DailyRounds/LoadingCard";
import GenericEvent from "./GenericEvent";
import { EventGeneric } from "./types";
import { getEventIcon } from "./iconMap";

export default function EventsList() {
  const [consultationId] = useSlugs("consultation");
  const { t } = useTranslation();

  return (
    <PaginatedList route={routes.getEvents} pathParams={{ consultationId }}>
      {() => (
        <>
          <div className="mt-4 flex w-full flex-col gap-4">
            <div className="flex max-h-[85vh] flex-col gap-4 overflow-y-auto overflow-x-hidden px-3">
              <PaginatedList.WhenEmpty className="flex w-full justify-center border-b border-gray-200 bg-white p-5 text-center text-2xl font-bold text-gray-500">
                <span className="flex justify-center rounded-lg bg-white p-3 text-gray-700  ">
                  {t("no_consultation_updates")}
                </span>
              </PaginatedList.WhenEmpty>
              <PaginatedList.WhenLoading>
                <LoadingLogUpdateCard />
              </PaginatedList.WhenLoading>
              <PaginatedList.Items<EventGeneric> className="flex grow flex-col gap-3">
                {(item, items) => (
                  <TimelineNode
                    name={
                      item.event_type.name
                        .split("_")
                        .map(
                          (text) =>
                            text[0].toUpperCase() + text.toLowerCase().slice(1)
                        )
                        .join(" ") + " Event"
                    }
                    event={{
                      type: item.change_type.replace(/_/g, " ").toLowerCase(),
                      timestamp: item.created_date?.toString() ?? "",
                      by: item.caused_by,
                      icon: getEventIcon(item.event_type.name),
                    }}
                    isLast={items.indexOf(item) == items.length - 1}
                  >
                    {(() => {
                      switch (item.event_type.name) {
                        case "INTERNAL_TRANSFER":
                        case "CLINICAL":
                        case "DIAGNOSIS":
                        case "ENCOUNTER_SUMMARY":
                        case "HEALTH":
                        default:
                          return <GenericEvent event={item} />;
                      }
                    })()}
                  </TimelineNode>
                )}
              </PaginatedList.Items>
              <div className="flex w-full items-center justify-center">
                <PaginatedList.Paginator hideIfSinglePage />
              </div>
            </div>
          </div>
        </>
      )}
    </PaginatedList>
  );
}
