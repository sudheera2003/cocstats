"use client"

import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const config = {
  count: { label: "Attacks", color: "var(--chart-1)" },
} satisfies ChartConfig

/** How many attacks earned 0, 1, 2 and 3 stars. */
export function StarsChart({
  distribution,
}: {
  distribution: [number, number, number, number]
}) {
  const data = distribution.map((count, stars) => ({
    stars: `${stars} ${stars === 1 ? "star" : "stars"}`,
    count,
  }))

  return (
    <ChartContainer config={config} className="aspect-auto h-56 w-full">
      <BarChart data={data} margin={{ top: 20, left: 4, right: 4 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="stars"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Bar dataKey="count" fill="var(--color-count)" radius={4}>
          <LabelList
            dataKey="count"
            position="top"
            className="fill-foreground"
            fontSize={11}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
