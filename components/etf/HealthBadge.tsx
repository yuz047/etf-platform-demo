import { Badge } from "@/components/ui/badge";
import type { Status } from "@/lib/types";

export function HealthBadge({ status }: { status: Status }) {
  return <Badge status={status} />;
}
