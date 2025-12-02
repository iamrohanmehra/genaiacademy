import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "~/lib/api.client";
import { queryKeys } from "~/lib/query-keys";
import { supabase } from "~/lib/supabase";
import { useNavigate, useParams, Link } from "react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { EditEnrollmentDialog } from "~/components/admin/enrollments/edit-enrollment-dialog";
import { DeleteEnrollmentDialog } from "~/components/admin/enrollments/delete-enrollment-dialog";
import { EditProgressDialog } from "~/components/admin/enrollments/edit-progress-dialog";

export default function EnrollmentDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data, isLoading, isError, error } = useQuery({
        queryKey: queryKeys.enrollments.detail(id!),
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                throw new ApiError("Unauthorized", 401);
            }

            if (!id) throw new Error("Enrollment ID is required");

            return api.getEnrollmentById(id, token);
        },
        enabled: !!id,
        retry: (failureCount, error) => {
            if (error instanceof ApiError && error.status === 401) {
                return false;
            }
            return failureCount < 3;
        },
    });

    const { data: progressData, isLoading: isProgressLoading } = useQuery({
        queryKey: queryKeys.enrollments.progress(id!),
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) throw new ApiError("Unauthorized", 401);
            if (!id) throw new Error("Enrollment ID is required");
            return api.getCourseProgress(id, token);
        },
        enabled: !!id,
    });

    useEffect(() => {
        if (isError && error) {
            if (error instanceof ApiError && error.status === 401) {
                toast.error("Session expired. Please login again.");
                navigate("/login");
            } else {
                toast.error("Failed to load enrollment details.");
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

    if (isError || !data?.data) {
        return (
            <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="outline" size="icon" asChild>
                        <Link to="/admin/enrollments">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold text-red-500">Error loading enrollment</h1>
                </div>
            </div>
        );
    }

    const enrollment = data.data;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link to="/admin/enrollments">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Enrollment Details</h1>
                </div>
                <div className="flex items-center gap-2">
                    <EditEnrollmentDialog enrollment={enrollment} />
                    <DeleteEnrollmentDialog enrollmentId={enrollment.id} />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>General Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">ID</label>
                                <div className="font-mono text-sm">{enrollment.id}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Status</label>
                                <div>
                                    <Badge variant={enrollment.status === "active" ? "default" : "destructive"}>
                                        {enrollment.status}
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">User ID</label>
                                <div className="font-mono text-sm">{enrollment.userId}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Course ID</label>
                                <div className="font-mono text-sm">{enrollment.courseId}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Created At</label>
                                <div>{format(new Date(enrollment.createdAt), "PPP p")}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Updated At</label>
                                <div>{format(new Date(enrollment.updatedAt), "PPP p")}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Payment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Amount Paid</label>
                                <div className="text-lg font-semibold">
                                    {(enrollment.amountPaid / 100).toLocaleString("en-IN", {
                                        style: "currency",
                                        currency: "INR",
                                    })}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Payment Status</label>
                                <div>
                                    <Badge variant={enrollment.hasPaid ? "outline" : "secondary"}>
                                        {enrollment.hasPaid ? "Paid" : "Pending"}
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Paid At</label>
                                <div>{enrollment.paidAt ? format(new Date(enrollment.paidAt), "PPP p") : "-"}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Transaction ID</label>
                                <div className="font-mono text-sm">{enrollment.transactionId || "-"}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                                <div className="capitalize">{enrollment.paymentMethod || "-"}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Invoice ID</label>
                                <div className="font-mono text-sm">{enrollment.invoiceId || "-"}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Progress & Access</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Progress</label>
                                <div className="text-lg font-semibold">{enrollment.progress || 0}%</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">XP Earned</label>
                                <div className="text-lg font-semibold">{enrollment.xp || 0}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Time Spent</label>
                                <div>{enrollment.timeSpent ? `${Math.round(enrollment.timeSpent / 60)} mins` : "0 mins"}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Access Starts</label>
                                <div>{enrollment.accessOnDate ? format(new Date(enrollment.accessOnDate), "PPP") : "-"}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Access Ends</label>
                                <div>{enrollment.accessTillDate ? format(new Date(enrollment.accessTillDate), "PPP") : "-"}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Certificate</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Certificate ID</label>
                                <div className="font-mono text-sm">{enrollment.certificateId || "-"}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Generated At</label>
                                <div>{enrollment.certificateGeneratedAt ? format(new Date(enrollment.certificateGeneratedAt), "PPP p") : "-"}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Detailed Course Progress</CardTitle>
                </CardHeader>
                <CardContent>
                    {isProgressLoading ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                    ) : progressData?.data ? (
                        <div className="space-y-6">
                            {progressData.data.map((section) => (
                                <div key={section.id} className="space-y-2">
                                    <h3 className="font-semibold text-lg">{section.title}</h3>
                                    <div className="border rounded-md divide-y">
                                        {section.contents.map((content) => (
                                            <div key={content.id} className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${content.progress?.status === 'completed' ? 'bg-green-500' : content.progress?.status === 'inProgress' ? 'bg-yellow-500' : 'bg-gray-300'}`} />
                                                    <span className="font-medium">{content.title}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    {content.progress ? (
                                                        <>
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-mono">{Math.round(content.progress.timeSpent / 60)}m</span>
                                                            </div>
                                                            <Badge variant={content.progress.status === 'completed' ? 'default' : 'secondary'}>
                                                                {content.progress.status === 'completed' ? 'Completed' : 'In Progress'}
                                                            </Badge>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs">Not Started</span>
                                                    )}
                                                    <EditProgressDialog
                                                        enrollmentId={enrollment.id}
                                                        contentId={content.id}
                                                        contentTitle={content.title}
                                                        currentProgress={content.progress}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-4">
                            No progress data available.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
