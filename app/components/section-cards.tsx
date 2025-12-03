import * as React from "react"
import {
  IconCalendar,
  IconCurrencyDollar,
  IconSchool,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconUserPlus,
} from "@tabler/icons-react"
import { type DateRange } from "react-day-picker"
import { addDays, format } from "date-fns"
import { useQuery } from "@tanstack/react-query"

import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
// import { Calendar } from "~/components/ui/calendar"
const Calendar = React.lazy(() => import("~/components/ui/calendar").then(module => ({ default: module.Calendar })))
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { cn } from "~/lib/utils"
import { api } from "~/lib/api.client"
import { queryKeys } from "~/lib/query-keys"
import { supabase } from "~/lib/supabase"
import { Skeleton } from "~/components/ui/skeleton"

type Metric = {
  current: number
  previous: number
  change: number
  changePercentage: number
  trend: "up" | "down" | "neutral"
}

type OverviewData = {
  userSignups: Metric
  totalEnrollments: Metric
  paidEnrollments: Metric
  totalRevenue: Metric
}

export function SectionCards() {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  })
  const [filter, setFilter] = React.useState("today")

  const { data: overviewData, isLoading } = useQuery({
    queryKey: queryKeys.overview(filter,
      filter === 'custom' && date?.from ? format(date.from, 'yyyy-MM-dd') : undefined,
      filter === 'custom' && date?.from ? format(date.from, 'yyyy-MM-dd') : undefined,
      filter === 'custom' && date?.to ? format(date.to, 'yyyy-MM-dd') : undefined
    ),
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return null

      let queryParams = `?filter=${filter}`
      if (filter === 'custom' && date?.from) {
        if (date.to) {
          queryParams = `?filter=customRange&startDate=${format(date.from, 'yyyy-MM-dd')}&endDate=${format(date.to, 'yyyy-MM-dd')}`
        } else {
          queryParams = `?filter=customDate&customDate=${format(date.from, 'yyyy-MM-dd')}`
        }
      }

      const response = await api.get<{ success: boolean; data: OverviewData }>(
        `/api/admin/overview${queryParams}`,
        token
      )
      return response.data
    },
    enabled: true,
  })

  const formatCurrency = React.useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100)
  }, [])

  const iconUserPlus = React.useMemo(() => <IconUserPlus className="size-4" />, [])
  const iconSchool = React.useMemo(() => <IconSchool className="size-4" />, [])
  const iconCurrencyDollar = React.useMemo(() => <IconCurrencyDollar className="size-4" />, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="thisWeek">This Week</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="last90Days">Last 90 Days</SelectItem>
              <SelectItem value="custom">Custom Date</SelectItem>
            </SelectContent>
          </Select>

          {filter === "custom" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-[300px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                  aria-label="Select date range"
                >
                  <IconCalendar className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <React.Suspense fallback={<div className="p-4">Loading...</div>}>
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                  />
                </React.Suspense>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 md:grid-cols-4">
        <MetricCard
          title="New Signups"
          metric={overviewData?.userSignups}
          icon={iconUserPlus}
          description="Total signups for selected period"
          isLoading={isLoading}
        />
        <MetricCard
          title="Total Enrollments"
          metric={overviewData?.totalEnrollments}
          icon={iconSchool}
          description="Students enrolled in courses"
          isLoading={isLoading}
        />
        <MetricCard
          title="Paid Enrollments"
          metric={overviewData?.paidEnrollments}
          icon={iconSchool}
          description="Enrollments with payment"
          isLoading={isLoading}
        />
        <MetricCard
          title="Revenue"
          metric={overviewData?.totalRevenue}
          icon={<IconCurrencyDollar className="size-4" />}
          description="Gross revenue from all sources"
          formatter={formatCurrency}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}

const MetricCard = React.memo(function MetricCard({
  title,
  metric,
  icon,
  formatter = (val: number) => val.toString(),
  description,
  isLoading
}: {
  title: string
  metric: Metric | undefined
  icon: React.ReactNode
  formatter?: (val: number) => string
  description: string
  isLoading: boolean
}) {
  const renderTrendIcon = (trend: string) => {
    if (trend === 'up') return <IconTrendingUp className="mr-1 h-3 w-3" />
    if (trend === 'down') return <IconTrendingDown className="mr-1 h-3 w-3" />
    return <IconMinus className="mr-1 h-3 w-3" />
  }

  if (isLoading || !metric) {
    return (
      <Card className="@container/card h-[220px] flex flex-col justify-between">
        <CardHeader>
          <CardDescription><Skeleton className="h-4 w-24" /></CardDescription>
          <CardTitle><Skeleton className="h-8 w-16" /></CardTitle>
        </CardHeader>
        <CardFooter>
          <Skeleton className="h-4 w-full" />
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="@container/card h-[220px] flex flex-col justify-between">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {formatter(metric.current)}
        </CardTitle>
        <CardAction>
          <Badge variant="outline" className={cn(
            metric.trend === 'up' ? "text-green-600 border-green-200 bg-green-50" :
              metric.trend === 'down' ? "text-red-600 border-red-200 bg-red-50" :
                "text-gray-600 border-gray-200 bg-gray-50"
          )}>
            {renderTrendIcon(metric.trend)}
            {metric.changePercentage > 0 ? '+' : ''}{metric.changePercentage.toFixed(1)}%
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">
          {metric.trend === 'up' ? 'Trending up' : metric.trend === 'down' ? 'Trending down' : 'Stable'} {icon}
        </div>
        <div className="text-muted-foreground">
          {description}
        </div>
      </CardFooter>
    </Card>
  )
})
