"use client"

import * as React from "react"
import {
    Search,
    LayoutDashboard,
    Users,
    BookOpen,
    GraduationCap,
    PlusCircle,
} from "lucide-react"
import { useNavigate } from "react-router"

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "~/components/ui/command"
import { Button } from "~/components/ui/button"
import { cn } from "~/lib/utils"

export function SidebarSearch() {
    const [open, setOpen] = React.useState(false)
    const navigate = useNavigate()

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false)
        command()
    }, [])

    return (
        <>
            <Button
                variant="outline"
                className={cn(
                    "relative h-8 w-full justify-start rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-full"
                )}
                onClick={() => setOpen(true)}
            >
                <Search className="mr-2 h-4 w-4" />
                <span className="hidden lg:inline-flex">Search...</span>
                <span className="inline-flex lg:hidden">Search...</span>
                <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Type a command or search..." />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup heading="Pages">
                        <CommandItem
                            onSelect={() => runCommand(() => navigate("/admin/dashboard"))}
                        >
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => navigate("/admin/users"))}
                        >
                            <Users className="mr-2 h-4 w-4" />
                            <span>Users</span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => navigate("/admin/courses"))}
                        >
                            <BookOpen className="mr-2 h-4 w-4" />
                            <span>Courses</span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => navigate("/admin/enrollments"))}
                        >
                            <GraduationCap className="mr-2 h-4 w-4" />
                            <span>Enrollments</span>
                        </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Actions">
                        <CommandItem
                            onSelect={() => runCommand(() => navigate("/admin/users/create"))}
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            <span>Create User</span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => navigate("/admin/courses/create"))}
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            <span>Create Course</span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => navigate("/admin/enrollments/create"))}
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            <span>Create Enrollment</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    )
}
