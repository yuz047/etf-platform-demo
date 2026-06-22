import { Panel, PanelBody } from "@/components/ui/panel";

export function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Panel>
      <PanelBody className="p-3">
        <div className="break-words text-xs leading-4 text-zinc-500">{label}</div>
        <div className="mt-1 break-words text-base font-semibold tabular-nums text-zinc-950">{value}</div>
      </PanelBody>
    </Panel>
  );
}
