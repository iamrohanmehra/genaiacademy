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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Field, FieldLabel, FieldDescription, FieldContent } from "~/components/ui/field";

export function UserSettings() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>User Registration</CardTitle>
                    <CardDescription>
                        Manage how new users join your platform.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Field orientation="horizontal">
                        <FieldContent>
                            <FieldLabel htmlFor="allow-registration">Allow new registrations</FieldLabel>
                            <FieldDescription>
                                Users can sign up for an account.
                            </FieldDescription>
                        </FieldContent>
                        <Switch id="allow-registration" defaultChecked />
                    </Field>

                    <Field orientation="horizontal">
                        <FieldContent>
                            <FieldLabel htmlFor="email-verification">Require email verification</FieldLabel>
                            <FieldDescription>
                                Users must verify their email before accessing the platform.
                            </FieldDescription>
                        </FieldContent>
                        <Switch id="email-verification" defaultChecked />
                    </Field>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button>Save Changes</Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Defaults</CardTitle>
                    <CardDescription>
                        Set default values for new users.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Field>
                        <FieldLabel htmlFor="default-role">Default User Role</FieldLabel>
                        <Select defaultValue="student">
                            <SelectTrigger id="default-role">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="instructor">Instructor</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button>Save Changes</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
