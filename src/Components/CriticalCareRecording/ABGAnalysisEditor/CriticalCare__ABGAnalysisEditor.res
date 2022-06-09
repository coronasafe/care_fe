open CriticalCare__Types
let str = React.string

@module("../CriticalCare__API")
external updateDailyRound: (string, string, Js.Json.t, _ => unit, _ => unit) => unit =
  "updateDailyRound"

let string_of_float = data => Belt.Option.mapWithDefault(data, "", Js.Float.toString)
let string_of_int = data => Belt.Option.mapWithDefault(data, "", Js.Int.toString)
let int_of_string = data => data->Belt.Int.fromString
let float_of_string = data => data->Belt.Float.fromString

type state = {
  po2: option<int>,
  pco2: option<int>,
  pH: option<float>,
  hco3: option<float>,
  baseExcess: option<int>,
  lactate: option<float>,
  sodium: option<float>,
  potassium: option<float>,
  dirty: bool,
  saving: bool,
}

type action =
  | SetPO2(option<int>)
  | SetPCO2(option<int>)
  | SetpH(option<float>)
  | SetHCO3(option<float>)
  | SetBaseExcess(option<int>)
  | SetLactate(option<float>)
  | SetSodium(option<float>)
  | SetPotassium(option<float>)
  | SetSaving
  | ClearSaving

let reducer = (state, action) => {
  switch action {
  | SetPO2(po2) => {...state, po2: po2, dirty: true}
  | SetPCO2(pco2) => {...state, pco2: pco2, dirty: true}
  | SetpH(pH) => {...state, pH: pH, dirty: true}
  | SetHCO3(hco3) => {...state, hco3: hco3, dirty: true}
  | SetBaseExcess(baseExcess) => {...state, baseExcess: baseExcess, dirty: true}
  | SetLactate(lactate) => {...state, lactate: lactate, dirty: true}
  | SetSodium(sodium) => {...state, sodium: sodium, dirty: true}
  | SetPotassium(potassium) => {...state, potassium: potassium, dirty: true}
  | SetSaving => {...state, saving: true}
  | ClearSaving => {...state, saving: false}
  }
}

let initialState = abg => {
  {
    po2: ABGAnalysis.po2(abg),
    pco2: ABGAnalysis.pco2(abg),
    pH: ABGAnalysis.pH(abg),
    hco3: ABGAnalysis.hco3(abg),
    baseExcess: ABGAnalysis.baseExcess(abg),
    lactate: ABGAnalysis.lactate(abg),
    sodium: ABGAnalysis.sodium(abg),
    potassium: ABGAnalysis.potassium(abg),
    saving: false,
    dirty: false,
  }
}

let makePayload = state => {
  let payload = Js.Dict.empty()
  DictUtils.setOptionalNumber("po2", state.po2, payload)
  DictUtils.setOptionalNumber("pco2", state.pco2, payload)
  DictUtils.setOptionalFloat("ph", state.pH, payload)
  DictUtils.setOptionalFloat("hco3", state.hco3, payload)
  DictUtils.setOptionalNumber("base_excess", state.baseExcess, payload)
  DictUtils.setOptionalFloat("lactate", state.lactate, payload)
  DictUtils.setOptionalFloat("sodium", state.sodium, payload)
  DictUtils.setOptionalFloat("potassium", state.potassium, payload)
  payload
}

let successCB = (send, updateCB, data) => {
  send(ClearSaving)
  updateCB(CriticalCare__DailyRound.makeFromJs(data))
}

let errorCB = (send, _error) => {
  send(ClearSaving)
}

let saveData = (id, consultationId, state, send, updateCB) => {
  send(SetSaving)
  updateDailyRound(
    consultationId,
    id,
    Js.Json.object_(makePayload(state)),
    successCB(send, updateCB),
    errorCB(send),
  )
}

let getStatus = (min, minText, max, maxText, val) => {
  if val >= min && val <= max {
    ("Normal", "#059669")
  } else if val < min {
    (minText, "#DC2626")
  } else {
    (maxText, "#DC2626")
  }
}

let isInvalidInputFloat = (minString, maxString, val) => {
  let min = Js.Float.fromString(minString)
  let max = Js.Float.fromString(maxString)
  let value = Js.Option.getWithDefault(min, val)
  if value < min || value > max {
    Some("Input outside range")
  } else {
    None
  }
}

let isInvalidInputInt = (min, max, val) => {
  let value = Js.Option.getWithDefault(min, val)
  if value < min || value > max {
    Some("Input outside range")
  } else {
    None
  }
}

@react.component
let make = (~arterialBloodGasAnalysis, ~updateCB, ~id, ~consultationId) => {
  let (state, send) = React.useReducer(reducer, initialState(arterialBloodGasAnalysis))

  <div>
    <CriticalCare__PageTitle title="Arterial Blood Gas Analysis" />
    <div className="my-4">
      <Slider
        title={"PO2 (mm Hg)"}
        start={"10"}
        end={"400"}
        interval={"50"}
        step={1.0}
        value={string_of_int(state.po2)}
        setValue={s => send(SetPO2(int_of_string(s)))}
        getLabel={getStatus(50.0, "Low", 200.0, "High")}
        hasError={isInvalidInputInt(10, 400, state.po2)}
      />
      <Slider
        title={"PCO2 (mm Hg)"}
        start={"10"}
        end={"200"}
        interval={"20"}
        step={1.0}
        value={string_of_int(state.pco2)}
        setValue={s => send(SetPCO2(int_of_string(s)))}
        getLabel={getStatus(35.0, "Low", 45.0, "High")}
        hasError={isInvalidInputInt(10, 200, state.pco2)}
      />
      <Slider
        title={"pH"}
        start={"0.00"}
        end={"10.00"}
        interval={"1.00"}
        step={0.01}
        value={string_of_float(state.pH)}
        setValue={s => send(SetpH(float_of_string(s)))}
        getLabel={getStatus(7.35, "Low", 7.45, "High")}
        hasError={isInvalidInputFloat("0.0", "10.0", state.pH)}
      />
      <Slider
        title={"HCO3 (mmol/L)"}
        start={"5"}
        end={"80"}
        interval={"5"}
        step={0.1}
        value={string_of_float(state.hco3)}
        setValue={s => send(SetHCO3(float_of_string(s)))}
        getLabel={getStatus(22.0, "Low", 26.0, "High")}
        hasError={isInvalidInputFloat("5.0", "80.0", state.hco3)}
      />
      <Slider
        title={"Base Excess (mmol/L)"}
        start={"-20"}
        end={"20"}
        interval={"5"}
        step={1.0}
        value={string_of_int(state.baseExcess)}
        setValue={s => send(SetBaseExcess(int_of_string(s)))}
        getLabel={getStatus(-2.0, "Low", 2.0, "High")}
        hasError={isInvalidInputInt(-20, 20, state.baseExcess)}
      />
      <Slider
        title={"Lactate (mmol/L)"}
        start={"0"}
        end={"20"}
        interval={"2"}
        step={0.1}
        value={string_of_float(state.lactate)}
        setValue={s => send(SetLactate(float_of_string(s)))}
        getLabel={getStatus(0.0, "Low", 2.0, "High")}
        hasError={isInvalidInputFloat("0.0", "20.0", state.lactate)}
      />
      <Slider
        title={"Sodium (mmol/L)"}
        start={"100"}
        end={"170"}
        interval={"10"}
        step={0.1}
        value={string_of_float(state.sodium)}
        setValue={s => send(SetSodium(float_of_string(s)))}
        getLabel={getStatus(135.0, "Low", 145.0, "High")}
        hasError={isInvalidInputFloat("100.0", "170.0", state.sodium)}
      />
      <Slider
        title={"Potassium (mmol/L)"}
        start={"1"}
        end={"10"}
        interval={"1"}
        step={0.1}
        value={string_of_float(state.potassium)}
        setValue={s => send(SetPotassium(float_of_string(s)))}
        getLabel={getStatus(3.5, "Low", 5.5, "High")}
        hasError={isInvalidInputFloat("1.0", "10.0", state.potassium)}
      />
    </div>
    <button
      disabled={state.saving || !state.dirty}
      className="btn btn-primary btn-large w-full"
      onClick={_ => saveData(id, consultationId, state, send, updateCB)}>
      {str("Update Details")}
    </button>
  </div>
}
