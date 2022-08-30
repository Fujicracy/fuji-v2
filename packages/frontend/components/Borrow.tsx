import borrowMachine from "../machines/borrow.machine"
import { useMachine } from "@xstate/react"

export default function Borrow() {
  const [current, send] = useMachine(borrowMachine, { devTools: true })
  console.log(current)

  return (
    <>
      <p>
        Current state: <code>{current.value as string}</code>
      </p>
      {current.matches("initial") && (
        <button onClick={() => send("initialize")}>Initialize</button>
      )}

      {current.matches("editing") && (
        <div>
          Collateral from
          <select>
            <option>Arbitrum</option>
            <option>Optimism</option>
          </select>
          <input
            id="collateralAmount"
            type="number"
            onChange={evt =>
              send({
                type: "changeCollateralAmount",
                value: evt.target.value,
              })
            }
            value={current.context.collateralAmount}
          />
          <select>
            <option>ETH</option>
            <option>USDC</option>
          </select>
          <br />
          Value: <strong>{current.context.collateralTotalValue}$</strong>-
          Balance: <strong>{current.context.collateralBalance}</strong>{" "}
          <button
            onClick={() =>
              send({
                type: "changeCollateralAmount",
                value: current.context.collateralBalance,
              })
            }
          >
            max
          </button>
          <br />
          <br />
          Borrow on
          <select>
            <option>Arbitrum</option>
            <option>Optimism</option>
          </select>
          <input id="borrowAmount" />
          <select>
            <option>ETH</option>
            <option>USDC</option>
          </select>
        </div>
      )}
    </>
  )
}
