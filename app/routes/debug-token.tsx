import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, AlertTriangle, Check } from "lucide-react";
import { supabase } from "~/lib/supabase";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export default function DebugTokenPage() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const copyToClipboard = () => {
        if (session?.access_token) {
            navigator.clipboard.writeText(session.access_token);
            setCopied(true);
            toast.success("Token copied to clipboard");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const targetEmail = "rohanmehra224466@gmail.com";
    const isTargetUser = session?.user?.email === targetEmail;

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="text-center">Loading session...</div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6 text-amber-500" />
                        <CardTitle>Debug: Bearer Token Viewer</CardTitle>
                    </div>
                    <CardDescription>
                        This is a temporary development page to view the current session token.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {!session ? (
                        <Alert variant="destructive">
                            <AlertTitle>Not Logged In</AlertTitle>
                            <AlertDescription>
                                No active session found. Please log in to view the token.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <Label>Current User</Label>
                                <div className="flex items-center gap-2 rounded-md border bg-muted p-2">
                                    <span className="font-mono">{session.user.email}</span>
                                    {isTargetUser ? (
                                        <span className="ml-auto flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-100">
                                            <Check className="h-3 w-3" /> Target User
                                        </span>
                                    ) : (
                                        <span className="ml-auto rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                                            Not Target User
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Bearer Token</Label>
                                <div className="relative">
                                    <div className="max-h-48 overflow-y-auto rounded-md border bg-muted p-4 font-mono text-xs break-all">
                                        {session.access_token}
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="absolute top-2 right-2 h-8 w-8 bg-background"
                                        onClick={copyToClipboard}
                                        aria-label="Copy token"
                                    >
                                        {copied ? (
                                            <Check className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <Alert>
                                <AlertTitle>Usage</AlertTitle>
                                <AlertDescription className="text-xs text-muted-foreground">
                                    Use this token in the Authorization header of your API requests:
                                    <br />
                                    <code className="mt-1 block rounded bg-muted px-1 py-0.5">
                                        Authorization: Bearer {session.access_token.substring(0, 20)}...
                                    </code>
                                </AlertDescription>
                            </Alert>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
