import { useNavigate, useParams, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "~/lib/api.client";
import { queryKeys } from "~/lib/query-keys";
import { supabase } from "~/lib/supabase";
import { toast } from "sonner";
import { useEffect } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "~/components/ui/button";

import { EditEnrollmentForm } from "~/components/admin/enrollments/edit-enrollment-form";
import type { User } from "~/types/user";
import type { Course } from "~/types/course";

export default function EditEnrollmentPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: enrollmentData, isLoading: isLoadingEnrollment, isError, error } = useQuery({
        queryKey: queryKeys.enrollments.detail(id!),
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) throw new ApiError("Unauthorized", 401);
            if (!id) throw new Error("Enrollment ID is required");
            return api.getEnrollmentById(id, token);
        },
        enabled: !!id,
    });

    const enrollment = enrollmentData?.data;

    // Fetch User Details
    const { data: userData } = useQuery({
        queryKey: ['users', enrollment?.userId],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) throw new Error("Unauthorized");
            return api.getUserById(enrollment!.userId, token);
        },
        enabled: !!enrollment?.userId,
    });

    // Fetch Course Details
    const { data: courseData } = useQuery({
        queryKey: queryKeys.courses.detail(enrollment?.courseId || ''),
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) throw new Error("Unauthorized");
            return api.getCourseById(enrollment!.courseId, token);
        },
        enabled: !!enrollment?.courseId,
    });

    const user = userData?.data as User | undefined;
    const course = courseData?.data as Course | undefined;

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

    if (isLoadingEnrollment) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (isError || !enrollment) {
        return (
            <div className="flex flex-1 flex-col gap-8 p-8 max-w-xl mx-auto w-full">
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

    return (
        <div className="flex flex-1 flex-col gap-8 p-8 max-w-xl mx-auto w-full">
            <div className="flex flex-col gap-6">
                {/* Header Section */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">{course?.title || 'Loading Course...'}</h1>
                    <p className="text-muted-foreground">Update payment and enrollment details for this learner.</p>
                </div>

                {/* Info Stack - Learner & Course Meta */}
                <div className="flex flex-col gap-1 text-sm mt-2">
                    <span className="font-medium">{user?.name || 'Loading...'}</span>
                    <span className="text-muted-foreground">{user?.email || 'Loading...'}</span>
                    <span className="text-muted-foreground">{user?.mobile || '-'}</span>
                </div>
            </div>

            <div className="space-y-6">
                <EditEnrollmentForm
                    enrollment={enrollment}
                    course={course}
                    user={user}
                    onSuccess={() => navigate("/admin/enrollments")}
                    onCancel={() => navigate("/admin/enrollments")}
                />
            </div>
        </div>
    );
}
