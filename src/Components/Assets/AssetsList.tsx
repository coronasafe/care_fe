import { useDispatch, useSelector } from "react-redux";
import QrReader from "react-qr-reader";
import { statusType, useAbortableEffect } from "../../Common/utils";
import * as Notification from "../../Utils/Notifications.js";
import PageTitle from "../Common/PageTitle";
import {
  getAnyFacility,
  listAssets,
  getFacilityAssetLocation,
} from "../../Redux/actions";
import { assetClassProps, AssetData } from "./AssetTypes";
import { getAsset } from "../../Redux/actions";
import { useState, useCallback, useEffect } from "react";
import { navigate } from "raviger";
import loadable from "@loadable/component";
import CircularProgress from "@material-ui/core/CircularProgress";
import AssetFilter from "./AssetFilter";
import { parseQueryParams } from "../../Utils/primitives";
import Chip from "../../CAREUI/display/Chip";
import SearchInput from "../Form/SearchInput";
import useFilters from "../../Common/hooks/useFilters";
import ButtonV2 from "../Common/components/ButtonV2";
import AssetImportModal from "./AssetImportModal";
import { FacilityModel } from "../Facility/models";
import { USER_TYPES } from "../../Common/constants";

const Loading = loadable(() => import("../Common/Loading"));

const AssetsList = () => {
  const {
    qParams,
    updateQuery,
    Pagination,
    FilterBadges,
    AdvancedFilters,
    resultsPerPage,
  } = useFilters({
    limit: 21,
  });
  const [assets, setAssets] = useState([{} as AssetData]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [facility, setFacility] = useState<FacilityModel>();
  const [asset_type, setAssetType] = useState<string>();
  const [locationName, setLocationName] = useState<string>();
  const [importAssetModalOpen, setImportAssetModalOpen] = useState(false);
  const dispatch: any = useDispatch();
  const assetsExist = assets.length > 0 && Object.keys(assets[0]).length > 0;
  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const params = {
        limit: resultsPerPage,
        page: qParams.page,
        offset: (qParams.page ? qParams.page - 1 : 0) * resultsPerPage,
        search_text: qParams.search || "",
        facility: qParams.facility,
        asset_type: qParams.asset_type,
        location: qParams.location,
        status: qParams.status,
      };
      const { data }: any = await dispatch(listAssets(params));
      if (!status.aborted) {
        setIsLoading(false);
        if (!data)
          Notification.Error({
            msg: "Something went wrong..!",
          });
        else {
          setAssets(data.results);
          setTotalCount(data.count);
        }
      }
    },
    [
      dispatch,
      qParams.page,
      qParams.search,
      qParams.facility,
      qParams.asset_type,
      qParams.location,
      qParams.status,
    ]
  );

  useEffect(() => {
    setAssetType(qParams.asset_type);
  }, [qParams.asset_type]);

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [dispatch, fetchData]
  );

  const fetchFacility = useCallback(
    async (status: statusType) => {
      if (!qParams.facility) return setFacility(undefined);
      setIsLoading(true);
      const res = await dispatch(getAnyFacility(qParams.facility));
      if (!status.aborted) {
        setFacility(res?.data);
        setIsLoading(false);
      }
    },
    [dispatch, qParams.facility]
  );
  const fetchLocationName = useCallback(
    async (status: statusType) => {
      if (!qParams.location) return setLocationName("");
      setIsLoading(true);
      const res = await dispatch(
        getFacilityAssetLocation(qParams.facility, qParams.location)
      );
      if (!status.aborted) {
        setLocationName(res?.data?.name);
        setIsLoading(false);
      }
    },
    [dispatch, qParams.facility, qParams.location]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchFacility(status);
      fetchLocationName(status);
    },
    [fetchFacility, fetchLocationName]
  );

  const getAssetIdFromQR = async (assetUrl: string) => {
    try {
      setIsLoading(true);
      setIsScannerActive(false);
      const params = parseQueryParams(assetUrl);
      // QR Maybe searchParams "asset" or "assetQR"
      const assetId = params.asset || params.assetQR;
      if (assetId) {
        const { data }: any = await dispatch(
          listAssets({ qr_code_id: assetId })
        );
        return data.results[0].id;
      }
    } catch (err) {
      console.log(err);
    }
  };

  const state: any = useSelector((state) => state);
  const { currentUser } = state;

  const DISTRICT_ADMIN_LEVEL = USER_TYPES.indexOf("DistrictAdmin");

  const showAssetImportExport =
    USER_TYPES.findIndex((type) => type == currentUser.data.user_type) >=
    DISTRICT_ADMIN_LEVEL;

  const checkValidAssetId = async (assetId: any) => {
    const assetData: any = await dispatch(getAsset(assetId));
    try {
      if (assetData.data) {
        navigate(`/assets/${assetId}`);
      }
    } catch (err) {
      console.log(err);
      setIsLoading(false);
      Notification.Error({
        msg: "Invalid QR code scanned !!!",
      });
    }
  };

  const downloadJSON = (data: JSON) => {
    const a = document.createElement("a");
    const blob = new Blob([JSON.stringify(data)], {
      type: "application/json",
    });
    a.href = URL.createObjectURL(blob);
    a.download = `assets_${facility?.name}_${new Date().toISOString()}.json`;
    a.click();
  };

  const handleDownload = async () => {
    if (totalCount == 0) {
      Notification.Error({
        msg: "No assets to export",
      });
    }
    const filters = {
      ...qParams,
      json: true,
      limit: totalCount,
    };
    const res = await dispatch(listAssets(filters));
    if (res && res.data && res.status === 200) {
      downloadJSON(res.data.results);
    }
  };

  if (isScannerActive)
    return (
      <div className="md:w-1/2 w-full my-2 mx-auto flex flex-col justify-start items-end">
        <button
          onClick={() => setIsScannerActive(false)}
          className="btn btn-default mb-2"
        >
          <i className="fas fa-times mr-2"></i> Close Scanner
        </button>
        <QrReader
          delay={300}
          onScan={async (value: any) => {
            if (value) {
              const assetId = await getAssetIdFromQR(value);
              checkValidAssetId(assetId ?? value);
            }
          }}
          onError={(e: any) =>
            Notification.Error({
              msg: e.message,
            })
          }
          style={{ width: "100%" }}
        />
        <h2 className="text-center text-lg self-center">Scan Asset QR!</h2>
      </div>
    );

  let manageAssets = null;
  if (assetsExist) {
    manageAssets = (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 md:-mx-8 gap-2">
        {assets.map((asset: AssetData) => (
          <div
            key={asset.id}
            className="w-full bg-white rounded-lg cursor-pointer border-1 shadow p-5 justify-center items-center border border-transparent hover:border-primary-500"
            onClick={() => navigate(`/assets/${asset.id}`)}
          >
            <div className="md:flex">
              <p className="text-xl flex font-medium capitalize break-words">
                <span className="mr-2 text-primary-500">
                  {" "}
                  <i
                    className={`fas fa-${
                      (
                        (asset.asset_class &&
                          assetClassProps[asset.asset_class]) ||
                        assetClassProps.NONE
                      ).icon
                    }`}
                  />
                </span>
                <p className="truncate w-48">{asset.name}</p>
              </p>
            </div>
            <p className="font-normal text-sm">
              {asset?.location_object?.name}
            </p>

            <div className="flex flex-wrap gap-2 mt-2">
              {asset.is_working ? (
                <Chip color="green" startIcon="cog" text="Working" />
              ) : (
                <Chip color="red" startIcon="cog" text="Not Working" />
              )}
              <Chip
                color="blue"
                startIcon="location-arrow"
                text={asset.status}
              />
            </div>
          </div>
        ))}
      </div>
    );
  } else {
    manageAssets = (
      <div className="w-full bg-white rounded-lg p-2 text-center col-span-3 py-8 pt-4">
        <p className="text-2xl font-bold text-gray-600">No Assets Found</p>
      </div>
    );
  }

  return (
    <div className="px-6">
      <PageTitle title="Assets" hideBack={true} breadcrumbs={false} />
      <div className="lg:flex mt-5 space-y-2">
        <div className="bg-white overflow-hidden shadow rounded-lg flex-1 md:mr-2">
          <div className="px-4 py-5 sm:p-6">
            <dl>
              <dt className="text-sm leading-5 font-medium text-gray-500 truncate">
                Total Assets
              </dt>
              {/* Show spinner until count is fetched from server */}
              {isLoading ? (
                <dd className="mt-4 text-5xl leading-9">
                  <CircularProgress className="text-primary-500" />
                </dd>
              ) : (
                <dd className="mt-4 text-5xl leading-9 font-semibold text-gray-900">
                  {totalCount}
                </dd>
              )}
            </dl>
          </div>
        </div>
        <div className="flex-1">
          <SearchInput
            name="search"
            value={qParams.search}
            onChange={(e) => updateQuery({ [e.name]: e.value })}
            placeholder="Search assets"
          />
        </div>
        <div className="flex flex-col md:flex-row lg:ml-2 justify-start items-start gap-2">
          <div className="w-full">
            <AdvancedFilters.Button />
          </div>
          {showAssetImportExport && (
            <div className="w-full tooltip flex flex-col md:flex-row gap-2">
              {!facility ? (
                <span className="tooltip-text tooltip-left">
                  <p className="self-end text-sm italic ">
                    * Select a facility
                  </p>
                </span>
              ) : (
                ""
              )}
              <ButtonV2
                className="w-1/2"
                disabled={!facility}
                onClick={() => {
                  setImportAssetModalOpen(true);
                }}
              >
                <span>
                  <i className="fa-solid fa-arrow-up-long mr-2"></i>
                  Import Assets
                </span>
              </ButtonV2>
              <ButtonV2
                className="w-1/2"
                disabled={!facility}
                onClick={handleDownload}
              >
                <span>
                  <i className="fa-solid fa-arrow-down-long mr-2"></i>
                  Export Assets
                </span>
              </ButtonV2>
            </div>
          )}
        </div>
      </div>
      <AssetFilter {...AdvancedFilters.props} />
      {isLoading ? (
        <Loading />
      ) : (
        <>
          <FilterBadges
            badges={({ badge, value }) => [
              value("Facility", ["facility", "location"], facility?.name || ""),
              badge("Name", "search"),
              value("Asset Type", "asset_type", asset_type || ""),
              badge("Status", "status"),
              value("Location", "location", locationName || ""),
            ]}
          />
          <div className="grow">
            <div className="py-8 md:px-5">
              {manageAssets}
              <Pagination totalCount={totalCount} />
            </div>
          </div>
        </>
      )}
      {facility && (
        <AssetImportModal
          open={importAssetModalOpen}
          onClose={() => setImportAssetModalOpen(false)}
          facility={facility}
        />
      )}
    </div>
  );
};

export default AssetsList;
