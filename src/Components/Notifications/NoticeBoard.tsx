import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { getNotifications } from "../../Redux/actions";
import Page from "../Common/components/Page";
import Loading from "../Common/Loading";
import { formatDateTime } from "../../Utils/utils";
import { useTranslation } from "react-i18next";
import CareIcon from "../../CAREUI/icons/CareIcon";

export const NoticeBoard = () => {
  const dispatch: any = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    setIsLoading(true);
    dispatch(
      getNotifications(
        { offset: 0, event: "MESSAGE", medium_sent: "SYSTEM" },
        new Date().getTime().toString()
      )
    )
      .then((res: any) => {
        if (res && res.data) {
          setData(res.data.results);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [dispatch]);

  let notices;

  if (data?.length) {
    notices = (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {data.map((item) => (
          <div
            key={`usr_${item.id}`}
            className="overflow-hidden rounded shadow-md"
          >
            <div className="px-6 py-4">
              <div className="text-justify text-lg">{item.message}</div>
              <div className="text-md my-2 text-gray-700">
                {`${item.caused_by.first_name} ${item.caused_by.last_name}`} -{" "}
                <span className="font-bold text-primary-700">
                  {item.caused_by.user_type}
                </span>
              </div>
              <div className="text-xs text-gray-900">
                {t("on")}: {formatDateTime(item.created_date)}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  } else {
    notices = (
      <div className=" m-auto flex max-w-xs items-center ">
        <div className="my-36">
          <CareIcon className=" care-l-bell-slash h-auto text-gray-500" />
          <div className=" m-auto mt-6 text-2xl text-gray-500">
            No Notice Available
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) return <Loading />;
  return (
    <Page title={t("Notice Board")} hideBack={true} breadcrumbs={false}>
      <div>{notices}</div>
    </Page>
  );
};

// import { formatDateTime } from "../../Utils/utils";
// import { useTranslation } from "react-i18next";
// import CareIcon from "../../CAREUI/icons/CareIcon";
// import useQuery from "../../Utils/request/useQuery";  // Import useQuery
// import routes from "../../Redux/api";
// import Loading from "../Common/Loading";  // Import routes
//
// export const NoticeBoard = () => {
//   const { t } = useTranslation();
//
//   const queryOptions = {
//     offset: 0,
//     medium_sent: "SYSTEM",
//     event: "MESSAGE",
//     timestamp: new Date().getTime().toString(),
//   };
//
//   const { data: notifications, loading } = useQuery(routes.getNotifications, queryOptions);  // Use useQuery here
//
//   if (loading) return <Loading />;
//
//   if (!notifications || !notifications.data) {
//     return (
//         <Page title={t("Notice Board")} hideBack={true} breadcrumbs={false}>
//           <div className=" m-auto flex max-w-xs items-center">
//             <div className="my-36">
//               <CareIcon className="care-l-bell-slash h-auto text-gray-500" />
//               <div className="m-auto mt-6 text-2xl text-gray-500">No Notice Available</div>
//             </div>
//           </div>
//         </Page>
//     );
//   }
//
//   const notices = notifications.data.results.map((item) => (
//       <div key={`usr_${item.id}`} className="overflow-hidden rounded shadow-md">
//         <div className="px-6 py-4">
//           <div className="text-justify text-lg">{item.message}</div>
//           <div className="text-md my-2 text-gray-700">
//             {`${item.caused_by.first_name} ${item.caused_by.last_name}`} -{" "}
//             <span className="font-bold text-primary-700">
//             {item.caused_by.user_type}
//           </span>
//           </div>
//           <div className="text-xs text-gray-900">
//             {t("on")}: {formatDateTime(item.created_date)}
//           </div>
//         </div>
//       </div>
//   ));
//
//   return (
//       <Page title={t("Notice Board")} hideBack={true} breadcrumbs={false}>
//         <div>{notices}</div>
//       </Page>
//   );
// };
