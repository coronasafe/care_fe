import { lazy } from "react";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";
import { CURRENT_HEALTH_CHANGE, SYMPTOM_CHOICES } from "../../Common/constants";
import { DailyRoundsModel } from "./models";
import Page from "../Common/components/Page";
import ButtonV2 from "../Common/components/ButtonV2";
import { formatDateTime } from "../../Utils/utils";
const Loading = lazy(() => import("../Common/Loading"));
const symptomChoices = [...SYMPTOM_CHOICES];
const currentHealthChoices = [...CURRENT_HEALTH_CHANGE];

export const DailyRoundListDetails = (props: any) => {
  const { facilityId, patientId, consultationId, id } = props;
  const { res, data, loading } = useQuery(routes.getDailyReport, {
    pathParams: {
      consultationId,
      id,
    },
  });
  const fetchpatient = async () => {
    if (res && data) {
      const currentHealth = currentHealthChoices.find(
        (i) => i.text === data?.current_health
      );

      const Data: DailyRoundsModel = {
        ...data,
        temperature: Number(data?.temperature) ? data.temperature : "",
        additional_symptoms_text: "",
        medication_given:
          Object.keys(data.medication_given ?? {}).length === 0
            ? []
            : data.medication_given,
        current_health: currentHealth
          ? currentHealth.desc
          : data.current_health,
      };
      if (data.additional_symptoms?.length) {
        const symptoms = data.additional_symptoms.map((symptom: number) => {
          const option = symptomChoices.find((i) => i.id === symptom);
          return option ? option.text.toLowerCase() : symptom;
        });
        Data.additional_symptoms_text = symptoms.join(", ");
      }
    }
  };
  fetchpatient();
  if (loading) {
    return <Loading />;
  }
  return (
    <Page
      title={`Consultation Update #${id}`}
      backUrl={`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily-rounds`}
    >
      <div className="mt-4 h-full rounded-lg border bg-white p-4 text-black shadow hover:border-primary-500">
        <div className="flex justify-between">
          <div className="max-w-md">
            <div>
              <span className="font-semibold leading-relaxed">
                Patient Category:{" "}
              </span>
              {data?.patient_category ?? "-"}
            </div>
          </div>

          <div>
            <div className="mt-2">
              <ButtonV2
                href={`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily-rounds/${id}/update`}
              >
                Update Details
              </ButtonV2>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <span className="font-semibold leading-relaxed">Temperature: </span>
            {data?.temperature ?? "-"}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Taken at: </span>
            {data?.taken_at ? formatDateTime(data?.taken_at) : "-"}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">SpO2: </span>
            {data?.ventilator_spo2 ?? "-"}
          </div>
          <div className="capitalize md:col-span-2">
            <span className="font-semibold leading-relaxed">
              Additional Symptoms:{" "}
            </span>
            {data?.additional_symptoms_text ?? "-"}
          </div>
          <div className="capitalize md:col-span-2">
            <span className="font-semibold leading-relaxed">
              Admitted To *:{" "}
            </span>
            {data?.admitted_to ?? "-"}
          </div>
          <div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">
              Physical Examination Info:{" "}
            </span>
            {data?.physical_examination_info ?? "-"}
          </div>
          <div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">
              Other Symptoms:{" "}
            </span>
            {data?.other_symptoms ?? "-"}
          </div>
          <div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">
              Other Details:{" "}
            </span>
            {data?.other_details ?? "-"}
          </div>
          <div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">Pulse(bpm): </span>
            {data?.pulse ?? "-"}
          </div>
          <div className="md:col-span-2 ">
            <span className="font-semibold leading-relaxed">BP</span>
            <div className="flex flex-row space-x-20">
              <div className="flex">
                <span className="font-semibold leading-relaxed">
                  Systolic:{" "}
                </span>
                {data?.bp?.systolic ?? "-"}
              </div>
              <div className="flex">
                {" "}
                <span className="font-semibold leading-relaxed">
                  Diastolic:
                </span>
                {data?.bp?.diastolic ?? "-"}
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">
              Respiratory Rate (bpm):
            </span>

            {data?.resp ?? "-"}
          </div>
          <div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">Rhythm: </span>
            {data?.rhythm ?? "-"}
          </div>
          <div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">
              Rhythm Description:{" "}
            </span>
            {data?.rhythm_detail ?? "-"}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">
              Recommend Discharge:{" "}
            </span>
            {data?.recommend_discharge ? (
              <span className="badge badge-pill badge-warning">Yes</span>
            ) : (
              <span className="badge badge-pill badge-secondary">No</span>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
};
