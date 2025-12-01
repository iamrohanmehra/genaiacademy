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
import { useVirtualizer } from "@tanstack/react-virtual"
import { ArrowUpDown, ChevronDown, MoreHorizontal, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

import { Button } from "~/components/ui/button"
import { Checkbox } from "~/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
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
    status: "live" | "private" | "completed"
    createdAt: string
    updatedAt: string
}

const CourseActions = React.memo(({ course }: { course: Course }) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                    onClick={() => navigator.clipboard.writeText(course.id)}
                >
                    Copy Course ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>View details</DropdownMenuItem>
                <DropdownMenuItem>Edit course</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
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
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "title",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Title
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => (
            <Link
                to={`/admin/courses/${row.original.id}`}
                className="hover:underline font-medium text-primary"
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
        accessorKey: "price",
        header: "Price",
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
        accessorKey: "startDate",
        header: "Start Date",
        cell: ({ row }) => {
            const date = new Date(row.getValue("startDate"))
            return <div>{format(date, "PP")}</div>
        },
    },
    {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => {
            const date = new Date(row.getValue("createdAt"))
            return <div>{format(date, "PP")}</div>
        },
    },
    {
        id: "actions",
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

    const { data: queryData, isLoading, isError } = useQuery({
        queryKey: queryKeys.courses.all,
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token

            if (!token) {
                throw new ApiError("Unauthorized", 401)
            }

            // Note: API docs don't specify search/pagination for courses yet, fetching all
            return api.get<{ success: boolean; data: Course[]; count: number }>('/api/admin/courses', token)
        },
        placeholderData: keepPreviousData,
    })

    const queryClient = useQueryClient()
    const data = React.useMemo(() => queryData?.data || [], [queryData])
    const loading = isLoading

    const table = useReactTable({
        data,
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
    })

    const { rows } = table.getRowModel()
    const parentRef = React.useRef<HTMLDivElement>(null)

    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 60, // Estimated row height
        overscan: 10,
    })

    const virtualRows = virtualizer.getVirtualItems()
    const totalSize = virtualizer.getTotalSize()
    const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0
    const paddingBottom = virtualRows.length > 0 ? totalSize - (virtualRows[virtualRows.length - 1].end || 0) : 0

    return (

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0" >
            <div className="flex items-center justify-between space-y-2 py-4">
                <h2 className="text-lg font-semibold">All Courses</h2>
                <Button asChild>
                    <Link to="/admin/courses/create">Create Course</Link>
                </Button>
            </div>

            <div className="w-full">
                <div className="flex items-center py-4">
                    <DebouncedInput
                        placeholder="Filter courses..."
                        value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
                        onChange={(value) =>
                            table.getColumn("title")?.setFilterValue(value)
                        }
                        className="max-w-sm"
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto">
                                Columns <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => {
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) =>
                                                column.toggleVisibility(!!value)
                                            }
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    )
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div
                    ref={parentRef}
                    className="rounded-md border h-[600px] overflow-auto relative"
                >
                    <Table>
                        <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
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
                                <>
                                    {paddingTop > 0 && (
                                        <TableRow>
                                            <TableCell colSpan={columns.length} style={{ height: `${paddingTop}px` }} />
                                        </TableRow>
                                    )}
                                    {virtualRows.map((virtualRow) => {
                                        const row = rows[virtualRow.index]
                                        return (
                                            <MemoizedTableRow key={row.id} row={row} queryClient={queryClient} />
                                        )
                                    })}
                                    {paddingBottom > 0 && (
                                        <TableRow>
                                            <TableCell colSpan={columns.length} style={{ height: `${paddingBottom}px` }} />
                                        </TableRow>
                                    )}
                                </>
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
                <div className="flex items-center justify-end space-x-2 py-4">
                    <div className="flex-1 text-sm text-muted-foreground">
                        {table.getFilteredSelectedRowModel().rows.length} of{" "}
                        {table.getFilteredRowModel().rows.length} row(s) selected.
                    </div>
                    <div className="space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        </div >
    )
}
