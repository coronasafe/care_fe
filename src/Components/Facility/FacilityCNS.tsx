import { Link } from "raviger";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { GENDER_TYPES } from "../../Common/constants";
import {
  getAllPatient,
  getPermittedFacility,
  listAssetBeds,
} from "../../Redux/actions";
import { classNames } from "../../Utils/utils";
import { AssetData, AssetLocationObject } from "../Assets/AssetTypes";
import ButtonV2 from "../Common/components/ButtonV2";
import Page from "../Common/components/Page";
import Loading from "../Common/Loading";
import Pagination from "../Common/Pagination";
import { PatientModel } from "../Patient/models";
import PatientVitalsCard from "../Patient/PatientVitalsCard";
import { BedModel, FacilityModel } from "./models";
import AutocompleteFormField from "../Form/FormFields/Autocomplete";
import { uniqBy } from "lodash";

interface Monitor {
  patient: PatientModel;
  asset: AssetData;
  socketUrl: string;
}

const PER_PAGE_LIMIT = 6;
const CNS_REFRESH_INTERVAL = 0.5 * 60e3;

export default function FacilityCNS({ facilityId }: { facilityId: string }) {
  const dispatch = useDispatch<any>();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [monitors, setMonitors] = useState<Monitor[]>();
  const [facility, setFacility] = useState<FacilityModel>();
  const [currentPage, setCurrentPage] = useState(1);
  const [location, setLocation] = useState<AssetLocationObject>();

  useEffect(() => {
    const onFullscreenChange = () =>
      setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    async function fetchFacility() {
      const res = await dispatch(getPermittedFacility(facilityId || ""));
      if (res.status === 200) setFacility(res.data);
    }
    fetchFacility();
  }, [facilityId, dispatch]);

  useEffect(() => {
    if (!facility) return;
    const middlewareHostname = facility.middleware_address;

    async function fetchPatients() {
      const res = await dispatch(
        getAllPatient(
          { facility: facilityId, is_active: "True" },
          "cns-patient-list"
        )
      );
      if (res.status === 200) {
        const patients = res.data.results as PatientModel[];
        return patients.filter(
          (patient) => !!patient.last_consultation?.current_bed?.bed_object.id
        );
      }
    }

    async function fetchPatientMonitorAsset(patient: PatientModel) {
      const res = await dispatch(
        listAssetBeds(
          {
            bed: patient.last_consultation?.current_bed?.bed_object?.id,
          },
          `asset-bed-${patient.id}`
        )
      );

      if (res.status !== 200) return;

      const asset = res.data.results.find(
        (assetBed: any) =>
          assetBed.asset_object.meta?.asset_type === "HL7MONITOR"
      )?.asset_object as AssetData | undefined;

      if (!asset) return;

      const socketUrl = `wss://${middlewareHostname}/observations/${asset.meta?.local_ip_address}`;

      return { patient, asset, socketUrl } as Monitor;
    }

    async function fetchMonitors() {
      const patients = await fetchPatients();
      if (!patients) return;

      const monitors = await Promise.all(
        patients.map((patient) => fetchPatientMonitorAsset(patient))
      );
      return monitors.filter((monitor) => !!monitor) as Monitor[];
    }

    fetchMonitors().then((monitors) => {
      setMonitors(monitors);
    });

    const interval = setInterval(() => {
      fetchMonitors().then(setMonitors);
    }, CNS_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [dispatch, facility, facilityId]);

  if (!monitors) return <Loading />;
  return (
    <Page
      title={`Central Nursing Station: ${facility?.name}`}
      backUrl={`/facility/${facilityId}`}
      noImplicitPadding
      breadcrumbs={false}
      options={
        <div className="flex gap-4 items-center">
          <AutocompleteFormField
            name="location"
            placeholder="Filter by a specific location"
            value={location}
            onChange={({ value }) => setLocation(value)}
            options={
              monitors
                ? uniqBy(
                    monitors.map((m) => m.asset.location_object),
                    "id"
                  )
                : []
            }
            optionLabel={(location) => location.name}
            optionDescription={(location) => location.description}
            optionValue={(location) => location}
            optionIcon={() => (
              <div className="flex gap-2">
                <CareIcon className="care-l-bed text-lg" />
                <CareIcon className="care-l-map-marker text-lg" />
              </div>
            )}
            disabled={!monitors}
            labelClassName="hidden"
            errorClassName="hidden"
          />
          <ButtonV2
            variant="secondary"
            border
            ghost
            onClick={() => {
              if (isFullscreen) {
                document.exitFullscreen();
              } else {
                document.documentElement.requestFullscreen();
              }
            }}
            className="tooltip !h-11"
          >
            <CareIcon
              className={classNames(
                isFullscreen
                  ? "care-l-compress-arrows"
                  : "care-l-expand-arrows-alt",
                "text-lg"
              )}
            />
            <span className="tooltip-text tooltip-bottom -translate-x-1/2">
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </span>
          </ButtonV2>
          <Pagination
            className=""
            cPage={currentPage}
            onChange={(page) => setCurrentPage(page)}
            data={{ totalCount: monitors.length }}
            defaultPerPage={PER_PAGE_LIMIT}
          />
        </div>
      }
    >
      {monitors.length === 0 && (
        <div className="flex w-full h-[80vh] items-center justify-center text-black text-center">
          No patients are currently monitored
        </div>
      )}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-1">
        {monitors
          ?.filter((m) =>
            location ? m.asset.location_object.id === location?.id : true
          )
          ?.slice(
            (currentPage - 1) * PER_PAGE_LIMIT,
            currentPage * PER_PAGE_LIMIT
          )
          .map(({ patient, socketUrl }) => (
            <div key={patient.id} className="group p-2 rounded-lg bg-black">
              <div className="flex flex-wrap gap-4 text-white w-full tracking-wider p-2">
                <Link
                  href={`/facility/${facilityId}/patient/${patient.id}/consultation/${patient.last_consultation?.id}`}
                  className="font-bold uppercase text-white"
                >
                  {patient.name}
                </Link>
                <span>
                  {patient.age}y |{" "}
                  {GENDER_TYPES.find((g) => g.id === patient.gender)?.icon}
                </span>
                <span className="flex-1 flex items-center justify-end gap-2 text-end">
                  <CareIcon className="care-l-bed text-lg" />
                  {getBedName(
                    patient.last_consultation?.current_bed
                      ?.bed_object as BedModel
                  )}
                </span>
              </div>
              <PatientVitalsCard socketUrl={socketUrl} shrinked />
            </div>
          ))}
      </div>
    </Page>
  );
}

const getBedName = (bed: BedModel) => {
  return `${bed.name} - ${bed.location_object?.name}`;
};
