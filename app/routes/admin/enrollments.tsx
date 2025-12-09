"use client"

import * as React from "react"
import { useSearchParams, useNavigate, Link } from "react-router"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
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
import { ArrowUpDown, ChevronLeft, ChevronRight, Copy, Loader2, ClipboardPen, Eye, Columns } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { Skeleton } from "~/components/ui/skeleton"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { supabase } from "~/lib/supabase"
import { api, ApiError } from "~/lib/api.client"
import { queryKeys } from "~/lib/query-keys"
import type { Enrollment } from "~/types/enrollment"
import type { Course } from "~/types/course"
import type { User } from "~/routes/admin/users" // Importing User type from users page

// Intersection type for Enrollment with User details
type EnrollmentWithUser = Enrollment & {
    user?: User
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

import {
    IconChevronLeft,
    IconChevronRight,
    IconChevronsLeft,
    IconChevronsRight,
} from "@tabler/icons-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import { Label } from "~/components/ui/label"

const EnrollmentTable = ({
    data,
    title,
    loading,
    columnVisibility,
    onColumnVisibilityChange,
    isUserLoading,
}: {
    data: EnrollmentWithUser[];
    title: string;
    loading: boolean;
    columnVisibility: VisibilityState;
    onColumnVisibilityChange: React.Dispatch<React.SetStateAction<VisibilityState>>;
    isUserLoading?: boolean;
}) => {
    const navigate = useNavigate();
    const [sorting, setSorting] = React.useState<SortingState>([
        { id: "userName", desc: false }
    ])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [rowSelection, setRowSelection] = React.useState({})
    const [globalFilter, setGlobalFilter] = React.useState("")
    const [pagination, setPagination] = React.useState({
        pageIndex: 0,
        pageSize: 100,
    })

    const columns: ColumnDef<EnrollmentWithUser>[] = [
        {
            id: "sno",
            header: () => <div className="pl-4">S.No</div>,
            cell: ({ row, table }) => {
                const pageIndex = table.getState().pagination.pageIndex;
                const pageSize = table.getState().pagination.pageSize;
                return <div className="pl-4">{pageIndex * pageSize + row.index + 1}</div>;
            },
            enableSorting: false,
        },
        {
            id: "userName",
            accessorFn: (row) => row.user?.name || "Unknown",
            header: ({ column }) => {
                return (
                    <div className="pl-4">
                        <Button
                            variant="ghost"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="pl-0 hover:bg-transparent"
                        >
                            Name
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                )
            },
            cell: ({ row }) => {
                if (!row.original.user && isUserLoading) {
                    return <div className="pl-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
                }
                return (
                    <div className="flex items-center gap-2 font-medium pl-4">
                        <span className="hover:underline hover:cursor-pointer">
                            {row.original.user?.name || "Unknown"}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 text-muted-foreground hover:text-foreground ml-1"
                            onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                if (row.original.user?.id) {
                                    navigator.clipboard.writeText(row.original.user.id);
                                    toast.success("User ID copied");
                                }
                            }}
                            title="Copy User ID"
                        >
                            <Copy className="h-3 w-3" />
                            <span className="sr-only">Copy User ID</span>
                        </Button>
                    </div>
                )
            },
        },
        {
            accessorFn: (row) => row.user?.email || "-",
            header: "Email",
            cell: ({ row }) => {
                if (!row.original.user && isUserLoading) {
                    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                }
                return <div className="lowercase text-muted-foreground">{row.original.user?.email || "-"}</div>
            },
        },
        {
            accessorFn: (row) => row.user?.mobile || "-",
            header: "Mobile Number",
            cell: ({ row }) => {
                if (!row.original.user && isUserLoading) {
                    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                }
                return <div>{row.original.user?.mobile || "-"}</div>
            },
        },
        {
            accessorKey: "profession",
            header: "Profession",
            cell: ({ row }) => {
                if (!row.original.user && isUserLoading) {
                    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                }
                return <div>{row.original.user?.profession || "-"}</div>
            },
            enableHiding: true,
        },
        {
            id: "utmSource",
            accessorKey: "utmSource",
            header: "Source",
            cell: ({ row }) => <div>{row.original.utmSource || "-"}</div>,
            enableHiding: true,
        },
        {
            id: "certificateId",
            accessorKey: "certificateId",
            header: "Certificate",
            cell: ({ row }) => {
                const certId = row.original.certificateId;
                if (!certId) return <div>-</div>;
                return (
                    <div className="flex items-center gap-2">
                        <span>{certId}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                navigator.clipboard.writeText(certId);
                                toast.success("Certificate ID copied");
                            }}
                            title="Copy Certificate ID"
                        >
                            <Copy className="h-3 w-3" />
                            <span className="sr-only">Copy Certificate ID</span>
                        </Button>
                    </div>
                );
            },
            enableHiding: true,
        },
        {
            id: "createdAt",
            accessorKey: "createdAt",
            header: "Enrollment Date",
            cell: ({ row }) => {
                const date = row.original.createdAt ? new Date(row.original.createdAt) : null;
                return <div>{date ? format(date, "d MMM yyyy") : "-"}</div>;
            },
            enableHiding: true,
        },
        {
            accessorKey: "amountPaid",
            header: "Price / Amount",
            cell: ({ row }) => {
                const amount = (row.original.amountPaid || 0) / 100
                const formatted = new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                }).format(amount)
                return <div>{formatted}</div>
            },
        },
        {
            id: "actions",
            header: "Action",
            cell: ({ row }) => {
                const enrollment = row.original
                return (
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground flex size-8 p-0 cursor-pointer hover:text-foreground"
                            onClick={() => navigate(`/admin/enrollments/${enrollment.id}/edit`)}
                            title="Edit Enrollment"
                        >
                            <ClipboardPen className="h-4 w-4" />
                            <span className="sr-only">Edit Enrollment</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground flex size-8 p-0 cursor-pointer hover:text-foreground"
                            onClick={() => navigate(`/admin/enrollments/${enrollment.id}/progress`)}
                            title="View Progress"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                            >
                                <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                                <path d="M22 12A10 10 0 0 0 12 2v10z" />
                            </svg>
                            <span className="sr-only">View Progress</span>
                        </Button>
                    </div>
                )
            },
        },
    ]

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            globalFilter,
            pagination,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: onColumnVisibilityChange,
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    })

    return (
        <div className="w-full flex flex-col gap-4">
            <div className="flex items-center justify-between py-4">
                <h2 className="text-xl font-semibold tracking-tight">
                    {title} <span className="text-muted-foreground mx-2">|</span> <span className="font-normal text-muted-foreground text-sm">Total Users: {loading ? <Loader2 className="inline-block h-4 w-4 animate-spin" /> : data.length}</span>
                </h2>
                <DebouncedInput
                    placeholder="Search..."
                    value={globalFilter ?? ""}
                    onChange={(value) => setGlobalFilter(String(value))}
                    className="max-w-sm"
                />
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
                            {loading ? (
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
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                        className="hover:bg-muted/50"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
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
                                <IconChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="size-8"
                                size="icon"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <span className="sr-only">Go to previous page</span>
                                <IconChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="size-8"
                                size="icon"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                <span className="sr-only">Go to next page</span>
                                <IconChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="hidden size-8 lg:flex"
                                size="icon"
                                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                disabled={!table.getCanNextPage()}
                            >
                                <span className="sr-only">Go to last page</span>
                                <IconChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function EnrollmentsPage() {
    const [searchParams] = useSearchParams()
    const courseId = searchParams.get("courseId")
    const navigate = useNavigate();

    // Shared Column Visibility State
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
        certificateId: false,
        utmSource: false,
        profession: false,
        createdAt: false,
    });

    // Fetch Enrollments
    const { data: enrollmentsData, isLoading: isLoadingEnrollments } = useQuery({
        queryKey: queryKeys.enrollments.list(courseId || 'all'),
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) throw new ApiError("Unauthorized", 401)
            return api.getEnrollments(token, courseId || undefined)
        },
        placeholderData: keepPreviousData,
    })

    // Fetch Course Details (only if courseId is present)
    const { data: courseData, isLoading: isLoadingCourse } = useQuery({
        queryKey: queryKeys.courses.detail(courseId || ''),
        queryFn: async () => {
            if (!courseId) return null
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) throw new ApiError("Unauthorized", 401)
            const response = await api.get<{ success: boolean; data: Course }>(`/api/admin/courses/${courseId}`, token)
            return response.data
        },
        enabled: !!courseId,
    })

    // Fetch All Users to join with enrollments
    const { data: usersData, isLoading: isLoadingUsers } = useQuery({
        queryKey: ['users', 'all_for_enrollments'], // Use a specific key
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) throw new ApiError("Unauthorized", 401)
            // Fetch a large number of users to ensure coverage. 
            // In a real production app with massive users, this should be done on backend.
            const result = await api.get<{ success: boolean; data: User[]; count: number }>(
                `/api/admin/users?page=1&limit=1000`, // Assuming 1000 is safe for now
                token
            )
            return result.data
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    })

    const data: EnrollmentWithUser[] = React.useMemo(() => {
        if (!enrollmentsData?.data || !usersData) return []

        return enrollmentsData.data.map(enrollment => {
            const user = usersData.find(u => u.id === enrollment.userId)
            return {
                ...enrollment,
                user
            }
        })
    }, [enrollmentsData, usersData])

    const enrolledLearners = React.useMemo(() => {
        return data.filter(e => e.hasPaid)
    }, [data])

    const pendingPayments = React.useMemo(() => {
        return data.filter(e => !e.hasPaid)
    }, [data])

    const count = data.length
    const loading = isLoadingEnrollments || (!!courseId && isLoadingCourse)

    const course = courseData
    const totalRevenue = React.useMemo(() => {
        return data.reduce((sum, enrollment) => sum + (enrollment.amountPaid || 0), 0) / 100
    }, [data])

    const formattedRevenue = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(totalRevenue)

    const visibleOptionalCount = [
        columnVisibility.certificateId,
        columnVisibility.utmSource,
        columnVisibility.profession,
        columnVisibility.createdAt,
    ].filter(Boolean).length;

    // Base 5xl (64rem) + ~10rem per extra column
    // 0: max-w-5xl (64rem/1024px)
    // 1: 74rem
    // 2: 84rem
    // 3: 94rem
    // 4: 104rem (approx 1664px)
    const maxWidthStyle = {
        maxWidth: `${64 + visibleOptionalCount * 12}rem`, // Adding 12rem (192px) per column for generous spacing
    };

    return (
        <div className="flex flex-1 flex-col gap-4 px-4 pb-20">
            <div
                className="mx-auto w-full flex flex-col gap-8 transition-[max-width] duration-300 ease-in-out"
                style={maxWidthStyle}
            >

                {/* Header Section */}
                {!!courseId && isLoadingCourse ? (
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1 py-4">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-8 w-64" />
                                <span className="text-muted-foreground mx-2">|</span>
                                <Skeleton className="h-5 w-32" />
                            </div>
                            <div className="flex flex-col gap-2 mt-2">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-4 w-40" />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button variant="outline" className="ml-auto" disabled>
                                <Columns className="w-4 h-4 mr-2" />
                                View Columns
                            </Button>
                        </div>
                    </div>
                ) : course ? (
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1 py-4">
                            <h2 className="text-xl font-semibold tracking-tight">
                                {course.title} <span className="text-muted-foreground mx-2">|</span> <span className="font-normal text-muted-foreground text-sm">Total Users: {count}</span>
                            </h2>
                            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <span>
                                        {course.startDate && !isNaN(new Date(course.startDate).getTime())
                                            ? format(new Date(course.startDate), "d MMM yyyy")
                                            : course.startDate || "-"}
                                        –
                                        {course.endDate && !isNaN(new Date(course.endDate).getTime())
                                            ? format(new Date(course.endDate), "d MMM yyyy")
                                            : course.endDate || "-"}
                                    </span>
                                    <span className="text-muted-foreground/50">|</span>
                                    <span>
                                        Class Time: {course.schedule && !isNaN(new Date(course.schedule).getTime())
                                            ? format(new Date(course.schedule), "h:mm a")
                                            : course.schedule || "-"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 font-medium text-foreground">
                                    <span>Revenue Generated:</span>
                                    <span>{formattedRevenue}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="ml-auto">
                                        <Columns className="w-4 h-4 mr-2" />
                                        View Columns
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuCheckboxItem
                                        checked={columnVisibility.profession}
                                        onCheckedChange={(checked) =>
                                            setColumnVisibility((prev) => ({ ...prev, profession: checked }))
                                        }
                                    >
                                        Profession
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={columnVisibility.utmSource}
                                        onCheckedChange={(checked) =>
                                            setColumnVisibility((prev) => ({ ...prev, utmSource: checked }))
                                        }
                                    >
                                        Source
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={columnVisibility.certificateId}
                                        onCheckedChange={(checked) =>
                                            setColumnVisibility((prev) => ({ ...prev, certificateId: checked }))
                                        }
                                    >
                                        Certificate
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={columnVisibility.createdAt}
                                        onCheckedChange={(checked) =>
                                            setColumnVisibility((prev) => ({ ...prev, createdAt: checked }))
                                        }
                                    >
                                        Enrollment Date
                                    </DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between py-4">
                        <h2 className="text-xl font-semibold tracking-tight">
                            Enrollments | <span className="font-normal text-muted-foreground text-sm">Total Users: {count}</span>
                        </h2>
                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="ml-auto">
                                        <Columns className="w-4 h-4 mr-2" />
                                        View Columns
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuCheckboxItem
                                        checked={columnVisibility.profession}
                                        onCheckedChange={(checked) =>
                                            setColumnVisibility((prev) => ({ ...prev, profession: checked }))
                                        }
                                    >
                                        Profession
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={columnVisibility.utmSource}
                                        onCheckedChange={(checked) =>
                                            setColumnVisibility((prev) => ({ ...prev, utmSource: checked }))
                                        }
                                    >
                                        Source
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={columnVisibility.certificateId}
                                        onCheckedChange={(checked) =>
                                            setColumnVisibility((prev) => ({ ...prev, certificateId: checked }))
                                        }
                                    >
                                        Certificate
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={columnVisibility.createdAt}
                                        onCheckedChange={(checked) =>
                                            setColumnVisibility((prev) => ({ ...prev, createdAt: checked }))
                                        }
                                    >
                                        Enrollment Date
                                    </DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button asChild>
                                <Link to="/admin/enrollments/create">Create Enrollment</Link>
                            </Button>
                        </div>
                    </div>
                )}

                {/* Enrolled Learners Table */}
                <EnrollmentTable
                    data={enrolledLearners}
                    title="Enrolled Learners"
                    loading={loading}
                    isUserLoading={isLoadingUsers}
                    columnVisibility={columnVisibility}
                    onColumnVisibilityChange={setColumnVisibility}
                />

                {/* Pending Payments Table */}
                <EnrollmentTable
                    data={pendingPayments}
                    title="Pending Payments"
                    loading={loading}
                    isUserLoading={isLoadingUsers}
                    columnVisibility={columnVisibility}
                    onColumnVisibilityChange={setColumnVisibility}
                />

            </div>
        </div>
    )
}
