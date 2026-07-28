// components/admin/chart-bar-tooltip.tsx
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { Loader2 } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export const description = "Builds per day, success vs failed"

interface BuildPoint {
  day: string
  success: number
  failed: number
}

// Two-tone blue palette matching the reference "Tooltip - Default" chart
const chartConfig = {
  success: {
    label: "Success",
    color: "#93c5fd", // blue-300 (bottom, lighter)
  },
  failed: {
    label: "Failed",
    color: "#3b82f6", // blue-500 (top, darker)
  },
} satisfies ChartConfig

export function ChartBarTooltip() {
  const [data, setData] = React.useState<BuildPoint[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/admin/dashboard/builds-chart")
        const json = await res.json()
        setData(json.data ?? [])
      } catch (error) {
        console.error("Error fetching builds chart:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Build Activity</CardTitle>
        <CardDescription>Success vs failed builds, last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[250px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart data={data}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent />}
              />
              <Bar
                dataKey="success"
                stackId="a"
                fill="var(--color-success)"
                radius={[0, 0, 4, 4]}
              />
              <Bar
                dataKey="failed"
                stackId="a"
                fill="var(--color-failed)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}