import { FormFieldBaseProps, useFormFieldPropsResolver } from "./Utils";
import React, { HTMLInputTypeAttribute, useState } from "react";

import CareIcon from "../../../CAREUI/icons/CareIcon";
import FormField from "./FormField";
import { classNames } from "../../../Utils/utils";

export type TextFormFieldProps = FormFieldBaseProps<string> & {
  placeholder?: string;
  value?: string | number;
  autoComplete?: string;
  type?: HTMLInputTypeAttribute;
  className?: string | undefined;
  inputClassName?: string | undefined;
  removeDefaultClasses?: true | undefined;
  leading?: React.ReactNode | undefined;
  trailing?: React.ReactNode | undefined;
  leadingFocused?: React.ReactNode | undefined;
  trailingFocused?: React.ReactNode | undefined;
  trailingPadding?: string | undefined;
  leadingPadding?: string | undefined;
  min?: string | number;
  max?: string | number;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
};

const TextFormField = React.forwardRef((props: TextFormFieldProps, ref) => {
  const field = useFormFieldPropsResolver(props as any);
  const { leading, trailing } = props;
  const leadingFocused = props.leadingFocused || props.leading;
  const trailingFocused = props.trailingFocused || props.trailing;
  const hasLeading = !!(leading || leadingFocused);
  const hasTrailing = !!(trailing || trailingFocused);
  const hasIcon = hasLeading || hasTrailing;
  const [showPassword, setShowPassword] = useState(false);

  const getPasswordFieldType = () => {
    return showPassword ? "text" : "password";
  };

  let child = (
    <input
      ref={ref as any}
      id={field.id}
      className={classNames(
        "cui-input-base peer",
        hasLeading && (props.leadingPadding || "pl-10"),
        hasTrailing && (props.trailingPadding || "pr-10"),
        field.error && "border-danger-500",
        field.className
      )}
      disabled={field.disabled}
      type={props.type === "password" ? getPasswordFieldType() : props.type}
      placeholder={props.placeholder}
      name={field.name}
      value={field.value}
      min={props.min}
      max={props.max}
      autoComplete={props.autoComplete}
      required={field.required}
      onFocus={props.onFocus}
      onBlur={props.onBlur}
      onChange={(e) => field.handleChange(e.target.value)}
    />
  );

  if (props.type === "password") {
    child = (
      <div className="relative">
        {child}
        <button
          type="button"
          className="absolute right-0 top-0 h-full flex items-center px-3 z-5 text-xl"
          onClick={() => setShowPassword(!showPassword)}
        >
          <CareIcon className={`care-l-eye${showPassword ? "" : "-slash"}`} />
        </button>
      </div>
    );
  }

  if (hasIcon) {
    const _leading =
      leading === leadingFocused ? (
        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
          {leading}
        </div>
      ) : (
        <>
          <div className="opacity-100 peer-focus:opacity-0 translate-y-0 peer-focus:translate-y-1 absolute inset-y-0 left-0 flex items-center pl-3 transition-all duration-500 delay-300 ease-in-out">
            {leading}
          </div>
          <div className="opacity-0 peer-focus:opacity-100 -translate-y-1 peer-focus:translate-y-0 absolute inset-y-0 left-0 flex items-center pl-3 transition-all duration-500 delay-300 ease-in-out">
            {leadingFocused}
          </div>
        </>
      );
    const _trailing =
      trailing === trailingFocused ? (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {trailing}
        </div>
      ) : (
        <>
          <div className="opacity-100 peer-focus:opacity-0 translate-y-0 peer-focus:translate-y-1 absolute inset-y-0 right-0 flex items-center pr-3 transition-all duration-500 delay-300 ease-in-out">
            {trailing}
          </div>
          <div className="opacity-0 peer-focus:opacity-100 -translate-y-1 peer-focus:translate-y-0 absolute inset-y-0 right-0 flex items-center pr-3 transition-all duration-500 delay-300 ease-in-out">
            {trailingFocused}
          </div>
        </>
      );

    child = (
      <div className="relative">
        {(leading || leadingFocused) && _leading}
        {child}
        {(trailing || trailingFocused) && _trailing}
      </div>
    );
  }

  return <FormField field={field}>{child}</FormField>;
});

export default TextFormField;
