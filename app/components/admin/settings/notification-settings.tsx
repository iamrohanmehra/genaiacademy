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
import { Textarea } from "~/components/ui/textarea";
import { Field, FieldLabel, FieldContent, FieldDescription } from "~/components/ui/field";

export function NotificationSettings() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Email & SMS</CardTitle>
                    <CardDescription>
                        Configure how you communicate with your users.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Field orientation="horizontal">
                        <FieldContent>
                            <FieldLabel htmlFor="enable-email">Enable Email Notifications</FieldLabel>
                            <FieldDescription>
                                Send automated emails for account verification, course updates, etc.
                            </FieldDescription>
                        </FieldContent>
                        <Switch id="enable-email" defaultChecked />
                    </Field>

                    <Field orientation="horizontal">
                        <FieldContent>
                            <FieldLabel htmlFor="enable-sms">Enable SMS Notifications</FieldLabel>
                            <FieldDescription>
                                Send text messages for critical alerts (requires SMS provider integration).
                            </FieldDescription>
                        </FieldContent>
                        <Switch id="enable-sms" />
                    </Field>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button>Save Changes</Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Templates</CardTitle>
                    <CardDescription>
                        Customize the content of automated messages.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Field>
                        <FieldLabel htmlFor="welcome-template">Welcome Email Template</FieldLabel>
                        <Textarea
                            id="welcome-template"
                            rows={5}
                            defaultValue="Welcome to GenAI Academy! We are excited to have you on board. Start exploring our courses today."
                        />
                        <FieldDescription>
                            You can use placeholders like {"{{name}}"} and {"{{platform_name}}"} in your template.
                        </FieldDescription>
                    </Field>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button>Save Changes</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
