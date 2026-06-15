import { Badge } from "@/components/ui/badge";
import { Panel, PanelBody } from "@/components/ui/panel";
import { getSourceSummary } from "@/lib/source";
import type { Snapshot } from "@/lib/types";

export function SourceModeBanner({ snapshot }: { snapshot: Snapshot }) {
  const source = getSourceSummary(snapshot);
  const primaryWarning = snapshot.source_warnings[0];

  return (
    <Panel>
      <PanelBody className="flex flex-wrap items-center justify-between gap-3 p-3 text-xs">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge status={source.status}>{source.label}</Badge>
          <span className="font-medium text-zinc-900">{source.detail}</span>
          <span className="text-zinc-500">{source.redistribution}</span>
        </div>
        {primaryWarning ? <span className="max-w-2xl truncate text-zinc-600">{primaryWarning}</span> : null}
      </PanelBody>
    </Panel>
  );
}
