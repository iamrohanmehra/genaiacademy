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
import { Field, FieldLabel, FieldContent, FieldDescription } from "~/components/ui/field";

export function CourseSettings() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Course Configuration</CardTitle>
                    <CardDescription>
                        Manage default settings for courses.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Field orientation="horizontal">
                        <FieldContent>
                            <FieldLabel htmlFor="review-required">Review required for publish</FieldLabel>
                            <FieldDescription>
                                Courses must be approved by an admin before going live.
                            </FieldDescription>
                        </FieldContent>
                        <Switch id="review-required" defaultChecked />
                    </Field>

                    <Field orientation="horizontal">
                        <FieldContent>
                            <FieldLabel htmlFor="enable-comments">Enable course comments</FieldLabel>
                            <FieldDescription>
                                Allow students to leave comments and discussions on courses.
                            </FieldDescription>
                        </FieldContent>
                        <Switch id="enable-comments" defaultChecked />
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="default-duration">Default Course Duration (Weeks)</FieldLabel>
                        <Input id="default-duration" type="number" defaultValue="4" />
                    </Field>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button>Save Changes</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
