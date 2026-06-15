import { Badge } from "@/components/ui/badge";
import type { Evidence } from "@/lib/types";

export function EvidenceTable({ evidence }: { evidence: Evidence[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-xs">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
          <tr>
            <th className="px-3 py-2 font-medium">Evidence</th>
            <th className="px-3 py-2 font-medium">Source tag</th>
            <th className="px-3 py-2 font-medium">Source</th>
            <th className="px-3 py-2 font-medium">Field</th>
            <th className="px-3 py-2 font-medium">Value</th>
            <th className="px-3 py-2 font-medium">Retrieved</th>
          </tr>
        </thead>
        <tbody>
          {evidence.map((item) => (
            <tr className="border-b border-zinc-100" key={item.id}>
              <td className="px-3 py-2 font-medium text-zinc-950">{item.id}</td>
              <td className="px-3 py-2">
                <Badge>{item.source_tag}</Badge>
              </td>
              <td className="px-3 py-2 text-zinc-600">{item.source_name}</td>
              <td className="px-3 py-2 text-zinc-600">{item.field_name ?? "NA"}</td>
              <td className="px-3 py-2 text-zinc-600">{item.value ?? item.title}</td>
              <td className="px-3 py-2 text-zinc-600">{item.retrieved_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
