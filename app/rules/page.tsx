import { Badge } from "@/components/ui/badge";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { AppShell } from "@/components/shell/AppShell";
import { TicketCard } from "@/components/workflow/TicketCard";
import { getSnapshot } from "@/lib/data";
import { formatOwner } from "@/lib/formatting";

export default function RulesPage() {
  const snapshot = getSnapshot();
  return (
    <AppShell snapshot={snapshot}>
      <div className="grid min-w-0 gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Panel className="min-w-0">
          <PanelHeader>
            <PanelTitle>Rule Catalog</PanelTitle>
            <span className="text-xs text-zinc-500">Loaded from rules/rules.yml</span>
          </PanelHeader>
          <PanelBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Rule</th>
                    <th className="px-3 py-2 font-medium">Owner</th>
                    <th className="px-3 py-2 font-medium">Metric</th>
                    <th className="px-3 py-2 font-medium">Condition</th>
                    <th className="px-3 py-2 text-right font-medium">Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.rule_catalog.map((rule) => (
                    <tr className="border-b border-zinc-100" key={rule.id}>
                      <td className="px-3 py-2">
                        <div className="font-medium text-zinc-950">{rule.id}</div>
                        <div className="mt-1 text-zinc-500">{rule.label}</div>
                      </td>
                      <td className="px-3 py-2">
                        <Badge status={rule.severity}>{formatOwner(rule.owner)}</Badge>
                      </td>
                      <td className="px-3 py-2 text-zinc-600">{rule.metric}</td>
                      <td className="px-3 py-2 text-zinc-600">{rule.condition}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{rule.threshold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PanelBody>
        </Panel>
        <div className="min-w-0 space-y-4">
          <Panel className="min-w-0">
            <PanelHeader>
              <PanelTitle>Current Breaches</PanelTitle>
              <span className="text-xs text-zinc-500">{snapshot.rule_breaches.length} open</span>
            </PanelHeader>
            <PanelBody className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-xs">
                  <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">ETF</th>
                      <th className="px-3 py-2 font-medium">Rule</th>
                      <th className="px-3 py-2 text-right font-medium">Value</th>
                      <th className="px-3 py-2 font-medium">Owner</th>
                      <th className="px-3 py-2 font-medium">Evidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.rule_breaches.map((breach) => (
                      <tr className="border-b border-zinc-100" key={breach.id}>
                        <td className="px-3 py-2 font-medium">{breach.ticker}</td>
                        <td className="px-3 py-2 text-zinc-600">{breach.rule_id}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{breach.metric_value}</td>
                        <td className="px-3 py-2">
                          <Badge status={breach.severity}>{formatOwner(breach.owner)}</Badge>
                        </td>
                        <td className="px-3 py-2 text-zinc-600">{breach.evidence_ids.join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PanelBody>
          </Panel>
          <Panel>
            <PanelHeader>
              <PanelTitle>Ticket Board</PanelTitle>
              <span className="text-xs text-zinc-500">Owner and SLA placeholder</span>
            </PanelHeader>
            <PanelBody className="grid gap-3 md:grid-cols-2">
              {snapshot.tickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </PanelBody>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
