"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "~/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover"
import { api } from "~/lib/api.client"
import { queryKeys } from "~/lib/query-keys"
import { supabase } from "~/lib/supabase"
import { useDebounce } from "~/hooks/use-debounce"

type Course = {
    id: string
    title: string
    type: string
    status: string
}

interface CourseSearchProps {
    onSelect?: (course: Course) => void
    className?: string
}

export function CourseSearch({ onSelect, className }: CourseSearchProps) {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState("")
    const [searchQuery, setSearchQuery] = React.useState("")
    const debouncedSearch = useDebounce(searchQuery, 300)

    const { data: courses, isLoading } = useQuery({
        queryKey: queryKeys.courses.search(debouncedSearch),
        queryFn: async () => {
            if (!debouncedSearch) return []
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) return []

            const result = await api.get<{ data: Course[] }>(
                `/api/admin/courses/search?q=${debouncedSearch}`,
                token
            )
            return result.data
        },
        enabled: debouncedSearch.length > 0,
    })

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-[300px] justify-between", className)}
                >
                    {value
                        ? courses?.find((course) => course.title === value)?.title || value
                        : "Search courses..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Search courses..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                    />
                    <CommandList>
                        {isLoading && (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                        )}
                        {!isLoading && courses?.length === 0 && (
                            <CommandEmpty>No courses found.</CommandEmpty>
                        )}
                        <CommandGroup>
                            {courses?.map((course) => (
                                <CommandItem
                                    key={course.id}
                                    value={course.title}
                                    onSelect={(currentValue) => {
                                        setValue(currentValue === value ? "" : currentValue)
                                        setOpen(false)
                                        onSelect?.(course)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === course.title ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span>{course.title}</span>
                                        <span className="text-xs text-muted-foreground capitalize">{course.type} • {course.status}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
