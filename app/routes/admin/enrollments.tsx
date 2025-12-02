import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api, ApiError } from "~/lib/api.client";
import { queryKeys } from "~/lib/query-keys";
import { supabase } from "~/lib/supabase";
import { useNavigate, Link } from "react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

export default function EnrollmentsPage() {
    const navigate = useNavigate();
    const { data, isLoading, isError, error } = useQuery({
        queryKey: queryKeys.enrollments.all,
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                throw new ApiError("Unauthorized", 401);
            }

            return api.getEnrollments(token);
        },
        retry: (failureCount, error) => {
            if (error instanceof ApiError && error.status === 401) {
                return false;
            }
            return failureCount < 3;
        },
    });

    useEffect(() => {
        if (isError && error) {
            if (error instanceof ApiError && error.status === 401) {
                toast.error("Session expired. Please login again.");
                navigate("/login");
            } else {
                toast.error("Failed to load enrollments.");
            }
        }
    }, [isError, error, navigate]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex items-center justify-center h-full text-red-500">
                Failed to load enrollments.
            </div>
        );
    }

    const enrollments = data?.data || [];

    return (
        <div className="p-6 space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Enrollments</CardTitle>
                    <Button asChild>
                        <Link to="/admin/enrollments/create">Create Enrollment</Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User ID</TableHead>
                                <TableHead>Course ID</TableHead>
                                <TableHead>Amount Paid</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Payment Date</TableHead>
                                <TableHead>Progress</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {enrollments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">
                                        No enrollments found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                enrollments.map((enrollment) => (
                                    <TableRow key={enrollment.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/enrollments/${enrollment.id}`)}>
                                        <TableCell className="font-mono text-xs">{enrollment.userId}</TableCell>
                                        <TableCell className="font-mono text-xs">{enrollment.courseId}</TableCell>
                                        <TableCell>
                                            {(enrollment.amountPaid / 100).toLocaleString("en-IN", {
                                                style: "currency",
                                                currency: "INR",
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={enrollment.status === "active" ? "default" : "destructive"}>
                                                {enrollment.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {enrollment.paidAt ? format(new Date(enrollment.paidAt), "PPP") : "-"}
                                        </TableCell>
                                        <TableCell>{enrollment.progress || 0}%</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
