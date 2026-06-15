import Link from "next/link";
import { EvidenceTable } from "@/components/etf/EvidenceTable";
import { AppShell } from "@/components/shell/AppShell";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { TicketCard } from "@/components/workflow/TicketCard";
import { getEvidenceMap, getSnapshot } from "@/lib/data";
import { shortDateTime } from "@/lib/formatting";
import type { Status, WorkflowCheckpoint } from "@/lib/types";

export default function WorkflowPage() {
  const snapshot = getSnapshot();
  const evidenceById = getEvidenceMap(snapshot);
  const checkpointEvidence = Array.from(
    new Set(snapshot.workflow_checkpoints.flatMap((checkpoint) => checkpoint.evidence_ids))
  )
    .map((id) => evidenceById[id])
    .filter(Boolean);
  const counts = statusCounts(snapshot.workflow_checkpoints);

  return (
    <AppShell snapshot={snapshot}>
      <div className="space-y-4 p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Summary label="Open tickets" status={snapshot.tickets.some((ticket) => ticket.severity === "red") ? "red" : "yellow"} value={snapshot.tickets.length} />
          <Summary label="Red checkpoints" status="red" value={counts.red} />
          <Summary label="Review checkpoints" status="yellow" value={counts.yellow} />
          <Summary label="Data checkpoints" status="grey" value={counts.grey} />
        </div>

        <Panel>
          <PanelHeader>
            <PanelTitle>Operational Checkpoints</PanelTitle>
            <span className="text-xs text-zinc-500">Daily workflow support · {snapshot.as_of}</span>
          </PanelHeader>
          <PanelBody className="grid gap-3 xl:grid-cols-2">
            {snapshot.workflow_checkpoints.map((checkpoint) => (
              <CheckpointCard checkpoint={checkpoint} key={checkpoint.id} />
            ))}
          </PanelBody>
        </Panel>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <Panel className="min-w-0">
            <PanelHeader>
              <PanelTitle>Owner Queues</PanelTitle>
              <span className="text-xs text-zinc-500">Open ticket workload</span>
            </PanelHeader>
            <PanelBody className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-xs">
                  <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">Owner</th>
                      <th className="px-3 py-2 text-right font-medium">Open</th>
                      <th className="px-3 py-2 text-right font-medium">Red</th>
                      <th className="px-3 py-2 text-right font-medium">Yellow</th>
                      <th className="px-3 py-2 text-right font-medium">Grey</th>
                      <th className="px-3 py-2 font-medium">Next action</th>
                      <th className="px-3 py-2 font-medium">Evidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.workflow_queues.map((queue) => (
                      <tr className="border-b border-zinc-100" key={queue.owner}>
                        <td className="px-3 py-2 font-medium text-zinc-950">{queue.owner}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{queue.open_ticket_count}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{queue.red_count}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{queue.yellow_count}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{queue.grey_count}</td>
                        <td className="max-w-md px-3 py-2 text-zinc-600">{queue.next_action}</td>
                        <td className="px-3 py-2 text-zinc-500">{queue.evidence_ids.join(", ") || "NA"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelTitle>Workflow Tickets</PanelTitle>
              <Link className="text-xs font-medium text-zinc-700 hover:text-zinc-950" href="/rules">
                Rule board
              </Link>
            </PanelHeader>
            <PanelBody className="grid max-h-[560px] gap-3 overflow-y-auto md:grid-cols-2 xl:grid-cols-1">
              {snapshot.tickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </PanelBody>
          </Panel>
        </div>

        <Panel>
          <PanelHeader>
            <PanelTitle>Workflow Evidence</PanelTitle>
            <span className="text-xs text-zinc-500">{checkpointEvidence.length} linked records</span>
          </PanelHeader>
          <PanelBody className="p-0">
            <EvidenceTable evidence={checkpointEvidence} />
          </PanelBody>
        </Panel>
      </div>
    </AppShell>
  );
}

function statusCounts(checkpoints: WorkflowCheckpoint[]) {
  return {
    red: checkpoints.filter((checkpoint) => checkpoint.status === "red").length,
    yellow: checkpoints.filter((checkpoint) => checkpoint.status === "yellow").length,
    grey: checkpoints.filter((checkpoint) => checkpoint.status === "grey").length,
    green: checkpoints.filter((checkpoint) => checkpoint.status === "green").length
  };
}

function Summary({ label, value, status }: { label: string; value: number; status: Status }) {
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

function CheckpointCard({ checkpoint }: { checkpoint: WorkflowCheckpoint }) {
  return (
    <div className="border border-zinc-200 bg-zinc-50 p-3 text-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium text-zinc-950">{checkpoint.label}</div>
          <div className="mt-1 text-zinc-500">
            {checkpoint.owner} · {checkpoint.due_at ? shortDateTime(checkpoint.due_at) : "No cutoff"}
          </div>
        </div>
        <Badge status={checkpoint.status} />
      </div>
      <p className="mt-3 leading-5 text-zinc-700">{checkpoint.summary}</p>
      <p className="mt-2 leading-5 text-zinc-600">{checkpoint.action}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-zinc-500">
        <span>{checkpoint.related_ticket_ids.length} tickets</span>
        <span>{checkpoint.related_event_ids.length} events</span>
        <span>{checkpoint.evidence_ids.length} evidence IDs</span>
      </div>
    </div>
  );
}
