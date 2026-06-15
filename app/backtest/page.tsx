import { Badge } from "@/components/ui/badge";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { AppShell } from "@/components/shell/AppShell";
import { getSnapshot } from "@/lib/data";

export default function BacktestPage() {
  const snapshot = getSnapshot();
  const total = snapshot.backtests.reduce((sum, item) => sum + item.trigger_count, 0);
  const red = snapshot.backtests.reduce((sum, item) => sum + item.red_count, 0);
  const yellow = snapshot.backtests.reduce((sum, item) => sum + item.yellow_count, 0);
  const grey = snapshot.backtests.reduce((sum, item) => sum + item.grey_count, 0);
  return (
    <AppShell snapshot={snapshot}>
      <div className="space-y-4 p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Summary label="Trigger count" status="blue" value={total} />
          <Summary label="Red" status="red" value={red} />
          <Summary label="Yellow" status="yellow" value={yellow} />
          <Summary label="Grey" status="grey" value={grey} />
        </div>
        <Panel>
          <PanelHeader>
            <PanelTitle>Rule Replay Summary</PanelTitle>
            <span className="text-xs text-zinc-500">Precomputed from latest.json.backtests</span>
          </PanelHeader>
          <PanelBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-xs">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">ETF</th>
                    <th className="px-3 py-2 font-medium">Rule</th>
                    <th className="px-3 py-2 font-medium">Window</th>
                    <th className="px-3 py-2 text-right font-medium">Triggers</th>
                    <th className="px-3 py-2 text-right font-medium">Red</th>
                    <th className="px-3 py-2 text-right font-medium">Yellow</th>
                    <th className="px-3 py-2 text-right font-medium">Grey</th>
                    <th className="px-3 py-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.backtests.map((item) => (
                    <tr className="border-b border-zinc-100" key={`${item.ticker}-${item.rule_id}`}>
                      <td className="px-3 py-2 font-medium">{item.ticker}</td>
                      <td className="px-3 py-2 text-zinc-600">{item.rule_id}</td>
                      <td className="px-3 py-2 text-zinc-600">
                        {item.start_date} to {item.end_date}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{item.trigger_count}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{item.red_count}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{item.yellow_count}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{item.grey_count}</td>
                      <td className="max-w-sm px-3 py-2 text-zinc-600">{item.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PanelBody>
        </Panel>
      </div>
    </AppShell>
  );
}

function Summary({ label, value, status }: { label: string; value: number; status: "red" | "yellow" | "grey" | "blue" }) {
  return (
    <Panel>
      <PanelBody className="flex items-center justify-between gap-3 p-3">
        <div>
          <div className="text-xs text-zinc-500">{label}</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
        </div>
        <Badge status={status} />
      </PanelBody>
    </Panel>
  );
}
