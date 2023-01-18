import React, { useState } from "react";
import moment from "moment";
import * as Notification from "../../Utils/Notifications";
import { animated, config, useSpring } from "@react-spring/web";
import { useDispatch } from "react-redux";
import {
  DialogContentText,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@material-ui/core";
import { deleteCapacity } from "../../Redux/actions";
import { RoleButton } from "../Common/RoleButton";
import { BedCapacity } from "./BedCapacity";
import DialogModal from "../Common/Dialog";

interface BedTypeCardProps {
  facilityId?: string;
  bedCapacityId?: number;
  room_type?: number;
  label: string;
  used: number;
  total: number;
  lastUpdated?: string;
  removeBedType?: (bedTypeId: number | undefined) => void;
  handleUpdate: () => void;
}

const CIRCLE_PATH =
  "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831";

export const BedTypeCard: React.FC<BedTypeCardProps> = ({
  facilityId,
  bedCapacityId,
  room_type,
  label,
  used,
  total,
  lastUpdated,
  removeBedType,
  handleUpdate,
}) => {
  const dispatchAction: any = useDispatch();
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number>(-1);
  const handleDeleteSubmit = async () => {
    if (room_type) {
      const res = await dispatchAction(
        deleteCapacity({
          facilityId: facilityId,
          bed_id: room_type,
        })
      );
      if (res && res.status == 204) {
        Notification.Success({
          msg: "Bed type deleted successfully",
        });
        setOpenDeleteDialog(false);
        if (removeBedType) {
          removeBedType(bedCapacityId);
        }
      }
    }
  };

  const handleDeleteClose = () => {
    setOpenDeleteDialog(false);
  };

  const _p = total ? Math.round((used / total) * 100) : 0;

  const { occupied, totalCount, progress, innerProgress } = useSpring({
    from: { occupied: 0, totalCount: 0, progress: "0, 100", innerProgress: 0 },
    to: {
      occupied: used,
      totalCount: total,
      progress: `${Number.isNaN(_p) ? 0 : _p}, 100`,
      innerProgress: Number.isNaN(_p) ? 0 : _p,
    },
    delay: 0,
    config: config.slow,
  });

  return (
    <div
      className={`${
        facilityId
          ? "border border-slate-200 bg-white"
          : "border border-primary-500 bg-primary-100"
      } opacity-100 shadow-sm rounded-xl flex flex-col justify-between h-full`}
      style={{ padding: "clamp(0.75rem,5vw,1.5rem)" }}
    >
      <div className={"opacity-100"}>
        <p
          className={`${
            facilityId ? "font-medium" : "font-bold"
          } text-slate-900 text-xl mb-2 md:mb-4 text-center h-12`}
        >
          {label}
        </p>

        <div className="relative">
          <div className={"opacity-100"}>
            <div className="flex items-center justify-center h-2/3">
              <div className="relative flex content-center justify-center m-2 w-4/5">
                <svg viewBox="0 0 38 36" className="w-full">
                  <path
                    className={`${
                      facilityId ? "text-slate-200" : "text-white"
                    } stroke-current stroke-[3px]`}
                    fill="none"
                    d={CIRCLE_PATH}
                  />
                  <animated.path
                    className="text-primary-500 stroke-current stroke-[2px]"
                    fill="none"
                    strokeDasharray={progress}
                    d={CIRCLE_PATH}
                  />
                </svg>
                <div className="absolute inline-flex flex-col items-center justify-center self-center w-3/5 text-center text-sm xl:text-lg">
                  <div className="space-x-1">
                    <animated.span className="text-center text-3xl text-slate-700 font-semibold">
                      {innerProgress.to(
                        (x: number) => `${Math.round(x) || 0}%`
                      )}
                    </animated.span>
                  </div>
                  {
                    <div className="mt-2 text-center">
                      <span
                        className={"text-xl font-medium text-green-600"}
                      ></span>
                    </div>
                  }
                </div>
              </div>
            </div>
            <div className="flex flex-col h-1/3 lg:flex-row gap-4 text-center mt-4 justify-center items-center">
              <div className="w-1/2">
                <p className="text-slate-500 font-medium text-lg xl:text-xl">
                  Used:
                  <animated.span className="ml-2 text-slate-700 font-semibold text-lg  xl:text-xl">
                    {occupied.to((x: number) => Math.round(x))}
                  </animated.span>
                </p>
              </div>
              <div className="w-1/2">
                <p className="text-slate-500 font-medium text-lg xl:text-xl">
                  Total:
                  <animated.span className="ml-2 text-slate-700 text-lg font-semibold xl:text-xl">
                    {totalCount.to((x: number) => Math.round(x))}
                  </animated.span>
                </p>
              </div>
            </div>
            {facilityId && (
              <div className="flex justify-between gap-2 pt-6">
                <div className="text-xs text-gray-600 font-[400] italic p-1">
                  Last Updated: {lastUpdated && moment(lastUpdated).fromNow()}
                </div>
                <div className="flex justify-evenly gap-2 relative">
                  <RoleButton
                    handleClickCB={() => {
                      setSelectedId(room_type || 0);
                      setOpen(true);
                    }}
                    disableFor="readOnly"
                    buttonType="html"
                  >
                    <div className="bg-[#9FA6B230] hover:bg-[#9FA6B290] p-1.5 rounded">
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 18 18"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3.16675 14H6.70008C6.80975 14.0007 6.91847 13.9796 7.02 13.9382C7.12153 13.8967 7.21388 13.8356 7.29175 13.7584L13.0584 7.98336L15.4251 5.6667C15.5032 5.58923 15.5652 5.49706 15.6075 5.39551C15.6498 5.29396 15.6716 5.18504 15.6716 5.07503C15.6716 4.96502 15.6498 4.8561 15.6075 4.75455C15.5652 4.653 15.5032 4.56083 15.4251 4.48336L11.8917 0.908364C11.8143 0.830257 11.7221 0.768262 11.6206 0.725954C11.519 0.683647 11.4101 0.661865 11.3001 0.661865C11.1901 0.661865 11.0812 0.683647 10.9796 0.725954C10.8781 0.768262 10.7859 0.830257 10.7084 0.908364L8.35841 3.2667L2.57508 9.0417C2.49785 9.11956 2.43674 9.21191 2.39527 9.31344C2.3538 9.41497 2.33278 9.52369 2.33341 9.63336V13.1667C2.33341 13.3877 2.42121 13.5997 2.57749 13.756C2.73377 13.9122 2.94573 14 3.16675 14ZM11.3001 2.67503L13.6584 5.03336L12.4751 6.2167L10.1167 3.85836L11.3001 2.67503ZM4.00008 9.97503L8.94175 5.03336L11.3001 7.3917L6.35842 12.3334H4.00008V9.97503ZM16.5001 15.6667H1.50008C1.27907 15.6667 1.06711 15.7545 0.910826 15.9108C0.754545 16.0671 0.666748 16.279 0.666748 16.5C0.666748 16.721 0.754545 16.933 0.910826 17.0893C1.06711 17.2456 1.27907 17.3334 1.50008 17.3334H16.5001C16.7211 17.3334 16.9331 17.2456 17.0893 17.0893C17.2456 16.933 17.3334 16.721 17.3334 16.5C17.3334 16.279 17.2456 16.0671 17.0893 15.9108C16.9331 15.7545 16.7211 15.6667 16.5001 15.6667Z"
                          fill="black"
                        />
                      </svg>
                    </div>
                  </RoleButton>
                  <RoleButton
                    handleClickCB={() => setOpenDeleteDialog(true)}
                    disableFor="readOnly"
                    buttonType="html"
                  >
                    <div className="bg-[#9FA6B230] hover:bg-[#9FA6B290] p-1.5 rounded">
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 16 18"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6.33333 14C6.55435 14 6.76631 13.9122 6.92259 13.7559C7.07887 13.5996 7.16667 13.3876 7.16667 13.1666V8.16663C7.16667 7.94561 7.07887 7.73365 6.92259 7.57737C6.76631 7.42109 6.55435 7.33329 6.33333 7.33329C6.11232 7.33329 5.90036 7.42109 5.74408 7.57737C5.5878 7.73365 5.5 7.94561 5.5 8.16663V13.1666C5.5 13.3876 5.5878 13.5996 5.74408 13.7559C5.90036 13.9122 6.11232 14 6.33333 14ZM14.6667 3.99996H11.3333V3.16663C11.3333 2.50358 11.0699 1.8677 10.6011 1.39886C10.1323 0.930018 9.49637 0.666626 8.83333 0.666626H7.16667C6.50363 0.666626 5.86774 0.930018 5.3989 1.39886C4.93006 1.8677 4.66667 2.50358 4.66667 3.16663V3.99996H1.33333C1.11232 3.99996 0.900358 4.08776 0.744078 4.24404C0.587797 4.40032 0.5 4.61228 0.5 4.83329C0.5 5.05431 0.587797 5.26627 0.744078 5.42255C0.900358 5.57883 1.11232 5.66663 1.33333 5.66663H2.16667V14.8333C2.16667 15.4963 2.43006 16.1322 2.8989 16.6011C3.36774 17.0699 4.00363 17.3333 4.66667 17.3333H11.3333C11.9964 17.3333 12.6323 17.0699 13.1011 16.6011C13.5699 16.1322 13.8333 15.4963 13.8333 14.8333V5.66663H14.6667C14.8877 5.66663 15.0996 5.57883 15.2559 5.42255C15.4122 5.26627 15.5 5.05431 15.5 4.83329C15.5 4.61228 15.4122 4.40032 15.2559 4.24404C15.0996 4.08776 14.8877 3.99996 14.6667 3.99996ZM6.33333 3.16663C6.33333 2.94561 6.42113 2.73365 6.57741 2.57737C6.73369 2.42109 6.94565 2.33329 7.16667 2.33329H8.83333C9.05435 2.33329 9.26631 2.42109 9.42259 2.57737C9.57887 2.73365 9.66667 2.94561 9.66667 3.16663V3.99996H6.33333V3.16663ZM12.1667 14.8333C12.1667 15.0543 12.0789 15.2663 11.9226 15.4225C11.7663 15.5788 11.5543 15.6666 11.3333 15.6666H4.66667C4.44565 15.6666 4.23369 15.5788 4.07741 15.4225C3.92113 15.2663 3.83333 15.0543 3.83333 14.8333V5.66663H12.1667V14.8333ZM9.66667 14C9.88768 14 10.0996 13.9122 10.2559 13.7559C10.4122 13.5996 10.5 13.3876 10.5 13.1666V8.16663C10.5 7.94561 10.4122 7.73365 10.2559 7.57737C10.0996 7.42109 9.88768 7.33329 9.66667 7.33329C9.44565 7.33329 9.23369 7.42109 9.07741 7.57737C8.92113 7.73365 8.83333 7.94561 8.83333 8.16663V13.1666C8.83333 13.3876 8.92113 13.5996 9.07741 13.7559C9.23369 13.9122 9.44565 14 9.66667 14Z"
                          fill="#C81E1E"
                        />
                      </svg>
                    </div>
                  </RoleButton>
                </div>
              </div>
            )}
          </div>
          <p
            className={
              "font-bold text-xl text-slate-500 text-center my-8 w-full absolute top-1/4 left-1/2 -translate-x-1/2 opacity-0 pointer-events-none"
            }
          >
            No Data Available
          </p>
        </div>
      </div>
      <Dialog
        maxWidth={"md"}
        open={openDeleteDialog}
        onClose={handleDeleteClose}
      >
        <DialogTitle className="flex justify-center bg-primary-100">
          Are you sure you want to delete {label} type?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            You will not be able to access this bed type later.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <button onClick={handleDeleteClose} className="btn btn-primary">
            Cancel
          </button>
          <button
            onClick={handleDeleteSubmit}
            id="facility-delete-confirm"
            className="btn btn-danger"
          >
            Delete
          </button>
        </DialogActions>
      </Dialog>
      {open && (
        <DialogModal
          show={open}
          onClose={() => setOpen(false)}
          title="Update Bed Capacity"
          className="max-w-lg md:min-w-[650px]"
        >
          <BedCapacity
            facilityId={facilityId || ""}
            handleClose={() => {
              setOpen(false);
            }}
            handleUpdate={() => {
              handleUpdate();
              setOpen(false);
            }}
            id={selectedId}
          />
        </DialogModal>
      )}
    </div>
  );
};

export default BedTypeCard;
