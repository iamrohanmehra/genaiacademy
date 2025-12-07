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
import { useQuery, keepPreviousData, useMutation, useQueryClient } from "@tanstack/react-query"
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

import { supabase } from "~/lib/supabase"
import { api, ApiError } from "~/lib/api.client"
import { queryKeys } from "~/lib/query-keys"
import { useNavigate } from "react-router"
import { useDebounce } from "~/hooks/use-debounce"
import { UserEmailSearch } from "~/components/admin/users/user-email-search"
import { EditUserDialog } from "~/components/admin/users/edit-user-dialog"
import { DeleteUserDialog } from "~/components/admin/users/delete-user-dialog"

// Define User Type
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
        onSuccess: (data, variables) => {
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
                        onClick={() => navigator.clipboard.writeText(user.id)}
                    >
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

export const columns: ColumnDef<User>[] = [
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
                className={row.original.status === 'banned' ? 'border-black/50 data-[state=checked]:bg-black data-[state=checked]:border-black' : ''}
            />
        ),
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
                >
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => (
            <Link
                to={`/admin/users/${row.original.id}`}
                className="capitalize hover:underline font-medium text-primary"
            >
                {row.getValue("name")}
            </Link>
        ),
    },
    {
        accessorKey: "email",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Email
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
    },
    {
        accessorKey: "mobile",
        header: "Mobile",
        cell: ({ row }) => <div>{row.getValue("mobile") || "-"}</div>,
    },
    {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => <div className="capitalize">{row.getValue("role")}</div>,
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
            <div className="capitalize">
                {row.getValue("status")}
            </div>
        ),
    },
    {
        accessorKey: "createdAt",
        header: "Joined",
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

const MemoizedTableRow = React.memo(({ row }: { row: any }) => {
    return (
        <TableRow
            data-state={row.getIsSelected() && "selected"}
            className={row.original.status === 'banned' ? 'bg-orange-300 hover:bg-orange-300/90' : ''}
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
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})

    const [page, setPage] = React.useState(1)
    const [searchQuery, setSearchQuery] = React.useState("")
    const debouncedSearch = useDebounce(searchQuery, 300)
    const limit = 50

    // Reset to page 1 if search query changes
    React.useEffect(() => {
        setPage(1)
    }, [debouncedSearch])

    const { data: queryData, isLoading, isError, error } = useQuery({
        queryKey: queryKeys.users.list(page, debouncedSearch),
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token

            if (!token) {
                throw new ApiError("Unauthorized", 401)
            }

            const result = await api.get<{ success: boolean; data: User[]; count: number }>(
                `/api/admin/users?page=${page}&limit=${limit}&search=${debouncedSearch}`,
                token
            )
            return result
        },
        placeholderData: keepPreviousData,
        retry: (failureCount, error) => {
            if (error instanceof ApiError && error.status === 401) {
                return false
            }
            return failureCount < 3
        },
        refetchOnMount: true,
    })

    React.useEffect(() => {
        if (isError && error) {
            if (error instanceof ApiError && error.status === 401) {
                toast.error("Session expired. Please login again.")
                navigate("/login")
            } else {
                toast.error("Failed to fetch users. Please check console for details.")
            }
        }
    }, [isError, error, navigate])

    const data = queryData?.data || []
    const totalCount = queryData?.count || 0
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
            pagination: {
                pageIndex: 0,
                pageSize: limit
            }
        },
        manualPagination: true,
        pageCount: Math.ceil(totalCount / limit),
    })

    return (
        <div className="flex flex-1 flex-col gap-4">
            <div className="flex items-center justify-between space-y-2 py-4">
                <h2 className="text-lg font-semibold">All Users</h2>
            </div>

            <div className="w-full">
                <div className="flex items-center py-4">
                    <Input
                        placeholder="Search by name, email, or mobile..."
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="max-w-sm"
                    />
                    <div className="ml-2">
                        <UserEmailSearch />
                    </div>
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
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
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
                                        <div className="flex justify-center items-center">
                                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                            Loading...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <MemoizedTableRow key={row.id} row={row} />
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
                <div className="flex items-center justify-end space-x-2 py-4">
                    <div className="flex-1 text-sm text-muted-foreground">
                        {table.getFilteredSelectedRowModel().rows.length} of{" "}
                        {table.getFilteredRowModel().rows.length} row(s) selected.
                    </div>
                    <div className="space-x-2 flex items-center">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                        >
                            Previous
                        </Button>
                        <span className="text-sm">
                            Page {page} of {Math.ceil(totalCount / limit) || 1}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page >= Math.ceil(totalCount / limit) || loading}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
