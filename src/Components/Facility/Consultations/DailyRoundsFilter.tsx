import { Popover, Transition } from "@headlessui/react";
import ButtonV2 from "../../Common/components/ButtonV2";
import { Fragment } from "react";
import { SelectFormField } from "../../Form/FormFields/SelectFormField";
import TextFormField from "../../Form/FormFields/TextFormField";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import dayjs from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DailyRoundsModel } from "../../Patient/models";
import { FieldChangeEvent } from "../../Form/FormFields/Utils";

type FilterState = {
  rounds_type?: DailyRoundsModel["rounds_type"];
  taken_at_after?: string;
  taken_at_before?: string;
};

interface Props {
  onApply: (filter: FilterState) => void;
}

const roundTypeOptions = [
  {
    id: "NORMAL",
    text: "Normal",
  },
  {
    id: "VENTILATOR",
    text: "Critical Care",
  },
  {
    id: "ICU",
    text: "ICU",
  },
  {
    id: "AUTOMATED",
    text: "Automated",
  },
];

export default function DailyRoundsFilter(props: Props) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterState>({});

  const field = (name: keyof FilterState) => ({
    name,
    value: filter[name],
    onChange: (e: FieldChangeEvent<unknown>) =>
      setFilter({ ...filter, [e.name]: e.value }),
    labelClassName: "text-sm",
    errorClassName: "hidden",
  });

  return (
    <div className="flex flex-row-reverse items-center gap-4 md:flex-row">
      <Popover className="relative ">
        <Popover.Button>
          <ButtonV2 variant="secondary" className="mr-5 border">
            <CareIcon className="care-l-filter" />
            Filter
          </ButtonV2>
        </Popover.Button>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <Popover.Panel className="absolute right-0 z-30 mt-1 w-80 px-4 sm:px-0 md:w-96 lg:max-w-3xl">
            <div className="rounded-lg shadow-lg ring-1 ring-gray-400">
              <div className="rounded-t-lg bg-gray-100 px-6 py-4">
                <div className="flow-root rounded-md">
                  <span className="block text-sm text-gray-800">Filter by</span>
                </div>
              </div>
              <div className="relative flex flex-col gap-4 rounded-b-lg bg-white p-6">
                <SelectFormField
                  {...field("rounds_type")}
                  label={t("Round Type")}
                  options={roundTypeOptions}
                  placeholder={"Show all"}
                  optionLabel={(o) => o.text}
                  optionValue={(o) => o.id}
                />
                <TextFormField
                  {...field("taken_at_after")}
                  label="Measured after"
                  type="datetime-local"
                  max={dayjs().format("YYYY-MM-DDTHH:mm")}
                />
                <TextFormField
                  {...field("taken_at_before")}
                  label="Measured before"
                  type="datetime-local"
                  max={dayjs().format("YYYY-MM-DDTHH:mm")}
                />

                <Popover.Button>
                  <ButtonV2
                    variant="secondary"
                    onClick={() => {
                      setFilter({});
                      props.onApply({});
                    }}
                    border
                    className="w-full"
                  >
                    Clear Filter
                  </ButtonV2>
                </Popover.Button>
                <Popover.Button>
                  <ButtonV2
                    variant="primary"
                    onClick={() => props.onApply(filter)}
                    border
                    className="w-full"
                  >
                    Apply Filter
                  </ButtonV2>
                </Popover.Button>
              </div>
            </div>
          </Popover.Panel>
        </Transition>
      </Popover>
    </div>
  );
}
