"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatDate } from "@/lib/format"

export interface TrendPoint {
  id: string
  date: string
  opponent: string
  /** Percentage, 0-100. */
  destruction: number | null
  /** Average stars per attack, 0-3. */
  stars: number | null
}

const config = {
  destruction: { label: "Destruction %", color: "var(--chart-1)" },
  stars: { label: "Avg stars", color: "var(--chart-3)" },
} satisfies ChartConfig

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const byId = new Map(data.map((point) => [point.id, point]))

  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <LineChart data={data} margin={{ top: 8, left: 0, right: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="id"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tickFormatter={(id: string) => {
            const point = byId.get(id)
            return point
              ? new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                }).format(new Date(point.date))
              : ""
          }}
        />
        <YAxis
          yAxisId="destruction"
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          width={36}
          tickFormatter={(v: number) => `${v}%`}
        />
        <YAxis
          yAxisId="stars"
          orientation="right"
          domain={[0, 3]}
          ticks={[0, 1, 2, 3]}
          tickLine={false}
          axisLine={false}
          width={24}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(id) => {
                const point = byId.get(String(id))
                return point
                  ? `vs ${point.opponent} · ${formatDate(point.date, "date")}`
                  : String(id)
              }}
              formatter={(value, name) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="text-muted-foreground">
                    {config[name as keyof typeof config]?.label ?? name}
                  </span>
                  <span className="font-mono font-medium tabular-nums">
                    {name === "destruction"
                      ? `${Number(value).toFixed(1)}%`
                      : Number(value).toFixed(2)}
                  </span>
                </div>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          yAxisId="destruction"
          dataKey="destruction"
          type="monotone"
          stroke="var(--color-destruction)"
          strokeWidth={2}
          dot={{ r: 3 }}
          connectNulls
        />
        <Line
          yAxisId="stars"
          dataKey="stars"
          type="monotone"
          stroke="var(--color-stars)"
          strokeWidth={2}
          dot={{ r: 3 }}
          connectNulls
        />
      </LineChart>
    </ChartContainer>
  )
}
