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

export function GeneralSettings() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Platform Information</CardTitle>
                    <CardDescription>
                        Configure the general details of your LMS platform.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Field>
                        <FieldLabel htmlFor="platform-name">Platform Name</FieldLabel>
                        <Input id="platform-name" defaultValue="GenAI Academy" />
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="support-email">Support Email</FieldLabel>
                        <Input id="support-email" type="email" defaultValue="support@genaiacademy.com" />
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
                        <Input id="timezone" defaultValue="UTC" />
                    </Field>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button>Save Changes</Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Branding</CardTitle>
                    <CardDescription>
                        Customize the look and feel of your platform.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Field>
                        <FieldLabel htmlFor="brand-color">Brand Color</FieldLabel>
                        <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded border bg-blue-600"></div>
                            <Input id="brand-color" defaultValue="#2563EB" className="font-mono" />
                        </div>
                    </Field>
                    <Field>
                        <FieldLabel>Logo</FieldLabel>
                        <div className="flex items-center gap-4 rounded-md border border-dashed p-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                <span className="text-xs text-muted-foreground">Logo</span>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium">Upload new logo</p>
                                <p className="text-xs text-muted-foreground">SVG, PNG, JPG or GIF (max. 800x400px)</p>
                            </div>
                            <Button variant="outline" size="sm" className="ml-auto">Upload</Button>
                        </div>
                    </Field>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button>Save Changes</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
