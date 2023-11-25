import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { addPatientNote, getPatient } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import CareIcon from "../../CAREUI/icons/CareIcon";
import TextFormField from "../Form/FormFields/TextFormField";
import ButtonV2 from "../Common/components/ButtonV2";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import PatientNotesList from "../Facility/PatientNotesList";
import Page from "../Common/components/Page";
import { useMessageListener } from "../../Common/hooks/useMessageListener";

interface PatientNotesProps {
  patientId: any;
  facilityId: any;
}

const PatientNotes = (props: PatientNotesProps) => {
  const { patientId, facilityId } = props;

  const [patientActive, setPatientActive] = useState(true);
  const [noteField, setNoteField] = useState("");
  const [reload, setReload] = useState(false);
  const [facilityName, setFacilityName] = useState("");
  const [patientName, setPatientName] = useState("");

  const dispatch = useDispatch();

  const onAddNote = () => {
    const payload = {
      note: noteField,
    };
    if (!/\S+/.test(noteField)) {
      Notification.Error({
        msg: "Note Should Contain At Least 1 Character",
      });
      return;
    }
    dispatch(addPatientNote(patientId, payload)).then(() => {
      Notification.Success({ msg: "Note added successfully" });
      setNoteField("");
      setReload(!reload);
    });
  };

  useEffect(() => {
    async function fetchPatientName() {
      if (patientId) {
        const res = await dispatch(getPatient({ id: patientId }));
        if (res.data) {
          setPatientActive(res.data.is_active);
          setPatientName(res.data.name);
          setFacilityName(res.data.facility_object.name);
        }
      }
    }
    fetchPatientName();
  }, [dispatch, patientId]);

  useMessageListener((data) => {
    const message = data?.message;
    if (
      (message?.from == "patient/doctor_notes/create" ||
        message?.from == "patient/doctor_notes/edit") &&
      message?.facility_id == facilityId &&
      message?.patient_id == patientId
    ) {
      setReload(true);
    }
  });

  return (
    <Page
      title="Patient Notes"
      className="flex h-screen flex-col"
      crumbsReplacements={{
        [facilityId]: { name: facilityName },
        [patientId]: { name: patientName },
      }}
      backUrl={`/facility/${facilityId}/patient/${patientId}`}
    >
      <div className="mx-3 my-2 flex grow flex-col rounded-lg bg-white p-2 sm:mx-10 sm:my-5 sm:p-5">
        <PatientNotesList
          patientId={patientId}
          facilityId={facilityId}
          reload={reload}
          setReload={setReload}
        />

        <div className="relative mx-4 flex items-center">
          <TextFormField
            name="note"
            value={noteField}
            onChange={(e) => setNoteField(e.value)}
            className="grow"
            type="text"
            errorClassName="hidden"
            placeholder="Type your Note"
            disabled={!patientActive}
          />
          <ButtonV2
            onClick={onAddNote}
            border={false}
            className="absolute right-2"
            ghost
            size="small"
            disabled={!patientActive}
            authorizeFor={NonReadOnlyUsers}
          >
            <CareIcon className="care-l-message text-lg" />
          </ButtonV2>
        </div>
      </div>
    </Page>
  );
};

export default PatientNotes;
