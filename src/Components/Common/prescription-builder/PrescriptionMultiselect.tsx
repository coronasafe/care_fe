import { useEffect, useRef, useState } from "react";
import { classNames } from "../../../Utils/utils";

export function PrescriptionMultiDropdown(props: {
  options: string[];
  selectedValues: string[];
  setSelectedValues: (value: any) => void;
  placeholder?: string;
  type?: "string" | "number";
  min?: number;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const { options, selectedValues, setSelectedValues } = props;
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  function useOutsideAlerter(ref: any) {
    useEffect(() => {
      function handleClickOutside(event: any) {
        if (ref.current && !ref.current.contains(event.target)) {
          setOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [ref]);
  }

  const dropRef = useRef(null);
  useOutsideAlerter(dropRef);

  return (
    <div className="w-full relative">
      <div className="flex gap-1 flex-wrap my-2">
        {selectedValues.length > 0 &&
          selectedValues.map((selectedValue, i) => {
            return (
              <div
                key={i}
                className="inline-flex bg-primary-100 border border-primary-600 text-primary-900 rounded-lg gap-2 py-1 px-3"
              >
                {selectedValue}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedValues(
                      selectedValues.filter((v) => v !== selectedValue)
                    );
                  }}
                >
                  <i className="fas fa-times" />
                </button>
              </div>
            );
          })}
      </div>

      <input
        placeholder={props.placeholder}
        className="cui-input-base py-2"
        onClick={() => setOpen(!open)}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
      />
      <div
        ref={dropRef}
        className={classNames(
          "absolute z-40 top-[calc(100%+10px)] left-0 w-full rounded-md shadow-lg bg-white max-h-[300px] overflow-auto",
          !open && "hidden"
        )}
      >
        {options
          .filter((o) => o.toLowerCase().includes(value.toLowerCase()))
          .map((option, i) => {
            return (
              <button
                type="button"
                key={i}
                className={classNames(
                  "w-full block px-4 py-2 text-sm leading-5 text-left text-gray-700 hover:text-gray-900 focus:outline-none focus:text-gray-900",
                  selectedValues.includes(option)
                    ? "bg-primary-100 hover:bg-primary-200"
                    : "hover:bg-gray-100 focus:bg-gray-100"
                )}
                onClick={() => {
                  setSelectedValues(
                    selectedValues.includes(option)
                      ? selectedValues.filter((v) => v !== option)
                      : [...selectedValues, option]
                  );
                }}
              >
                {option}
              </button>
            );
          })}
      </div>
    </div>
  );
}
