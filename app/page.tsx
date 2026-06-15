import { ControlTowerClient } from "@/components/control-tower/ControlTowerClient";
import { AppShell } from "@/components/shell/AppShell";
import { getEtfRows, getEvidenceMap, getSnapshot } from "@/lib/data";

export default function HomePage() {
  const snapshot = getSnapshot();
  return (
    <AppShell snapshot={snapshot}>
      <ControlTowerClient evidenceById={getEvidenceMap(snapshot)} rows={getEtfRows(snapshot)} snapshot={snapshot} />
    </AppShell>
  );
}
