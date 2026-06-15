import { Badge } from "@/components/ui/badge";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import type { EventItem } from "@/lib/types";

export function EventInboxPreview({ events }: { events: EventItem[] }) {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Event Inbox</PanelTitle>
        <span className="text-xs text-zinc-500">{events.length} events</span>
      </PanelHeader>
      <PanelBody className="space-y-3">
        {events.map((event) => (
          <div className="border-b border-zinc-100 pb-3 last:border-0 last:pb-0" key={event.id}>
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium text-zinc-950">{event.title}</div>
              <Badge status={event.severity} />
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              {event.event_type} · {event.impacted_tickers.join(", ")} · {event.evidence_ids.join(", ")}
            </div>
          </div>
        ))}
      </PanelBody>
    </Panel>
  );
}
