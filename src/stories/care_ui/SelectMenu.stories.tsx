import { StoryFn } from "@storybook/react";
import { useState } from "react";
import { GENDER_TYPES } from "../../Common/constants";
import SelectMenuV2 from "../../Components/Form/SelectMenuV2";

export default {
  title: "CARE UI / Select",
  component: SelectMenuV2,
};

const Template: StoryFn<typeof SelectMenuV2> = (args) => {
  const [state, setState] = useState<any>(undefined);

  return (
    <SelectMenuV2
      {...args}
      value={state}
      onChange={(option) => setState(option)}
    />
  );
};

export const SelectMenu = Template.bind({});
SelectMenu.args = {
  placeholder: "Show all",
  className: "w-72",
  options: GENDER_TYPES,
  optionLabel: (option: any) => option.text,
  optionIcon: (option: any) => <i className="text-base">{option.icon}</i>,
  optionValue: (option: any) => option.id,
};
