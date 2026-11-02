import { getTimingIssues } from "../lib/crafting";
import { formatDuration, formatNumber } from "../lib/format";
import type { CalculationResult, CalculatorInput } from "../types/calculator";

type Props = { input: CalculatorInput; result: CalculationResult };

export const ConsumableResults = ({ input, result }: Props) => (
  <section className="resource-results consumable-results" aria-label="XP consumables">
    <div className="resource-result-heading">
      <h3>Party XP consumables</h3>
    </div>
    {result.timing ? (
      <>
        {result.timing.consumables.length ? (
          <table className="consumable-table">
            <caption>Full buff coverage until the target level</caption>
            <thead>
              <tr>
                <th scope="col">Consumable</th>
                <th scope="col">Per player</th>
                <th scope="col">Party total</th>
              </tr>
            </thead>
            <tbody>
              {result.timing.consumables.map((consumable) => (
                <tr key={consumable.id}>
                  <th scope="row">
                    {consumable.label}
                    <small>{formatDuration(consumable.durationSeconds)} per dose</small>
                  </th>
                  <td>{formatNumber(consumable.perPlayer)}</td>
                  <td>{formatNumber(consumable.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="crafting-help">
            Select Golden Hesperornis Egg, Broth of Enlightenment, or EXP Cake Slice to include
            supplies.
          </p>
        )}
        <p className="crafting-help">
          Reapply selected boosts throughout. Supplies include the first dose and renewals, rounded
          up per player until the party finishes.
        </p>
      </>
    ) : (
      <p className="crafting-help">{getTimingIssues(input).join(" ")}</p>
    )}
  </section>
);
