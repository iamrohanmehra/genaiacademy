import { Button } from "~/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Switch } from "~/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Field, FieldLabel, FieldContent, FieldDescription } from "~/components/ui/field";

export function SecuritySettings() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Authentication</CardTitle>
                    <CardDescription>
                        Secure user accounts and login sessions.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Field orientation="horizontal">
                        <FieldContent>
                            <FieldLabel htmlFor="2fa">Two-Factor Authentication (2FA)</FieldLabel>
                            <FieldDescription>
                                Require users to verify their identity via a second method.
                            </FieldDescription>
                        </FieldContent>
                        <Switch id="2fa" />
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="session-timeout">Session Timeout</FieldLabel>
                        <Select defaultValue="30m">
                            <SelectTrigger id="session-timeout">
                                <SelectValue placeholder="Select timeout" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="15m">15 minutes</SelectItem>
                                <SelectItem value="30m">30 minutes</SelectItem>
                                <SelectItem value="1h">1 hour</SelectItem>
                                <SelectItem value="24h">24 hours</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button>Save Changes</Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Password Policy</CardTitle>
                    <CardDescription>
                        Enforce strong password requirements for your users.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Field>
                        <FieldLabel htmlFor="min-length">Minimum Length</FieldLabel>
                        <Input id="min-length" type="number" defaultValue="8" />
                    </Field>

                    <Field orientation="horizontal">
                        <FieldContent>
                            <FieldLabel htmlFor="special-chars">Require Special Characters</FieldLabel>
                        </FieldContent>
                        <Switch id="special-chars" defaultChecked />
                    </Field>

                    <Field orientation="horizontal">
                        <FieldContent>
                            <FieldLabel htmlFor="require-numbers">Require Numbers</FieldLabel>
                        </FieldContent>
                        <Switch id="require-numbers" defaultChecked />
                    </Field>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button>Save Changes</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
