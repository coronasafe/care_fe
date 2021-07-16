let str = React.string
open CriticalCare__Types

let handleSubmit = (handleDone, state: VentilatorParameters.t) => {
  let status = VentilatorParameters.showStatus(state)
  handleDone(state, status)
}

let reducer = (state, action) => {
  switch action {
  | VentilatorParameters.SetVentilationInterface(ventilationInterface) => {
      ...state,
      VentilatorParameters.ventilationInterface: ventilationInterface,
    }

  | SetIv(iv) => {
      ...state,
      VentilatorParameters.iv: iv,
    }
  | SetNiv(niv) => {
      ...state,
      VentilatorParameters.niv: niv,
    }
  | SetNone(none) => {
      ...state,
      VentilatorParameters.none: none,
    }

  | SetIvSubOptions(iv) => {
      ...state,
      iv: iv,
    }

  | SetNivSubOptions(niv) => {
      ...state,
      niv: niv,
    }
  | _ => state
  }
}

let ventilationInterfaceOptions: array<Options.t> = [
  {
    label: "Invasive (IV)",
    value: "iv",
    name: "ventilationInterface",
  },
  {
    label: "Non-Invasive (NIV)",
    value: "niv",
    name: "ventilationInterface",
  },
  {
    label: "None",
    value: "none",
    name: "ventilationInterface",
  },
]

@react.component
let make = (~initialState, ~handleDone) => {
  let (state, send) = React.useReducer(
    reducer,
    (initialState: CriticalCare__VentilatorParameters.t),
  )

  let editor = switch state.VentilatorParameters.ventilationInterface {
  | "iv" => <CriticalCare__VentilatorParametersEditor__Invasive state={state.iv} send />
  | "niv" => <CriticalCare__VentilatorParametersEditor__NonInvasive state={state.niv} send />
  | "none" => <CriticalCare__VentilatorParametersEditor__None state={state.none} send />
  | _ => <CriticalCare__VentilatorParametersEditor__Invasive state={state.iv} send />
  }
  // Js.log({state})
  <div>
    <CriticalCare__PageTitle title="Ventilator Parameters" />
    <div className="py-6">
      <div className="mb-6">
        <h4> {str("Ventilation Interface")} </h4>
        <div>
          <div className="flex items-center py-4 mb-4">
            <CriticalCare__RadioButton
              defaultChecked={state.VentilatorParameters.ventilationInterface}
              onChange={e => send(SetVentilationInterface(ReactEvent.Form.target(e)["id"]))}
              options={ventilationInterfaceOptions}
              ishorizontal={true}
            />
            //   {ventilationInterfaceOptions
            //   |> Array.map(option => {
            //     <div key={option["value"]} className="mr-4">
            //       <label onClick={_ => send(SetVentilationInterface(option["value"]))}>
            //         <input
            //           className="mr-2"
            //           type_="radio"
            //           name="ventilationInterface"
            //           value={option["value"]}
            //           id={option["value"]}
            //           checked={option["value"] === state.VentilatorParameters.ventilationInterface}
            //         />
            //         {str({option["name"]})}
            //       </label>
            //     </div>
            //   })
            //   |> React.array}
          </div>
          {editor}
        </div>
      </div>
      <button
        onClick={_ => handleSubmit(handleDone, state)}
        className="flex w-full bg-primary-600 text-white p-2 text-lg hover:bg-primary-800 justify-center items-center rounded-md">
        {str("Update Details")}
      </button>
    </div>
  </div>
}
