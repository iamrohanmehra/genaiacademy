"use client"

import * as React from "react"
import { Link, useNavigate } from "react-router"
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
    type Row,
} from "@tanstack/react-table"
import { useQuery, keepPreviousData, useQueryClient, useMutation, type QueryClient } from "@tanstack/react-query" // Added type imports
import {
    ArrowUpDown,
    MoreHorizontal,
    Loader2,
    Columns,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Copy,
    Calendar as CalendarIcon,
    Check
} from "lucide-react"
import { type DateRange } from "react-day-picker"
import { addDays, format, isToday, isYesterday, isThisWeek, isThisMonth, startOfMonth, subMonths, isAfter, subDays, startOfDay, endOfDay } from "date-fns"
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover"
import { cn } from "~/lib/utils"
// Lazy load Calendar to avoid build issues with server-side rendering
const Calendar = React.lazy(() => import("~/components/ui/calendar").then(module => ({ default: module.Calendar })))

import { Input } from "~/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table"
import { Label } from "~/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"

import { supabase } from "~/lib/supabase"
import { api, ApiError } from "~/lib/api.client"
import { queryKeys } from "~/lib/query-keys"
import { useDebounce } from "~/hooks/use-debounce"
import { EditUserDialog } from "~/components/admin/users/edit-user-dialog"
import { DeleteUserDialog } from "~/components/admin/users/delete-user-dialog"

// Define User Type
// Exporting this as it is used by other pages like enrollments.tsx
export type User = {
    id: string
    name: string
    email: string
    mobile: string | null
    role: "student" | "admin" | "instructor" | "operations"
    status: "active" | "banned" | "suspended"
    createdAt: string
    lastActivity: string | null
    profession?: string
    utmSource?: string
}

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

const UserActions = React.memo(({ user }: { user: User }) => {
    const [showEditDialog, setShowEditDialog] = React.useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    const { mutate: toggleStatus } = useMutation({
        mutationFn: async (newStatus: 'active' | 'banned') => {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) throw new ApiError("Unauthorized", 401)

            const endpoint = newStatus === 'banned' ? 'ban' : 'activate'
            const result = await api.post<{ success: boolean }>(`/api/admin/users/${user.id}/${endpoint}`, {}, token)
            return result
        },
        onSuccess: (data: { success: boolean }, variables: 'active' | 'banned') => {
            if (data.success) {
                toast.success(`User ${variables === 'banned' ? 'banned' : 'activated'} successfully`)
                queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
            }
        },
        onError: () => {
            toast.error("Failed to update user status")
        }
    })

    return (
        <>
            <EditUserDialog
                user={user}
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
                onUserUpdated={() => queryClient.invalidateQueries({ queryKey: queryKeys.users.all })}
            />
            <DeleteUserDialog
                user={user}
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
            />
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
                        onClick={() => {
                            navigator.clipboard.writeText(user.id)
                            toast.success("User ID copied")
                        }}
                    >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy User ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate(`/admin/users/${user.id}`)}>
                        View details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                        Edit user
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleStatus(user.status === 'active' ? 'banned' : 'active')}>
                        {user.status === 'active' ? 'Ban User' : 'Activate User'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-destructive focus:text-destructive"
                    >
                        Delete user
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
})
UserActions.displayName = "UserActions"

const MemoizedTableRow = React.memo(({ row, visibilityKey }: { row: Row<User>; visibilityKey: string }) => {
    return (
        <TableRow
            data-state={row.getIsSelected() && "selected"}
            className={row.original.status === 'banned' ? 'bg-destructive/10 hover:bg-destructive/20' : 'hover:bg-muted/50'}
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

export default function UsersPage() {
    const navigate = useNavigate()
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
        role: false,
        profession: false,
        utmSource: false,
        createdAt: false,
        sno: true,
        name: true,
        email: true,
        mobile: true,
        status: true,
        lastActivity: true,
    })
    const [rowSelection, setRowSelection] = React.useState({})

    // Date Filter State
    const [date, setDate] = React.useState<DateRange | undefined>({
        from: new Date(),
        to: addDays(new Date(), 7),
    })
    const [filter, setFilter] = React.useState("all")

    const [page, setPage] = React.useState(0) // 0-indexed for table state, will convert to 1-indexed for API
    const [pageSize, setPageSize] = React.useState(100)
    const [searchQuery, setSearchQuery] = React.useState("")
    const debouncedSearch = useDebounce(searchQuery, 300)

    // Reset to page 0 if search query changes
    React.useEffect(() => {
        setPage(0)
    }, [debouncedSearch])

    const { data: queryData, isLoading, isError, error } = useQuery({
        queryKey: queryKeys.users.all,
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) throw new ApiError("Unauthorized", 401)

            // Fetch all users for client-side filtering/sorting
            // Assuming API supports a large limit or returns all if no limit specified
            // Using a high limit to ensure we get everything
            const result = await api.get<{ success: boolean; data: User[]; count?: number; total?: number; meta?: { total: number } }>(
                `/api/admin/users?limit=10000`,
                token
            )
            return result
        },
        placeholderData: keepPreviousData,
    })

    const queryClient = useQueryClient()

    // Client-side Data Processing
    const rawData = React.useMemo(() => queryData?.data || [], [queryData])

    const filteredData = React.useMemo(() => {
        let processed = [...rawData]

        // 1. Text Search
        if (debouncedSearch) {
            const lowerQuery = debouncedSearch.toLowerCase()
            processed = processed.filter(user =>
                user.name.toLowerCase().includes(lowerQuery) ||
                user.email.toLowerCase().includes(lowerQuery)
            )
        }

        // 2. Date Filter
        if (filter !== 'all') {
            const now = new Date()
            processed = processed.filter(user => {
                const joinedDate = new Date(user.createdAt)

                switch (filter) {
                    case 'today': return isToday(joinedDate)
                    case 'yesterday': return isYesterday(joinedDate)
                    case 'thisWeek': return isThisWeek(joinedDate)
                    case 'thisMonth': return isThisMonth(joinedDate)
                    case 'lastMonth': {
                        const lastMonthStart = startOfMonth(subMonths(now, 1))
                        const thisMonthStart = startOfMonth(now)
                        return isAfter(joinedDate, lastMonthStart) && joinedDate < thisMonthStart
                    }
                    case 'last90Days': return isAfter(joinedDate, subDays(now, 90))
                    case 'custom':
                        if (date?.from && date?.to) {
                            return isAfter(joinedDate, startOfDay(date.from)) && isAfter(endOfDay(date.to), joinedDate)
                        } else if (date?.from) {
                            return isToday(joinedDate) || isAfter(joinedDate, startOfDay(date.from)) // Simplified for single date
                        }
                        return true
                    default: return true
                }
            })
        }

        return processed
    }, [rawData, debouncedSearch, filter, date])

    const totalCount = isLoading ? 0 : filteredData.length
    // const loading = isLoading // Removed this line as per instruction

    const columns: ColumnDef<User>[] = [
        {
            id: "sno",
            header: () => <div className="pl-4">S.No</div>,
            cell: ({ row, table }) => {
                const pageIndex = table.getState().pagination.pageIndex
                const pageSize = table.getState().pagination.pageSize
                return <div className="pl-4">{pageIndex * pageSize + row.index + 1}</div>
            },
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "name",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="pl-0 hover:bg-transparent"
                    >
                        Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => (
                <Link
                    to={`/admin/users/${row.original.id}`}
                    className="capitalize hover:underline font-medium text-foreground"
                >
                    {row.getValue("name")}
                </Link>
            ),
            enableHiding: false,
        },
        {
            accessorKey: "email",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="pl-0 hover:bg-transparent"
                    >
                        Email
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="lowercase text-muted-foreground">{row.getValue("email")}</div>,
            enableHiding: false,
        },
        {
            accessorKey: "mobile",
            header: "Mobile",
            cell: ({ row }) => <div>{row.getValue("mobile") || "-"}</div>,
            enableHiding: false,
        },
        {
            accessorKey: "role",
            header: "Role",
            cell: ({ row }) => <div className="capitalize">{row.getValue("role")}</div>,
            enableHiding: false,
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <div className="capitalize">
                    {row.getValue("status")}
                </div>
            ),
            enableHiding: false,
        },
        {
            accessorKey: "lastActivity",
            header: "Last Activity",
            cell: ({ row }) => {
                const dateVal = row.getValue("lastActivity")
                if (!dateVal) return <div className="text-muted-foreground">-</div>
                const date = new Date(dateVal as string)
                return <div>{format(date, "PP")}</div>
            },
        },
        {
            accessorKey: "profession",
            header: "Profession",
            cell: ({ row }) => <div className="capitalize">{row.getValue("profession") || "-"}</div>,
        },
        {
            accessorKey: "utmSource",
            header: "Source",
            cell: ({ row }) => <div>{row.getValue("utmSource") || "-"}</div>,
        },
        {
            accessorKey: "createdAt",
            header: "Joined Date",
            cell: ({ row }) => {
                const date = new Date(row.getValue("createdAt"))
                return <div>{format(date, "PP")}</div>
            },
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => <UserActions user={row.original} />,
        },
    ]

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
            pagination: {
                pageIndex: page,
                pageSize: pageSize,
            },
        },
        onPaginationChange: (updater) => {
            if (typeof updater === 'function') {
                const newState = updater({
                    pageIndex: page,
                    pageSize: pageSize
                })
                setPage(newState.pageIndex)
                setPageSize(newState.pageSize)
            } else {
                setPage(updater.pageIndex)
                setPageSize(updater.pageSize)
            }
        },
    })

    const visibleColumns = table.getVisibleLeafColumns().length
    const maxWidthStyle = {
        maxWidth: `${64 + (visibleColumns - 5) * 12}rem`,
    }

    return (
        <div className="flex flex-1 flex-col gap-4 px-4 pb-20">
            <div
                className="mx-auto w-full flex flex-col gap-8 transition-[max-width] duration-300 ease-in-out"
                style={maxWidthStyle}
            >
                {/* Header Section */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4">
                        <h2 className="text-xl font-semibold tracking-tight">
                            Users <span className="text-muted-foreground mx-2">|</span> <span className="font-normal text-muted-foreground text-sm">Total Users: {isLoading ? <Loader2 className="inline-block h-4 w-4 animate-spin" /> : totalCount}</span>
                        </h2>

                        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full md:w-auto">
                            <Input
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                className="w-full md:w-[250px] lg:w-[300px]"
                            />

                            {/* Date Filter Dropdown */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                <Select value={filter} onValueChange={setFilter}>
                                    <SelectTrigger className="w-full sm:w-[160px]">
                                        <SelectValue placeholder="Select period" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Time</SelectItem>
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
                                                    "w-full sm:w-[240px] justify-start text-left font-normal",
                                                    !date && "text-muted-foreground"
                                                )}
                                                aria-label="Select date range"
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
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
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full md:w-auto ml-auto md:ml-0">
                                        <Columns className="mr-2 h-4 w-4" />
                                        View Columns
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
                                                    {column.id === 'utmSource' ? 'Source' : column.id === 'createdAt' ? 'Joined Date' : column.id === 'lastActivity' ? 'Last Activity' : column.id}
                                                </DropdownMenuCheckboxItem>
                                            )
                                        })}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="relative flex flex-col gap-4 overflow-auto">
                    <div className="rounded-md border w-full overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50 sticky top-0 z-10">
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
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            <div className="flex justify-center items-center w-full">
                                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                                <span className="ml-2 text-muted-foreground">Loading...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <MemoizedTableRow key={row.id} row={row} visibilityKey={JSON.stringify(columnVisibility)} />
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            No results.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    {/* Pagination Section */}
                    <div className="flex items-center justify-between">
                        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
                        </div>
                        <div className="flex w-full items-center gap-8 lg:w-fit">
                            <div className="hidden items-center gap-2 lg:flex">
                                <Label htmlFor="rows-per-page" className="text-sm font-medium">
                                    Rows per page
                                </Label>
                                <Select
                                    value={`${table.getState().pagination.pageSize}`}
                                    onValueChange={(value) => {
                                        table.setPageSize(Number(value))
                                    }}
                                >
                                    <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                                        <SelectValue
                                            placeholder={table.getState().pagination.pageSize}
                                        />
                                    </SelectTrigger>
                                    <SelectContent side="top">
                                        {[10, 20, 30, 40, 50, 100].map((pageSize) => (
                                            <SelectItem key={pageSize} value={`${pageSize}`}>
                                                {pageSize}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex w-fit items-center justify-center text-sm font-medium">
                                Page {table.getState().pagination.pageIndex + 1} of{" "}
                                {table.getPageCount()}
                            </div>
                            <div className="ml-auto flex items-center gap-2 lg:ml-0">
                                <Button
                                    variant="outline"
                                    className="hidden h-8 w-8 p-0 lg:flex"
                                    onClick={() => table.setPageIndex(0)}
                                    disabled={!table.getCanPreviousPage()}
                                >
                                    <span className="sr-only">Go to first page</span>
                                    <ChevronsLeft className="h-4 w-4" />
                                </Button>
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
                                <Button
                                    variant="outline"
                                    className="hidden size-8 lg:flex"
                                    size="icon"
                                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                    disabled={!table.getCanNextPage()}
                                >
                                    <span className="sr-only">Go to last page</span>
                                    <ChevronsRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
