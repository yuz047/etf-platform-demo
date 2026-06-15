import { Badge } from "@/components/ui/badge";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { AppShell } from "@/components/shell/AppShell";
import { getSnapshot } from "@/lib/data";

export default function EventsPage() {
  const snapshot = getSnapshot();
  return (
    <AppShell snapshot={snapshot}>
      <div className="space-y-4 p-4">
        <Panel>
          <PanelHeader>
            <PanelTitle>Event Inbox</PanelTitle>
            <span className="text-xs text-zinc-500">Event to ETF impact view</span>
          </PanelHeader>
          <PanelBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-xs">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Event</th>
                    <th className="px-3 py-2 font-medium">Entity</th>
                    <th className="px-3 py-2 font-medium">Impacted ETF</th>
                    <th className="px-3 py-2 text-right font-medium">Exposure</th>
                    <th className="px-3 py-2 font-medium">Rule Trigger</th>
                    <th className="px-3 py-2 font-medium">Suggested Workflow</th>
                    <th className="px-3 py-2 font-medium">Ticket Status</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.events.map((event) => (
                    <tr className="border-b border-zinc-100" key={event.id}>
                      <td className="px-3 py-2">
                        <div className="font-medium text-zinc-950">{event.title}</div>
                        <div className="mt-1 text-zinc-500">{event.event_type}</div>
                      </td>
                      <td className="px-3 py-2 text-zinc-600">{event.entity_name ?? "NA"}</td>
                      <td className="px-3 py-2 text-zinc-600">{event.impacted_tickers.join(", ")}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{event.exposure_pct ?? "NA"}</td>
                      <td className="px-3 py-2">
                        <Badge status={event.severity}>{event.rule_ids.join(", ") || "watch"}</Badge>
                      </td>
                      <td className="max-w-md px-3 py-2 text-zinc-600">{event.suggested_workflow}</td>
                      <td className="px-3 py-2 text-zinc-600">{event.ticket_ids.length ? event.ticket_ids.join(", ") : "No ticket"}</td>
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
