import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { TicketCard } from "@/components/workflow/TicketCard";
import type { Ticket } from "@/lib/types";

export function TicketQueue({ tickets }: { tickets: Ticket[] }) {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Ticket Queue</PanelTitle>
        <span className="text-xs text-zinc-500">{tickets.length} open</span>
      </PanelHeader>
      <PanelBody className="space-y-3">
        {tickets.slice(0, 5).map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}
      </PanelBody>
    </Panel>
  );
}
