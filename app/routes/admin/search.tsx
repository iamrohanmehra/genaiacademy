"use client"

import * as React from "react"
import { useSearchParams, useNavigate } from "react-router"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import {
    type ColumnDef,
    type SortingState,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { Loader2, Eye, ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "~/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table"
import { api, ApiError } from "~/lib/api.client"
import { supabase } from "~/lib/supabase"
import type { User } from "~/types/user"

// Define columns for search results
const columns: ColumnDef<User>[] = [
    {
        id: "sno",
        header: () => <div className="pl-4">S.No</div>,
        cell: ({ row, table }) => {
            return (
                <div className="pl-4">
                    {(table.getState().pagination.pageIndex * table.getState().pagination.pageSize) + row.index + 1}
                </div>
            )
        },
    },
    {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("email")}</div>,
    },
    {
        accessorKey: "mobile",
        header: "Mobile Number",
        cell: ({ row }) => <div>{row.getValue("mobile") || "-"}</div>,
    },
    {
        id: "actions",
        header: "Action",
        cell: ({ row }) => {
            const navigate = useNavigate()
            return (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/users/${row.original.id}`)}
                >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                </Button>
            )
        },
    },
]

export default function SearchPage() {
    const [searchParams] = useSearchParams()
    const query = searchParams.get("q") || ""
    const navigate = useNavigate()

    const [sorting, setSorting] = React.useState<SortingState>([])

    const { data: searchResults, isLoading, isError } = useQuery({
        queryKey: ["users", "search", query],
        queryFn: async () => {
            if (!query) return []
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) throw new ApiError("Unauthorized", 401)

            const response = await api.searchUsers(query, token)
            return response.data
        },
        enabled: !!query,
        placeholderData: keepPreviousData,
    })

    const table = useReactTable({
        data: searchResults || [],
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        state: {
            sorting,
        },
        initialState: {
            pagination: {
                pageSize: 50,
            },
        },
    })

    if (!query) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
                <p>Please enter a search term to find users.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col gap-4 px-4">
            <div className="mx-auto w-full max-w-5xl flex flex-col gap-6">
                <div className="flex items-center justify-between py-4">
                    <h2 className="text-xl font-semibold tracking-tight">Search Results for "{query}"</h2>
                </div>
                <div className="relative flex flex-col gap-4 overflow-auto">
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
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            <div className="flex justify-center items-center">
                                                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                                Searching...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                            className="group"
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            No users found matching "{query}".
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {table.getRowModel().rows?.length > 0 && (
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
                    )}
                </div>
            </div>
        </div>
    )
}
