import { useState } from "react";

import { Separator } from "~/components/ui/separator";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { GeneralSettings } from "~/components/admin/settings/general-settings";
import { UserSettings } from "~/components/admin/settings/user-settings";
import { CourseSettings } from "~/components/admin/settings/course-settings";
import { NotificationSettings } from "~/components/admin/settings/notification-settings";
import { PaymentSettings } from "~/components/admin/settings/payment-settings";
import { SecuritySettings } from "~/components/admin/settings/security-settings";
import { IntegrationSettings } from "~/components/admin/settings/integration-settings";
import { SystemMaintenance } from "~/components/admin/settings/system-maintenance";

export const meta = () => {
    return [{ title: "Settings - GenAI Academy" }];
};

type SettingsTab =
    | "general"
    | "user"
    | "course"
    | "notifications"
    | "payment"
    | "security"
    | "integrations"
    | "system";

const sidebarNavItems: { title: string; id: SettingsTab }[] = [
    { title: "General", id: "general" },
    { title: "User & Enrollment", id: "user" },
    { title: "Course", id: "course" },
    { title: "Notifications", id: "notifications" },
    { title: "Payment", id: "payment" },
    { title: "Security", id: "security" },
    { title: "Integrations", id: "integrations" },
    { title: "System Maintenance", id: "system" },
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>("general");

    return (
        <div className="flex flex-1 flex-col gap-4 px-4 pb-10">
            <div className="mx-auto w-full max-w-5xl flex flex-col gap-6">
                <div className="flex items-center justify-between py-4">
                    <div className="space-y-0.5">
                        <h2 className="text-xl font-semibold tracking-tight">Settings</h2>
                        <p className="text-muted-foreground text-sm">
                            Manage your platform settings and preferences.
                        </p>
                    </div>
                </div>

                <Separator />

                <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                    <aside className="-mx-4 lg:w-1/5">
                        <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1 overflow-x-auto px-4 lg:px-0 scrollbar-hide">
                            {sidebarNavItems.map((item) => (
                                <Button
                                    key={item.id}
                                    variant="ghost"
                                    className={cn(
                                        "justify-start text-left whitespace-nowrap",
                                        activeTab === item.id
                                            ? "bg-muted hover:bg-muted"
                                            : "hover:bg-transparent hover:underline"
                                    )}
                                    onClick={() => setActiveTab(item.id)}
                                >
                                    {item.title}
                                </Button>
                            ))}
                        </nav>
                    </aside>
                    <div className="flex-1 lg:max-w-4xl">
                        {activeTab === "general" && <GeneralSettings />}
                        {activeTab === "user" && <UserSettings />}
                        {activeTab === "course" && <CourseSettings />}
                        {activeTab === "notifications" && <NotificationSettings />}
                        {activeTab === "payment" && <PaymentSettings />}
                        {activeTab === "security" && <SecuritySettings />}
                        {activeTab === "integrations" && <IntegrationSettings />}
                        {activeTab === "system" && <SystemMaintenance />}
                    </div>
                </div>
            </div>
        </div>
    );
}
