open CriticalCare__Types

let str = React.string

let findAndReplace = (index, f, array) =>
  Js.Array.mapi((item, i) => i == index ? f(item) : item, array)

type action =
  | UpdateField(string, int)
  | UpdateValue(float, int)
  | UpdateValueWithConcentration(float, string, int)
  | DeleteUnit(int)
  | AddUnit

let concentrations = ["mcg", "ng"]

let computeConversion = (concentration, value) => {
  switch concentration {
  | "mcg" => value *. 0.001
  | "ng" => value *. 0.001 *. 0.001
  | _ => value
  }
}
let reducer = (state, action) => {
  switch action {
  | UpdateField(field, index) => findAndReplace(index, IOBalance.updateName(field), state)
  | UpdateValue(value, index) => findAndReplace(index, IOBalance.updateQuantity(value), state)
  | UpdateValueWithConcentration(value, concentration, index) =>
    let newValue = computeConversion(concentration, value)
    findAndReplace(index, IOBalance.updateQuantity(newValue), state)
  | AddUnit => Js.Array.concat([IOBalance.makeDefaultItem()], state)
  | DeleteUnit(index) => Js.Array.filteri((_, i) => i != index, state)
  }
}

let showUnit = (name, item, params, index, send) => {
  <div className="flex justify-between items-center" key={index->string_of_int}>
    <div
      onClick={_ => index->DeleteUnit->send}
      className="appearance-none block border border-gray-400 rounded p-2 text-xs bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white focus:border-gray-600 text-gray-600 font-bold">
      {"x"->str}
    </div>
    <div className="m-1 rounded-md shadow-sm w-4/6">
      <IOBalance__UnitPicker
        id={"field" ++ index->string_of_int}
        value={IOBalance.name(item)}
        updateCB={field => UpdateField(field, index)->send}
        placeholder={"Add" ++ name}
        selectables=params
      />
    </div>
    <div className="m-1 rounded-md shadow-sm w-2/6">
      <input
        id={"value" ++ index->string_of_int}
        className="appearance-none h-10 mt-1 block w-full border border-gray-400 rounded py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white focus:border-gray-600"
        placeholder="Value"
        onChange={e =>
          UpdateValue(ReactEvent.Form.target(e)["value"]->Js.Float.fromString, index)->send}
        value={IOBalance.quantity(item)->Belt.Float.toString}
        type_="number"
        required=true
      />
    </div>
    {if name === "Infusions" {
      <div className="rounded-md shadow-sm w-1/6">
        <IOBalance__UnitPicker
          id={"concentration" ++ index->string_of_int}
          value={""}
          updateCB={concentration =>
            UpdateValueWithConcentration(IOBalance.quantity(item), concentration, index)->send}
          placeholder={"Select Unit"}
          selectables=concentrations
        />
        <div className="text-xl font-bold text-gray-800">
          {str(IOBalance.quantity(item)->Belt.Float.toString ++ " mg")}
        </div>
      </div>
    } else {
      <div />
    }}
  </div>
}

@react.component
let make = (~name, ~items, ~collection, ~updateCB) => {
  let send = action => reducer(items, action)->updateCB
  let selectables = Js.Array.filter(
    p => Belt.Option.isNone(Js.Array.find(f => p === IOBalance.name(f), items)),
    collection,
  )
  <div className="px-2 py-5 sm:px-4 max-w-5xl  mt-4">
    <h3 className={name === "" ? "hidden" : "text-lg leading-6 font-medium text-gray-900"}>
      {name->str}
    </h3>
    <div className="flex justify-between mt-4">
      <div className="m-1 rounded-md shadow-sm w-7/12">
        <label htmlFor="Field" className="block text-sm font-medium leading-5 text-gray-700">
          {"Field"->str}
        </label>
      </div>
      <div className="m-1 rounded-md shadow-sm w-2/12">
        <label htmlFor="Value" className="block text-sm font-medium leading-5 text-gray-700">
          {"Value"->str}
        </label>
      </div>
      {if name === "Infusions" {
        <div className="m-1 rounded-md shadow-sm w-1/12">
          <label
            htmlFor="Concentration" className="block text-sm font-medium leading-5 text-gray-700">
            {"Concentration"->str}
          </label>
        </div>
      } else {
        <div />
      }}
    </div>
    {Js.Array.mapi(
      (item, index) => showUnit(name, item, selectables, index, send),
      items,
    )->React.array}
    <div className={"m-1 rounded-md shadow-sm bg-gray-200"}>
      <button
        type_="button"
        onClick={_ => AddUnit->send}
        className="w-full font-bold block px-4 py-2 text-sm leading-5 text-left text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900">
        {"+ Add a field"->str}
      </button>
    </div>
  </div>
}
