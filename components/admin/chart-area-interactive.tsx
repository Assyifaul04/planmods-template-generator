// components/admin/chart-area-interactive.tsx
"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Loader2 } from "lucide-react"

export const description = "Downloads per day, split by platform"

interface DownloadPoint {
  date: string
  java: number
  bedrock: number
}

// Blue gradient palette matching the reference design
const chartConfig = {
  downloads: {
    label: "Downloads",
  },
  java: {
    label: "Java",
    color: "#3b82f6", // blue-500
  },
  bedrock: {
    label: "Bedrock",
    color: "#93c5fd", // blue-300
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState<"7d" | "30d" | "90d">("90d")
  const [data, setData] = React.useState<DownloadPoint[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/admin/dashboard/downloads-chart?range=${timeRange}`)
        const json = await res.json()
        setData(json.data ?? [])
      } catch (error) {
        console.error("Error fetching downloads chart:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [timeRange])

  const rangeLabel =
    timeRange === "7d" ? "Last 7 days" : timeRange === "30d" ? "Last 30 days" : "Last 3 months"

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Total Downloads</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Java vs Bedrock downloads for the {rangeLabel.toLowerCase()}
          </span>
          <span className="@[540px]/card:hidden">{rangeLabel}</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            multiple={false}
            value={[timeRange]}
            onValueChange={(value) => {
              if (value[0]) setTimeRange(value[0] as "7d" | "30d" | "90d")
            }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as "7d" | "30d" | "90d")}
          >
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <div className="flex h-[250px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="fillJava" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-java)" stopOpacity={1.0} />
                  <stop offset="95%" stopColor="var(--color-java)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillBedrock" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-bedrock)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-bedrock)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="bedrock"
                type="natural"
                fill="url(#fillBedrock)"
                stroke="var(--color-bedrock)"
                stackId="a"
              />
              <Area
                dataKey="java"
                type="natural"
                fill="url(#fillJava)"
                stroke="var(--color-java)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}