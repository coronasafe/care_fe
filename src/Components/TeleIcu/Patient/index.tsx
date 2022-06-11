import { Link } from "raviger";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { getPatient } from "../../../Redux/actions";
import Loading from "../../Common/Loading";
import PageTitle from "../../Common/PageTitle";
import { PatientModel } from "../../Patient/models";
import DoctorVideoSlideover from "../DoctorVideoSlideover";
import { RightArrowIcon } from "../Icons/ArrowIcon";
import TeleICUPatientInfoCard from "./InfoCard";
import TeleICUPatientVitalsCard from "./VitalsCard";
import TeleICUPatientVitalsGraphCard from "./VitalsGraph";

export interface ITeleICUPatientPageProps {
  patientId: string;
  facilityId: string;
  asComponent?: boolean;
}

export default function TeleICUPatientPage({
  patientId,
  asComponent = false,
}: ITeleICUPatientPageProps) {
  const [patient, setPatient] = useState<PatientModel>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showDoctors, setShowDoctors] = useState(false);
  const dispatch: any = useDispatch();

  useEffect(() => {
    dispatch(getPatient({ id: patientId })).then((response: any) => {
      if (response?.data) {
        setPatient(response.data);
      }
      setIsLoading(false);
    });
  }, []);

  console.log(patient);

  if (isLoading) return <Loading />;

  return (
    <main className="p-5 w-full">
      <nav className="flex justify-between flex-wrap">
        {!asComponent ? (
          <PageTitle
            title="Patient Details"
            className="sm:m-0 sm:p-0"
            breadcrumbs={false}
          />
        ) : (
          <div></div>
        )}
        <div className="flex items-start justify-start sm:flex-row sm:items-center flex-col space-y-1 sm:space-y-0 sm:divide-x-2">
          <div className="px-2">
            <button
              // href={`https://wa.me/${patient?.last_consultation?.assigned_to_object?.alt_phone_number}`}
              // target="_blank"
              // rel="noopener noreferrer"
              onClick={() => setShowDoctors(true)}
              className="btn m-1 btn-primary hover:text-white"
            >
              Doctor Connect
            </button>
            {patient.last_consultation?.id && (
              <Link
                href={`/facility/${patient.facility}/patient/${patient.id}/consultation/${patient.last_consultation?.id}/feed`}
                className="btn m-1 btn-primary hover:text-white"
              >
                Camera Feed
              </Link>
            )}
          </div>
          <div className="px-2">
            <Link
              href={`/facility/${patient.facility}/patient/${patient.id}/consultation/${patient.last_consultation?.id}/treatment-summary`}
              className="btn m-1 btn-primary hover:text-white"
            >
              Generate Treatment Summary
            </Link>
            <Link
              href={`/facility/${patient.facility}/patient/${patient.id}/notes/`}
              className="btn m-1 btn-primary hover:text-white"
            >
              Doctor&apos;s Notes
            </Link>
          </div>
        </div>
      </nav>
      <TeleICUPatientInfoCard patient={patient} />
      <section className="bg-white shadow-sm rounded-md flex items-stretch w-full flex-col lg:flex-row">
        <TeleICUPatientVitalsCard patient={patient} />
        <TeleICUPatientVitalsGraphCard
          consultationId={patient.last_consultation?.id}
        />
      </section>
      <section className="bg-white my-2 shadow-sm rounded-md flex items-stretch w-full flex-col lg:flex-row">
        <div className="w-full p-5 py-3">
          <h4 className="flex items-center mb-2">
            <span className="font-semibold text-xl">Medical History</span>
            <span className="ml-2">
              <RightArrowIcon className="text-gray-900" />
            </span>
          </h4>
          <div className="grid lg:grid-cols-2 grid-cols-1 gap-2 my-2">
            <div className="grid sm:grid-cols-3 grid-cols-1 gap-2">
              <div className="p-3">
                <h4 className="font-bold text-lg">Present Health</h4>
                <span className="font-normal text-primary-900 text-sm md:text-base">
                  {patient.present_health || "-"}
                </span>
              </div>
              <div className="p-3">
                <h4 className="font-bold text-lg">Ongoing Meds.</h4>
                <span className="font-normal text-primary-900 text-sm md:text-base">
                  {patient.ongoing_medication || "-"}
                </span>
              </div>
              <div className="p-3">
                <h4 className="font-bold text-lg">Allergies</h4>
                <span className="font-normal text-primary-900 text-sm md:text-base">
                  {patient.allergies || "-"}
                </span>
              </div>
            </div>
            {patient.medical_history
              ?.filter((e) => e.disease !== "NO")
              .map((history, id) => (
                <div key={id} className="p-3">
                  <h4 className="font-bold text-lg">{history.disease}</h4>
                  <span className="font-normal text-primary-900 text-sm md:text-base">
                    {history.details}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </section>
      <DoctorVideoSlideover
        facilityId={patient.facility ?? ""}
        show={showDoctors}
        setShow={setShowDoctors}
      />
    </main>
  );
}
