import { useEffect, useState } from "react";
import { AssetData } from "../AssetTypes";
import { useDispatch } from "react-redux";
import {
  partialUpdateAsset,
  createAssetBed,
  getPermittedFacility,
} from "../../../Redux/actions";
import * as Notification from "../../../Utils/Notifications.js";
import { BedModel } from "../../Facility/models";
import axios from "axios";
import { getCameraConfig } from "../../../Utils/transformUtils";
import CameraConfigure from "../configure/CameraConfigure";
import Loading from "../../Common/Loading";
import { checkIfValidIP } from "../../../Common/validation";
import TextFormField from "../../Form/FormFields/TextFormField";
import { Submit } from "../../Common/components/ButtonV2";
import { SyntheticEvent } from "react";

interface ONVIFCameraProps {
  assetId: string;
  facilityId: string;
  asset: any;
}

const ONVIFCamera = (props: ONVIFCameraProps) => {
  const { assetId, facilityId, asset } = props;
  const [isLoading, setIsLoading] = useState(true);
  const [assetType, setAssetType] = useState("");
  const [middlewareHostname, setMiddlewareHostname] = useState("");
  const [facilityMiddlewareHostname, setFacilityMiddlewareHostname] =
    useState("");
  const [cameraAddress, setCameraAddress] = useState("");
  const [ipAddressError, setIpAddressError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [streamUuid, setStreamUuid] = useState("");
  const [bed, setBed] = useState<BedModel>({});
  const [newPreset, setNewPreset] = useState("");
  const [loadingAddPreset, setLoadingAddPreset] = useState(false);
  const [loadingSetConfiguration, setLoadingSetConfiguration] = useState(false);
  const [refreshPresetsHash, setRefreshPresetsHash] = useState(
    Number(new Date())
  );
  const dispatch = useDispatch<any>();

  useEffect(() => {
    const fetchFacility = async () => {
      const res = await dispatch(getPermittedFacility(facilityId));

      if (res.status === 200 && res.data) {
        setFacilityMiddlewareHostname(res.data.middleware_address);
      }
    };

    if (facilityId) fetchFacility();
  }, [dispatch, facilityId]);

  useEffect(() => {
    if (asset) {
      setAssetType(asset?.asset_class);
      const cameraConfig = getCameraConfig(asset);
      setMiddlewareHostname(cameraConfig.middleware_hostname);
      setCameraAddress(cameraConfig.hostname);
      setUsername(cameraConfig.username);
      setPassword(cameraConfig.password);
      setStreamUuid(cameraConfig.accessKey);
    }
    setIsLoading(false);
  }, [asset]);

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    if (
      middlewareHostname.trim() === "" ||
      cameraAddress.trim() === "" ||
      username.trim() === "" ||
      password.trim() === "" ||
      streamUuid.trim() === ""
    ) {
      Notification.Error({
        msg: "Please fill in all the required fields!",
      });
      return;
    }
    if (!checkIfValidIP(cameraAddress)) {
      setIpAddressError("Please enter a valid Camera address!");
      return;
    }
    setLoadingSetConfiguration(true);
    setIpAddressError("");
    const data = {
      meta: {
        asset_type: "CAMERA",
        middleware_hostname: middlewareHostname,
        local_ip_address: cameraAddress,
        camera_access_key: `${username}:${password}:${streamUuid}`,
      },
    };
    try {
      const res: any = await dispatch(partialUpdateAsset(assetId, data));
      if (res?.status === 200) {
        Notification.Success({
          msg: "Asset Configured Successfully",
        });
        window.location.reload();
      } else {
        Notification.Error({
          msg: "Something went wrong!",
        });
      }
    } catch (error) {
      Notification.Error({
        msg: "Something went wrong!",
      });
    }
    setLoadingSetConfiguration(false);
  };

  const addPreset = async (e: SyntheticEvent) => {
    e.preventDefault();
    const config = getCameraConfig(asset as AssetData);
    const data = {
      bed_id: bed.id,
      preset_name: newPreset,
    };
    try {
      setLoadingAddPreset(true);
      const presetData = await axios.get(
        `https://${facilityMiddlewareHostname}/status?hostname=${config.hostname}&port=${config.port}&username=${config.username}&password=${config.password}`
      );
      const res: any = await dispatch(
        createAssetBed(
          { meta: { ...data, ...presetData.data } },
          assetId,
          bed?.id as string
        )
      );
      if (res?.status === 201) {
        Notification.Success({
          msg: "Preset Added Successfully",
        });
        setBed({});
        setNewPreset("");
        setRefreshPresetsHash(Number(new Date()));
      } else {
        Notification.Error({
          msg: "Something went wrong!",
        });
      }
    } catch (e) {
      Notification.Error({
        msg: "Something went wrong!",
      });
    }
    setLoadingAddPreset(false);
  };

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <form className="bg-white rounded shadow p-8" onSubmit={handleSubmit}>
        <div className="grid gap-x-4 grid-cols-1 lg:grid-cols-2">
          <TextFormField
            name="middleware_hostname"
            label="Hospital Middleware Hostname"
            autoComplete="off"
            value={middlewareHostname}
            onChange={({ value }) => setMiddlewareHostname(value)}
            required
          />
          <TextFormField
            name="camera_address"
            label="Local IP Address"
            autoComplete="off"
            value={cameraAddress}
            onChange={({ value }) => setCameraAddress(value)}
            error={ipAddressError}
            required
          />
          <TextFormField
            name="username"
            label="Username"
            autoComplete="off"
            value={username}
            onChange={({ value }) => setUsername(value)}
            required
          />
          <TextFormField
            name="password"
            label="Password"
            autoComplete="off"
            type="password"
            value={password}
            onChange={({ value }) => setPassword(value)}
            required
          />
          <TextFormField
            name="stream_uuid"
            label="Stream UUID"
            autoComplete="off"
            value={streamUuid}
            type="password"
            className="tracking-widest"
            labelClassName="tracking-normal"
            onChange={({ value }) => setStreamUuid(value)}
            required
          />
        </div>
        <div className="flex justify-end">
          <Submit
            disabled={loadingSetConfiguration}
            className="w-full md:w-auto"
            label="Set Configuration"
          />
        </div>
      </form>

      {assetType === "ONVIF" ? (
        <CameraConfigure
          asset={asset as AssetData}
          bed={bed}
          setBed={setBed}
          newPreset={newPreset}
          setNewPreset={setNewPreset}
          addPreset={addPreset}
          isLoading={loadingAddPreset}
          refreshPresetsHash={refreshPresetsHash}
          facilityMiddlewareHostname={facilityMiddlewareHostname}
        />
      ) : null}
    </div>
  );
};

export default ONVIFCamera;
