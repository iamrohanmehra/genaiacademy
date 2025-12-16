import { Outlet, useNavigate } from "react-router";
import { useEffect } from "react";
import { AppSidebar } from "~/components/app-sidebar";
import { SiteHeader } from "~/components/site-header";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { useAuth } from "~/hooks/useAuth";
import { Loader2 } from "lucide-react";

export default function AdminLayout() {
    const { user, role, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                navigate("/login");
            } else if (role !== "admin") {
                navigate("/student/dashboard");
            }
        }
    }, [user, role, loading, navigate]);

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Prevent flash of admin content
    if (!user || role !== "admin") {
        return null;
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col gap-4 px-2 md:px-4 pb-10">
                    <Outlet />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
