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
import { Field, FieldLabel } from "~/components/ui/field";

export function IntegrationSettings() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Analytics</CardTitle>
                    <CardDescription>
                        Connect external analytics tools.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Field>
                        <FieldLabel htmlFor="ga-id">Google Analytics ID</FieldLabel>
                        <Input id="ga-id" placeholder="G-XXXXXXXXXX" />
                    </Field>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button>Save Changes</Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Communication</CardTitle>
                    <CardDescription>
                        Integrate with chat and messaging platforms.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Field>
                        <FieldLabel htmlFor="slack-webhook">Slack Webhook URL</FieldLabel>
                        <Input id="slack-webhook" placeholder="https://hooks.slack.com/services/..." />
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="discord-webhook">Discord Webhook URL</FieldLabel>
                        <Input id="discord-webhook" placeholder="https://discord.com/api/webhooks/..." />
                    </Field>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button>Save Changes</Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Video Conferencing</CardTitle>
                    <CardDescription>
                        Connect Zoom for live classes.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Field>
                        <FieldLabel htmlFor="zoom-api-key">Zoom API Key</FieldLabel>
                        <Input id="zoom-api-key" type="password" />
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="zoom-api-secret">Zoom API Secret</FieldLabel>
                        <Input id="zoom-api-secret" type="password" />
                    </Field>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button>Save Changes</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
