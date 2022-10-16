import { CardContent, Grid, Typography } from "@material-ui/core";
import { navigate } from "raviger";
import React from "react";
import { ConsultationModel } from "./models";
import { KASP_STRING } from "../../Common/constants";
import { RoleButton } from "../Common/RoleButton";
import { formatDate } from "../../Utils/utils";

interface ConsultationProps {
  itemData: ConsultationModel;
  isLastConsultation?: boolean;
}

export const ConsultationCard = (props: ConsultationProps) => {
  const { itemData, isLastConsultation } = props;
  return (
    <div className="block border rounded-lg bg-white shadow cursor-pointer hover:border-primary-500 text-black mt-4">
      {itemData.is_kasp && (
        <div className="ml-3 mt-2 inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium leading-5 bg-yellow-100 text-yellow-800">
          {KASP_STRING}
        </div>
      )}

      <CardContent>
        <Grid container justify="space-between" alignItems="center">
          <Grid item xs={12} container spacing={1}>
            <Grid item xs={7}>
              <Typography>
                <span className="text-gray-700">Facility: </span>
                {itemData.facility_name}{" "}
                {itemData.is_telemedicine && (
                  <span className="ml-2">(Telemedicine)</span>
                )}
              </Typography>
            </Grid>
            <Grid item xs={7}>
              <Typography className="capitalize">
                <span className="text-gray-700">Suggestion: </span>
                {itemData.suggestion_text?.toLocaleLowerCase()}
              </Typography>
            </Grid>
            <Grid item xs={5}>
              <Typography>
                <span className="text-gray-700">Admitted: </span>
                {itemData.admitted ? "Yes" : "No"}
              </Typography>
            </Grid>
            {itemData.kasp_enabled_date && (
              <Grid item xs={7}>
                <Typography>
                  <span className="text-gray-700">
                    {KASP_STRING} Enabled date:{" "}
                  </span>
                  {itemData.kasp_enabled_date
                    ? formatDate(itemData.kasp_enabled_date)
                    : "-"}
                </Typography>
              </Grid>
            )}
            {itemData.admission_date && (
              <Grid item xs={5}>
                <Typography>
                  <span className="text-gray-700">Admitted on: </span>
                  {formatDate(itemData.admission_date)}
                </Typography>
              </Grid>
            )}
            {itemData.discharge_date && (
              <Grid item xs={5}>
                <Typography>
                  <span className="text-gray-700">Discharged on: </span>
                  {formatDate(itemData.discharge_date)}
                </Typography>
              </Grid>
            )}
          </Grid>

          <div className="flex flex-col mt-6">
            {
              <div className="text-sm text-gray-700">
                Created on{" "}
                {itemData.created_date
                  ? formatDate(itemData.created_date)
                  : "--:--"}
                {itemData.created_by && (
                  <span>
                    by{" "}
                    {`${itemData.created_by?.first_name} ${itemData.created_by?.last_name} @${itemData.created_by?.username} (${itemData.created_by?.user_type})`}
                  </span>
                )}
              </div>
            }
            <div className="text-sm text-gray-700">
              Last Modified on
              {itemData.modified_date
                ? formatDate(itemData.modified_date)
                : "--:--"}{" "}
              {itemData.last_edited_by && (
                <span>
                  by{" "}
                  {`${itemData.last_edited_by?.first_name} ${itemData.last_edited_by?.last_name} @${itemData.last_edited_by?.username} (${itemData.last_edited_by?.user_type})`}
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 md:flex-row justify-between w-full">
            <button
              className="px-4 py-2 shadow border bg-white rounded-md border-grey-500 text-sm font-semibold cursor-pointer hover:bg-gray-300 text-center w-full md:w-fit my-1"
              onClick={() =>
                navigate(
                  `/facility/${itemData.facility}/patient/${itemData.patient}/consultation/${itemData.id}`
                )
              }
            >
              View Consultation / Consultation Updates
            </button>
            <button
              className="px-4 py-2 shadow border bg-white rounded-md border-grey-500 text-sm font-semibold cursor-pointer hover:bg-gray-300 text-center w-full md:w-fit my-1"
              onClick={() =>
                navigate(
                  `/facility/${itemData.facility}/patient/${itemData.patient}/consultation/${itemData.id}/files/`
                )
              }
            >
              View / Upload Consultation Files
            </button>
            {isLastConsultation && (
              <RoleButton
                className="md:mr-4 px-4 py-2 shadow border bg-white rounded-md border-grey-500 text-sm font-semibold cursor-pointer hover:bg-gray-300 text-center w-full md:w-fit my-1"
                handleClickCB={() =>
                  navigate(
                    `/facility/${itemData.facility}/patient/${itemData.patient}/consultation/${itemData.id}/daily-rounds`
                  )
                }
                disableFor="readOnly"
                buttonType="html"
              >
                Add Consultation Updates
              </RoleButton>
            )}
          </div>
        </Grid>
      </CardContent>
    </div>
  );
};
