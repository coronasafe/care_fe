import { Box } from "@material-ui/core";
import moment from "moment";
import React from "react";
import { DateRangePicker as DateRange } from "react-dates";
import "react-dates/initialize";
import "react-dates/lib/css/_datepicker.css";
import CareIcon from "../../CAREUI/icons/CareIcon";

interface IDateRangePickerProps {
  label?: string;
  onChange: (args: {
    startDate: moment.Moment | null;
    endDate: moment.Moment | null;
  }) => void;
  startDate: moment.Moment | null;
  endDate: moment.Moment | null;
  startDateId?: string;
  endDateId?: string;
  size?: "regular" | "small";
}

export const getDate = (value: any) =>
  value && moment(value).isValid() ? moment(value) : null;

/**
 * Deprecated. Use `DateRangeFormField` or `DateFormField` instead.
 */
export const DateRangePicker: React.FC<IDateRangePickerProps> = ({
  label,
  endDateId = "end_date",
  endDate,
  startDate,
  onChange,
  startDateId = "start_date",
  size = "regular",
}) => {
  const [focusInput, setFocusInput] = React.useState<any>(null);
  return (
    <Box className="my-2">
      {label && <span className="text-sm font-semibold">{label}</span>}
      <DateRange
        endDate={endDate}
        endDateId={endDateId}
        focusedInput={focusInput}
        onDatesChange={onChange}
        onFocusChange={(focus) => setFocusInput(focus)}
        startDate={startDate}
        startDateId={startDateId}
        minimumNights={0}
        numberOfMonths={1}
        showClearDates
        isOutsideRange={(date) => date.isAfter(new Date())}
        daySize={40}
        small={size === "small"}
        regular={size === "regular"}
        block
        displayFormat="DD/MM/yyyy"
        customCloseIcon={<CareIcon className="care-l-multiply" />}
      />
    </Box>
  );
};
