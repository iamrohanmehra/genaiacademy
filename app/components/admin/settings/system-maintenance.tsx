import { Button } from "~/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card";
import { Switch } from "~/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { CheckCircle2, RotateCw } from "lucide-react";
import { Field, FieldLabel, FieldContent, FieldDescription } from "~/components/ui/field";

export function SystemMaintenance() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>System Status</CardTitle>
                    <CardDescription>
                        Current status of the platform and services.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert className="bg-green-50 text-green-900 border-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertTitle>All Systems Operational</AlertTitle>
                        <AlertDescription>
                            Database, API, and Storage services are running normally.
                        </AlertDescription>
                    </Alert>

                    <Field orientation="horizontal">
                        <FieldContent>
                            <FieldLabel htmlFor="maintenance-mode">Maintenance Mode</FieldLabel>
                            <FieldDescription>
                                Restrict access to the platform for all users except admins.
                            </FieldDescription>
                        </FieldContent>
                        <Switch id="maintenance-mode" />
                    </Field>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    {/* No save button needed here typically for status/actions, but kept for consistency if needed, or actions are immediate */}
                    <Button variant="outline" className="mr-auto"> <RotateCw className="mr-2 h-4 w-4" /> Clear Application Cache</Button>
                    <Button>Save Changes</Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>System Logs</CardTitle>
                    <CardDescription>
                        View recent system events and errors.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md bg-muted p-4 font-mono text-xs">
                        <p className="text-green-600">[2023-10-27 10:00:01] System backup completed successfully.</p>
                        <p>[2023-10-27 09:45:12] User ID 1234 logged in.</p>
                        <p className="text-yellow-600">[2023-10-27 09:30:00] Warning: High CPU usage detected.</p>
                        <p>[2023-10-27 08:15:00] Daily cron jobs executed.</p>
                        <p>[2023-10-27 08:15:00] Daily cron jobs executed.</p>
                        <p>[2023-10-27 08:15:00] Daily cron jobs executed.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
