import { relativeDate, formatDateTime, classNames } from "../../Utils/utils";
import { USER_TYPES_MAP } from "../../Common/constants";
import { PatientNoteStateType, PatientNotesModel } from "./models";
import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { useState } from "react";
import { Error, Success } from "../../Utils/Notifications";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";
import DialogModal from "../Common/Dialog";
import { t } from "i18next";

const PatientNoteCard = ({
  state,
  note,
  setReload,
}: {
  state: PatientNoteStateType;
  note: PatientNotesModel;
  setReload: any;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [noteField, setNoteField] = useState(note.note);
  const [showEditHistory, setShowEditHistory] = useState(false);

  const onUpdateNote = async () => {
    if (noteField === note.note) {
      setIsEditing(false);
      return;
    }
    const payload = {
      note: noteField,
    };
    if (!/\S+/.test(noteField)) {
      Error({
        msg: "Note Should Contain At Least 1 Character",
      });
      return;
    }

    const { res } = await request(routes.updatePatientNote, {
      pathParams: { patientId: state.patientId, noteId: note.id },
      body: payload,
    });
    if (res?.status === 200) {
      Success({ msg: "Note updated successfully" });
      setIsEditing(false);
      setReload(true);
    }
  };

  return (
    <>
      {" "}
      <div
        className={classNames(
          "mt-4 flex w-full flex-col rounded-lg border border-gray-300 bg-white p-3 text-gray-800",
          note.user_type === "RemoteSpecialist" && "border-primary-400"
        )}
      >
        <div className="flex justify-between">
          <div>
            <div>
              <span className="text-sm font-semibold text-gray-700">
                {note.created_by_object?.first_name || "Unknown"}{" "}
                {note.created_by_object?.last_name}
              </span>
              {note.user_type && (
                <span className="pl-2 text-sm text-gray-700">
                  {`(${USER_TYPES_MAP[note.user_type]})`}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-600">
              <div className="tooltip inline">
                <span className="tooltip-text tooltip-bottom">
                  {formatDateTime(note.created_date)}
                </span>
                Created {relativeDate(note.created_date, true)}
              </div>
            </div>
            {note.edits.length > 1 && (
              <div className="flex">
                <div
                  className="cursor-pointer text-xs text-gray-600"
                  onClick={() => {
                    setShowEditHistory(true);
                  }}
                >
                  <div className="tooltip inline">
                    <span className="tooltip-text tooltip-bottom">
                      {formatDateTime(note.edits[0].edited_on)}
                    </span>
                    Edited {relativeDate(note.edits[0].edited_on, true)}
                  </div>
                  <CareIcon
                    icon="l-history"
                    className="ml-1 h-4 w-4 pt-[3px] text-primary-600"
                  />
                </div>
              </div>
            )}
          </div>

          <ButtonV2
            className="text-gray-500"
            ghost
            onClick={() => {
              if (!isEditing) setIsEditing(true);
            }}
          >
            {isEditing ? (
              <CareIcon
                icon="l-check-circle"
                className="h-5 w-5"
                onClick={onUpdateNote}
              />
            ) : (
              <CareIcon icon="l-pen" className="h-5 w-5" />
            )}
          </ButtonV2>
        </div>
        {
          <div className="mt-2">
            {isEditing ? (
              <textarea
                rows={2}
                className="h-20 w-full resize-none rounded-lg border border-gray-300 p-2"
                value={noteField}
                onChange={(e) => setNoteField(e.target.value)}
              ></textarea>
            ) : (
              <div className="text-sm text-gray-700">{noteField}</div>
            )}
          </div>
        }
      </div>
      {showEditHistory && (
        <DialogModal
          show={showEditHistory}
          onClose={() => setShowEditHistory(false)}
          title={t("edit_history")}
        >
          <div>
            <div className="mb-4">
              <p className="text-md mt-1 text-gray-500">
                Edit History for note
                <strong> {note.id}</strong>
              </p>
            </div>
            <div className="h-96 overflow-scroll">
              {note.edits.map((edit, index) => {
                const isLast = index === note.edits.length - 1;
                return (
                  <div
                    key={index}
                    className="my-2 flex flex-col justify-between rounded-lg border border-gray-300 p-4 py-2 transition-colors duration-200 hover:bg-gray-100"
                  >
                    <div className="flex">
                      <div className="grow">
                        <p className="text-sm font-medium text-gray-500">
                          {isLast ? "Created" : "Edited"} On
                        </p>
                        <p className="text-sm text-gray-900">
                          {formatDateTime(edit.edited_on)}
                        </p>
                      </div>
                      <div className="grow">
                        <p className="text-sm font-medium text-gray-500">
                          {isLast ? "Created" : "Edited"} By
                        </p>
                        <p className="text-sm text-gray-900">
                          {edit.edited_by.username}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 grow">
                      <p className="text-sm font-medium text-gray-500">Note</p>
                      <p className="text-sm text-gray-900">{edit.note}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end">
              <ButtonV2
                id="view-history-back-button"
                variant="secondary"
                onClick={() => {
                  setShowEditHistory(false);
                }}
              >
                {t("close")}
              </ButtonV2>
            </div>
          </div>
        </DialogModal>
      )}
    </>
  );
};

export default PatientNoteCard;
