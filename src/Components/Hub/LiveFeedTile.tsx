import axios from "axios";
import React, { useEffect, useState, useRef, useCallback } from "react";
import * as Notification from "../../Utils/Notifications.js";
import { useDispatch } from "react-redux";
import ReactPlayer from "react-player";
import { getAsset, listAssetBeds } from "../../Redux/actions";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { useTranslation } from "react-i18next";
import useFullscreen from "../../Common/hooks/useFullscreen.js";
interface LiveFeedTileProps {
  assetId: string;
}

interface CameraPosition {
  x: number;
  y: number;
  zoom: number;
}

// string:string dictionary
interface CameraPreset {
  [key: string]: string;
}

export default function LiveFeedTile(props: LiveFeedTileProps) {
  const dispatch: any = useDispatch();
  const { assetId } = props;
  const [sourceUrl, setSourceUrl] = useState<string>();
  const [asset, setAsset] = useState<any>();
  const [presets, setPresets] = useState<CameraPreset[]>([]);
  const [bedPresets, setBedPresets] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(true);
  // const [showControls, setShowControls] = useState<boolean>(false);
  const [showDefaultPresets, setShowDefaultPresets] = useState<boolean>(false);
  const [position, setPosition] = useState<CameraPosition>({
    x: 0,
    y: 0,
    zoom: 0,
  });
  const { t } = useTranslation();
  const [_isFullscreen, setFullscreen] = useFullscreen();
  // const [toggle, setToggle] = useState(false);
  console.log("re-rendered");

  useEffect(() => {
    let loadingTimeout: any;
    if (loading === true)
      loadingTimeout = setTimeout(() => {
        setLoading(false);
      }, 6000);
    return () => {
      if (loadingTimeout) clearTimeout(loadingTimeout);
    };
  }, [loading]);

  const fetchData = useCallback(
    async (status: statusType) => {
      setLoading(true);
      console.log("fetching asset");
      const assetData: any = await dispatch(getAsset(assetId));
      console.log("assetData", assetData);
      if (!status.aborted) {
        // setLoading(false);
        if (!assetData.data)
          Notification.Error({
            msg: t("something_went_wrong"),
          });
        else {
          setAsset(assetData.data);
        }
      }
    },
    [dispatch, assetId]
  );

  useAbortableEffect(
    (status: statusType) => fetchData(status),
    [dispatch, fetchData]
  );
  const requestStream = () => {
    axios
      .post(`https://${asset.meta.middleware_hostname}/start`, {
        uri: "rtsp://remote:qwerty123@192.168.1.64:554/",
      })
      .then((resp: any) => {
        setSourceUrl(
          `https://${asset.meta.middleware_hostname}${resp.data.uri}`
        );
      })
      .catch((_ex: any) => {
        // console.error('Error while refreshing',ex);
      });
  };
  const stopStream = (url: string | undefined) => {
    console.log("stop", url);
    if (url) {
      const urlSegments = url.split("/");
      const id = urlSegments?.pop();
      axios
        .post(`https://${asset.meta.middleware_hostname}/stop`, {
          id,
        })
        .then((resp: any) => {
          console.log(resp);
          // setSourceUrl(`https://${middlewareHostname}${resp.data.uri}`);
        })
        .catch((_ex: any) => {
          // console.error('Error while refreshing',ex);
        });
    }
  };
  const getCameraStatus = (asset: any) => {
    axios
      .get(
        `https://${asset.meta.middleware_hostname}/status?hostname=${asset.hostname}&port=${asset.port}&username=${asset.username}&password=${asset.password}`
      )
      .then((resp: any) => {
        setPosition(resp.data.position);
      })
      .catch((_ex: any) => {
        // console.error('Error while refreshing',ex);
      });
  };
  const getPresets = (asset: any) => {
    console.log(asset);
    const url = `https://${asset.meta.middleware_hostname}/presets?hostname=${asset.hostname}&port=${asset.port}&username=${asset.username}&password=${asset.password}`;
    console.log(url);
    axios
      .get(url)
      .then((resp: any) => {
        setPresets(resp.data);
        console.log("PRESETS", resp.data);
      })
      .catch((_ex: any) => {
        // console.error("Error while refreshing", ex);
      });
  };
  const getBedPresets = async (_asset: any) => {
    const bedAssets = await dispatch(listAssetBeds({ asset: props.assetId }));
    setBedPresets(bedAssets.data.results);
  };
  const gotoBedPreset = (preset: any) => {
    absoluteMove(preset.meta.position);
  };
  const gotoPreset = (preset: number) => {
    axios
      .post(`https://${asset.meta.middleware_hostname}/gotoPreset`, {
        ...asset,
        preset,
      })
      .then((resp: any) => {
        console.log(resp.data);
      })
      .catch((_ex: any) => {
        // console.error('Error while refreshing',ex);
      });
  };
  const requestPTZ = (action: string) => {
    setLoading(true);
    if (!position) {
      getCameraStatus(asset);
    } else {
      const data = {
        x: 0,
        y: 0,
        zoom: 0,
      } as any;
      console.log(action);
      // Relative X Y Coordinates
      switch (action) {
        case "up":
          data.y = 0.05;
          break;
        case "down":
          data.y = -0.05;
          break;
        case "left":
          data.x = -0.05;
          break;
        case "right":
          data.x = 0.05;
          break;
        case "zoomIn":
          data.zoom = 0.05;
          break;
        case "zoomOut":
          data.zoom = -0.05;
          break;
        case "stop":
          stopStream(sourceUrl);
          setSourceUrl(undefined);
          return;
        case "reset":
          setSourceUrl(undefined);
          requestStream();
          return;
        default:
          break;
      }
      axios
        .post(`https://${asset.meta.middleware_hostname}/relativeMove`, {
          ...data,
          ...asset,
        })
        .then((resp: any) => {
          console.log(resp.data);
          getCameraStatus(asset);
        })
        .catch((_ex: any) => {
          // console.error('Error while refreshing',ex);
        });
    }
  };

  const absoluteMove = (data: any) => {
    setLoading(true);
    axios
      .post(`https://${asset.meta.middleware_hostname}/absoluteMove`, {
        ...data,
        ...asset,
      })
      .then((_resp: any) => {
        getCameraStatus(asset);
      })
      .catch((ex: any) => {
        console.error("Error while absolute move", ex);
      });
  };

  useEffect(() => {
    if (asset) {
      getPresets(asset);
      getBedPresets(asset);
      requestStream();
    }
  }, [asset]);

  useEffect(() => {
    if (bedPresets.length > 0) absoluteMove(bedPresets[0].meta.position);
  }, [bedPresets]);

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setShowControls(toggle);
  //   }, 300);
  //   return () => clearTimeout(timer);
  // }, [toggle]);

  const liveFeedPlayerRef = useRef<any>(null);
  const handleClickFullscreen = () => {
    if (liveFeedPlayerRef.current) {
      setFullscreen(true, liveFeedPlayerRef.current.wrapper);
    }
  };

  const viewOptions = presets
    ? Object.entries(presets)
        .map(([key, value]) => ({ label: key, value }))
        .slice(0, 10)
    : Array.from(Array(10), (_, i) => ({
        label: t("monitor") + (i + 1),
        value: i + 1,
      }));

  const cameraPTZ = [
    { icon: "fa fa-arrow-up", label: t("up"), action: "up" },
    { icon: "fa fa-arrow-down", label: t("down"), action: "down" },
    { icon: "fa fa-arrow-left", label: t("left"), action: "left" },
    { icon: "fa fa-arrow-right", label: t("right"), action: "right" },
    { icon: "fa fa-search-plus", label: t("zoom_in"), action: "zoomIn" },
    { icon: "fa fa-search-minus", label: t("zoom_out"), action: "zoomOut" },
    { icon: "fa fa-stop", label: t("stop"), action: "stop" },
    { icon: "fa fa-undo", label: t("reset"), action: "reset" },
  ];

  return (
    <div className="mt-4 px-6 mb-2">
      <div className="mt-4 flex flex-col">
        <div className="mt-4 relative flex flex-col group">
          <div>
            {sourceUrl ? (
              <div>
                <ReactPlayer
                  url={sourceUrl}
                  ref={liveFeedPlayerRef}
                  playing={true}
                  muted={true}
                  onError={(
                    e: any,
                    data: any,
                    hlsInstance: any,
                    hlsGlobal: any
                  ) => {
                    // requestStream();
                    console.log("Error", e);
                    console.log("Data", data);
                    console.log("HLS Instance", hlsInstance);
                    console.log("HLS Global", hlsGlobal);
                    if (e === "hlsError") {
                      const recovered = hlsInstance.recoverMediaError();
                      console.log(recovered);
                    }
                  }}
                />
              </div>
            ) : (
              <div className="bg-gray-500 w-[88vw] h-[50vw] xl:w-[44vw] xl:h-[25vw] 3xl:w-[32vw] 3xl:h-[18vw] flex flex-col justify-center items-center">
                <p className="font-bold text-black">
                  STATUS: <span className="text-red-600">OFFLINE</span>
                </p>
                <p className="font-semibold text-black">
                  {t("feed_is_currently_not_live")}
                </p>
              </div>
            )}
          </div>
          <div className="absolute w-[88vw] h-[50vw] xl:w-[44vw] xl:h-[25vw] 3xl:w-[32vw] 3xl:h-[18vw] invisible group-hover:visible">
            <div className="flex justify-center items-end h-full">
              <div className="flex flex-row justify-between">
                <div className="mt-5 p-2 flex flex-row bg-green-100 border border-white rounded flex-1 justify-evenly">
                  {cameraPTZ.map((option: any) => (
                    <div
                      key={option.action}
                      onClick={(_) => {
                        // console.log(option.action);
                        requestPTZ(option.action);
                      }}
                    >
                      <button className="bg-green-100 hover:bg-green-200 border border-green-100 rounded p-2">
                        <span className="sr-only">{option.label}</span>
                        <i className={`${option.icon} md:p-2`}></i>
                      </button>
                    </div>
                  ))}
                  <button
                    className="bg-green-100 hover:bg-green-200 border border-green-100 rounded p-2"
                    onClick={handleClickFullscreen}
                  >
                    <span className="sr-only">{t("full_screen")}</span>
                    <i className="fas fa-expand hover:text-black"></i>
                  </button>
                </div>
                {/* <div className="flex flex-col justify-center mt-5 mr-4 md:mt-auto md:mr-0">
                    <button onClick={handleClickFullscreen}>
                    </button>
                  </div> */}
              </div>
            </div>
          </div>
          <div
            className={
              (loading ? "absolute" : "hidden") +
              " w-[88vw] h-[50vw] xl:w-[44vw] xl:h-[25vw] 3xl:w-[32vw] 3xl:h-[18vw] bg-gray-500 bg-opacity-75 z-10 transition-opacity"
            }
          >
            {/* div with "Loading" at the center */}
            <div className="flex justify-center items-center h-full">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <div className="text-white text-2xl">{t("moving_camera")}</div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap my-auto gap-4 mt-4 max-w-[86vw] xl:max-w-[43vw] 3xl:max-w-[30vw]">
          <button
            className="bg-green-200 border border-white rounded-md px-3 py-2 text-black font-semibold hover:bg-green-300"
            onClick={() => {
              setShowDefaultPresets(!showDefaultPresets);
            }}
          >
            {showDefaultPresets
              ? t("show_patient_presets")
              : t("show_default_presets")}
          </button>
          {showDefaultPresets
            ? viewOptions.map((option: any) => (
                <div
                  onClick={() => {
                    setLoading(true);
                    gotoPreset(option.value);
                  }}
                >
                  <button className="bg-green-100 border border-white rounded-md px-3 py-2 text-black font-semibold hover:bg-green-200 w-full">
                    {option.label}
                  </button>
                </div>
              ))
            : bedPresets.map((preset: any, index: number) => (
                <div
                  onClick={() => {
                    setLoading(true);
                    gotoBedPreset(preset);
                  }}
                  key={preset.id}
                >
                  <button className="bg-green-100 border border-white rounded-md px-3 py-2 text-black font-semibold hover:bg-green-200 w-full">
                    {preset.meta.preset_name
                      ? preset.meta.preset_name
                      : `Unnamed Preset ${index + 1}`}
                  </button>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
