import { Badge } from "@/components/ui/badge";
import { formatOwner } from "@/lib/formatting";
import type { Ticket } from "@/lib/types";

export function TicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <div className="border border-zinc-200 bg-zinc-50 p-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-zinc-950">{ticket.title}</span>
        <Badge status={ticket.severity}>{ticket.status}</Badge>
      </div>
      <p className="mt-2 leading-5 text-zinc-600">{ticket.suggested_action}</p>
      <div className="mt-2 text-zinc-500">
        {formatOwner(ticket.owner)} · {ticket.due_at ?? "No due time"} · {ticket.evidence_ids.join(", ")}
      </div>
    </div>
  );
}
