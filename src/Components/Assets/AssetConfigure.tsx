import React, { useCallback } from "react";
import Loading from "../Common/Loading";
import PageTitle from "../Common/PageTitle";
import { AssetData } from "./AssetTypes";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { useDispatch } from "react-redux";
import { getAsset } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import HL7Monitor from "./AssetType/HL7Monitor";
import ONVIFCamera from "./AssetType/ONVIFCamera";

interface AssetConfigureProps {
  assetId: string;
}

const AssetConfigure = (props: AssetConfigureProps) => {
  const { assetId } = props;
  const [asset, setAsset] = React.useState<AssetData>();
  const [isLoading, setIsLoading] = React.useState(true);
  const [assetType, setAssetType] = React.useState("");
  const dispatch = useDispatch();

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const [assetData]: any = await Promise.all([dispatch(getAsset(assetId))]);
      if (!status.aborted) {
        setIsLoading(false);
        if (!assetData.data)
          Notification.Error({
            msg: "Something went wrong..!",
          });
        else {
          setAsset(assetData.data);
          setAssetType(assetData.data.asset_class);
        }
      }
    },
    [dispatch, assetId]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [dispatch, fetchData]
  );

  if (isLoading) return <Loading />;
  return (
    <div>
      {assetType === "HL7MONITOR" ? (
        <>
          <PageTitle
            title={`Configure HL7Monitor: ${asset?.name}`}
            crumbsReplacements={{ [assetId]: { name: asset?.name } }}
          />
          <HL7Monitor asset={asset} assetId={assetId} />
        </>
      ) : (
        <>
          <PageTitle
            title={`Configure ONVIFCamera: ${asset?.name}`}
            crumbsReplacements={{ [assetId]: { name: asset?.name } }}
          />
          <ONVIFCamera asset={asset} assetId={assetId} />
        </>
      )}
    </div>
  );
};

export default AssetConfigure;
