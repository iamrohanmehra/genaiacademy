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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Field, FieldLabel } from "~/components/ui/field";

export function PaymentSettings() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Currency & Localization</CardTitle>
                    <CardDescription>
                        Set the default currency for your platform pricing.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Field>
                        <FieldLabel htmlFor="currency">Currency</FieldLabel>
                        <Select defaultValue="usd">
                            <SelectTrigger id="currency">
                                <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="usd">USD ($)</SelectItem>
                                <SelectItem value="eur">EUR (€)</SelectItem>
                                <SelectItem value="inr">INR (₹)</SelectItem>
                                <SelectItem value="gbp">GBP (£)</SelectItem>
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
                    <CardTitle>Payment Gateway</CardTitle>
                    <CardDescription>
                        Configure your payment provider to accept payments.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Field>
                        <FieldLabel htmlFor="gateway-provider">Provider</FieldLabel>
                        <Select defaultValue="stripe">
                            <SelectTrigger id="gateway-provider">
                                <SelectValue placeholder="Select provider" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="stripe">Stripe</SelectItem>
                                <SelectItem value="paypal">PayPal</SelectItem>
                                <SelectItem value="razorpay">Razorpay</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="api-key">API Key</FieldLabel>
                        <Input id="api-key" type="password" placeholder="pk_test_..." />
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="api-secret">API Secret</FieldLabel>
                        <Input id="api-secret" type="password" placeholder="sk_test_..." />
                    </Field>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button>Save Changes</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
