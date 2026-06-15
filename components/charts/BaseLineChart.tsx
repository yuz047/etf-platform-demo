"use client";

import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";

type BaseLineChartProps = {
  title: string;
  tag?: string;
  data: Record<string, string | number | null | undefined>[];
  lines: { key: string; color: string }[];
};

export function BaseLineChart({ title, tag, data, lines }: BaseLineChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>{title}</PanelTitle>
        {tag ? <span className="rounded-md border border-zinc-200 bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">{tag}</span> : null}
      </PanelHeader>
      <PanelBody className="h-56 p-2">
        {mounted ? (
          <ResponsiveContainer height="100%" minHeight={180} minWidth={240} width="100%">
            <LineChart data={data} margin={{ bottom: 0, left: 0, right: 10, top: 10 }}>
              <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={10} tickLine={false} tickMargin={8} />
              <YAxis fontSize={10} tickLine={false} width={42} />
              <Tooltip contentStyle={{ border: "1px solid #e4e4e7", borderRadius: 6, fontSize: 12 }} />
              {lines.map((line) => (
                <Line dataKey={line.key} dot={false} key={line.key} stroke={line.color} strokeWidth={2} type="monotone" />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full bg-zinc-50" />
        )}
      </PanelBody>
    </Panel>
  );
}
