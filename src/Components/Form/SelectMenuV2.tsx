import React from "react";
import { Listbox } from "@headlessui/react";
import { DropdownTransition } from "../Common/components/HelperComponents";
import CareIcon from "../../CAREUI/icons/CareIcon";

type OptionCallback<T, R> = (option: T) => R;

type SelectMenuProps<T, V = T> = {
  id?: string;
  options: T[];
  disabled?: boolean | undefined;
  value: V | undefined;
  placeholder?: React.ReactNode;
  optionLabel: OptionCallback<T, React.ReactNode>;
  optionSelectedLabel?: OptionCallback<T, React.ReactNode>;
  optionDescription?: OptionCallback<T, React.ReactNode>;
  optionIcon?: OptionCallback<T, React.ReactNode>;
  optionValue?: OptionCallback<T, V>;
  showIconWhenSelected?: boolean;
  showChevronIcon?: boolean;
  className?: string;
} & (
  | {
      required?: false;
      onChange: OptionCallback<V | undefined, void>;
    }
  | {
      required: true;
      onChange: OptionCallback<V, void>;
    }
);

const SelectMenuV2 = <T, V>(props: SelectMenuProps<T, V>) => {
  const valueOptions = props.options.map((option) => {
    const label = props.optionLabel(option);
    return {
      label,
      selectedLabel: props.optionSelectedLabel
        ? props.optionSelectedLabel(option)
        : label,
      description: props.optionDescription && props.optionDescription(option),
      icon: props.optionIcon && props.optionIcon(option),
      value: props.optionValue ? props.optionValue(option) : option,
    };
  });

  const showChevronIcon = props.showChevronIcon ?? true;

  const placeholder = props.placeholder ?? "Select";
  const defaultOption = {
    label: placeholder,
    selectedLabel: (
      <p className="font-normal text-secondary-500">{placeholder}</p>
    ),
    description: undefined,
    icon: undefined,
    value: undefined,
  };

  const options = props.required
    ? valueOptions
    : [defaultOption, ...valueOptions];

  const value = options.find((o) => props.value == o.value) || defaultOption;

  return (
    <div className={props.className}>
      <Listbox
        disabled={props.disabled}
        value={value}
        onChange={(selection: any) => props.onChange(selection.value)}
      >
        {({ open }) => (
          <>
            <Listbox.Label className="sr-only !relative">
              {props.placeholder}
            </Listbox.Label>
            <div className="relative">
              <Listbox.Button className="w-full flex rounded bg-white disabled:bg-secondary-100 border border-secondary-300 focus:border-primary-400 outline-none ring-0 focus:ring-1 ring-primary-400 transition-all duration-200 ease-in-out">
                <div className="relative z-0 flex items-center w-full">
                  <div className="relative flex-1 flex items-center py-3 pl-3 pr-4 focus:z-10">
                    {props.showIconWhenSelected && value?.icon && (
                      <div className="ml-2 text-sm text-gray-700">
                        {value.icon}
                      </div>
                    )}
                    <p className="ml-2.5 text-sm font-medium">
                      {value.selectedLabel}
                    </p>
                  </div>
                  {showChevronIcon && (
                    <CareIcon className="-mb-0.5 mr-2 care-l-angle-down text-lg text-secondary-900" />
                  )}
                </div>
              </Listbox.Button>
              <DropdownTransition show={open}>
                <Listbox.Options className="origin-top-right absolute z-10 mt-0.5 w-full rounded-md xl:rounded-lg shadow-lg overflow-auto max-h-96 bg-gray-100 divide-y divide-gray-300 ring-1 ring-gray-400 focus:outline-none">
                  {options.map((option, index) => (
                    <Listbox.Option
                      id={`${props.id}-option-${option.value}`}
                      key={index}
                      className={({ active }) =>
                        `cursor-default select-none relative p-4 text-sm transition-all duration-100 ease-in-out ${
                          active ? "text-white bg-primary-500" : "text-gray-900"
                        }`
                      }
                      value={option}
                    >
                      {({ selected, active }) => (
                        <div className="flex flex-col">
                          <div className="flex justify-between">
                            <p className={selected ? "font-semibold" : ""}>
                              {option.label}
                            </p>
                            {option.icon && (
                              <span
                                className={`transition-all duration-100 ease-in-out ${
                                  active ? "text-white" : "text-primary-500"
                                }`}
                              >
                                {option.icon}
                              </span>
                            )}
                          </div>
                          {option.description && (
                            <p
                              className={`mt-2 ${
                                active
                                  ? "text-primary-200"
                                  : "text-secondary-500"
                              }`}
                            >
                              {option.description}
                            </p>
                          )}
                        </div>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </DropdownTransition>
            </div>
          </>
        )}
      </Listbox>
    </div>
  );
};

export default SelectMenuV2;
