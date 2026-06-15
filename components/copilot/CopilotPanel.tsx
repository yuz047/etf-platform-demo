import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { EvidencePopover } from "@/components/etf/EvidencePopover";
import type { CopilotSummary, Evidence } from "@/lib/types";

export function CopilotPanel({ summary, evidence }: { summary: CopilotSummary | undefined; evidence: Evidence[] }) {
  if (!summary) {
    return null;
  }
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Deterministic Copilot</PanelTitle>
        <span className="text-xs text-zinc-500">{summary.label}</span>
      </PanelHeader>
      <PanelBody className="space-y-3">
        <p className="text-sm leading-6 text-zinc-800">{summary.summary}</p>
        <div className="grid gap-2 md:grid-cols-2">
          {summary.recommended_checks.map((check) => (
            <div className="border-l-2 border-zinc-300 pl-3 text-xs text-zinc-700" key={check}>
              {check}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {evidence.map((item) => (
            <EvidencePopover evidence={item} key={item.id} />
          ))}
        </div>
      </PanelBody>
    </Panel>
  );
}
