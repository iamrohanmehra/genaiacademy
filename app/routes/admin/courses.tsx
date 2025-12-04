"use client"

import * as React from "react"
import { Link } from "react-router"
import {
    type ColumnDef,
    type ColumnFiltersState,
    type SortingState,
    type VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { useQuery, keepPreviousData, useQueryClient } from "@tanstack/react-query"
import { ArrowUpDown, ChevronDown, MoreHorizontal, Loader2, ChevronLeft, ChevronRight, Calendar, Users, BookOpen, Pencil } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

import { Button } from "~/components/ui/button"
import { Checkbox } from "~/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { Input } from "~/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table"
import { AppSidebar } from "~/components/app-sidebar"
import { SiteHeader } from "~/components/site-header"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { supabase } from "~/lib/supabase"
import { api, ApiError } from "~/lib/api.client"
import { queryKeys } from "~/lib/query-keys"
import { Badge } from "~/components/ui/badge"
import { useDebounce } from "~/hooks/use-debounce"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"

// Define Course Type
export type Course = {
    id: string
    title: string
    desc: string
    schedule: string
    type: string
    topic: number
    price: string
    payable: string
    certificateFee: string
    association: string
    limit: number
    banner: string
    startDate: string
    endDate: string
    whatsAppGroupLink: string
    resourcesLink: string
    nextClassTopic: string
    nextClassLink: string
    nextClassDesc: string
    status: "live" | "private" | "completed" | "inProgress"
    createdAt: string
    updatedAt: string
}

const CourseActions = React.memo(({ course }: { course: Course }) => {
    return (
        <div className="flex items-center gap-1">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <Link to={`/admin/courses/${course.id}/schedule`}>
                                <Calendar className="h-4 w-4" />
                                <span className="sr-only">Schedule</span>
                            </Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Schedule</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <Link to={`/admin/enrollments?courseId=${course.id}`}>
                                <Users className="h-4 w-4" />
                                <span className="sr-only">Enrollments</span>
                            </Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Enrollments</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <Link to={`/admin/courses/${course.id}/content`}>
                                <BookOpen className="h-4 w-4" />
                                <span className="sr-only">Content</span>
                            </Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Content</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    )
})
CourseActions.displayName = "CourseActions"

function DebouncedInput({
    value: initialValue,
    onChange,
    debounce = 300,
    ...props
}: {
    value: string | number
    onChange: (value: string | number) => void
    debounce?: number
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
    const [value, setValue] = React.useState(initialValue)

    React.useEffect(() => {
        setValue(initialValue)
    }, [initialValue])

    React.useEffect(() => {
        const timeout = setTimeout(() => {
            onChange(value)
        }, debounce)

        return () => clearTimeout(timeout)
    }, [value])

    return (
        <Input {...props} value={value} onChange={(e) => setValue(e.target.value)} />
    )
}

export const columns: ColumnDef<Course>[] = [
    {
        accessorKey: "title",
        header: ({ column }) => {
            return (
                <div className="pl-4">
                    Course Title
                </div>
            )
        },
        cell: ({ row }) => (
            <Link
                to={`/admin/courses/${row.original.id}/edit`}
                className="hover:underline font-medium text-primary pl-4 block"
            >
                {row.getValue("title")}
            </Link>
        ),
    },
    {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => <div className="capitalize">{row.getValue("type")}</div>,
    },
    {
        accessorKey: "startDate",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="pl-0 hover:bg-transparent"
                >
                    Schedule
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const start = new Date(row.original.startDate)
            const end = new Date(row.original.endDate)
            return <div>{format(start, "d MMM yyyy")} – {format(end, "d MMM yyyy")}</div>
        },
    },
    {
        accessorKey: "price",
        header: "Revenue",
        cell: ({ row }) => {
            const price = parseFloat(row.getValue("price"))
            const formatted = new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
            }).format(price)
            return <div>{formatted}</div>
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
            <Badge variant={row.getValue("status") === "live" ? "default" : "secondary"}>
                {row.getValue("status")}
            </Badge>
        ),
    },
    {
        id: "actions",
        header: "Actions",
        enableHiding: false,
        cell: ({ row }) => <CourseActions course={row.original} />,
    },
]

const MemoizedTableRow = React.memo(({ row, queryClient }: { row: any, queryClient: any }) => {
    const course = row.original

    const prefetchCourse = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) return

        queryClient.prefetchQuery({
            queryKey: queryKeys.courses.detail(course.id),
            queryFn: async () => {
                const result = await api.get<{ success: boolean; data: Course }>(`/api/admin/courses/${course.id}`, token)
                return result.data
            },
            staleTime: 1000 * 60 * 5, // 5 minutes
        })
    }

    return (
        <TableRow
            data-state={row.getIsSelected() && "selected"}
            onMouseEnter={prefetchCourse}
        >
            {row.getVisibleCells().map((cell: any) => (
                <TableCell key={cell.id}>
                    {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                    )}
                </TableCell>
            ))}
        </TableRow>
    )
})
MemoizedTableRow.displayName = "MemoizedTableRow"

export default function CoursesPage() {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    const [activeTab, setActiveTab] = React.useState("live")

    const { data: queryData, isLoading, isError } = useQuery({
        queryKey: queryKeys.courses.all,
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) throw new ApiError("Unauthorized", 401)
            return api.get<{ success: boolean; data: Course[]; count: number }>('/api/admin/courses', token)
        },
        placeholderData: keepPreviousData,
    })

    const queryClient = useQueryClient()
    const data = React.useMemo(() => queryData?.data || [], [queryData])

    const filteredData = React.useMemo(() => {
        if (activeTab === "all") return data
        return data.filter(course => course.status === activeTab)
    }, [data, activeTab])

    const count = data.length
    const loading = isLoading

    const table = useReactTable({
        data: filteredData,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
        initialState: {
            pagination: {
                pageSize: 50,
            },
        },
    })

    return (
        <div className="flex flex-1 flex-col gap-4 px-4">
            <div className="mx-auto w-full max-w-5xl flex flex-col gap-6">
                <div className="flex items-center justify-between py-4">
                    <h2 className="text-xl font-semibold tracking-tight">
                        Courses | <span className="font-normal text-muted-foreground text-sm">Total Courses: {count}</span>
                    </h2>
                </div>

                <Tabs defaultValue="live" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList>
                        <TabsTrigger value="live">Live</TabsTrigger>
                        <TabsTrigger value="inProgress">In Progress</TabsTrigger>
                        <TabsTrigger value="private">Private</TabsTrigger>
                        <TabsTrigger value="completed">Completed</TabsTrigger>
                        <TabsTrigger value="all">All</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="relative flex flex-col gap-4 overflow-auto">
                    <div className="flex items-center justify-between">
                        <DebouncedInput
                            placeholder="Filter courses..."
                            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
                            onChange={(value) =>
                                table.getColumn("title")?.setFilterValue(value)
                            }
                            className="max-w-sm"
                        />
                    </div>
                    <div className="overflow-hidden rounded-lg border">
                        <Table>
                            <TableHeader className="bg-muted sticky top-0 z-10">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => {
                                            return (
                                                <TableHead key={header.id}>
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                </TableHead>
                                            )
                                        })}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Loading...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <MemoizedTableRow key={row.id} row={row} queryClient={queryClient} />
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-24 text-center"
                                        >
                                            No results.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-end">
                        <div className="flex w-full items-center gap-8 lg:w-fit">
                            <div className="flex w-fit items-center justify-center text-sm font-medium">
                                Page {table.getState().pagination.pageIndex + 1} of{" "}
                                {table.getPageCount()}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    className="size-8"
                                    size="icon"
                                    onClick={() => table.previousPage()}
                                    disabled={!table.getCanPreviousPage()}
                                >
                                    <span className="sr-only">Go to previous page</span>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="size-8"
                                    size="icon"
                                    onClick={() => table.nextPage()}
                                    disabled={!table.getCanNextPage()}
                                >
                                    <span className="sr-only">Go to next page</span>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
