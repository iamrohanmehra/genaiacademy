"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router"

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
import { useDebounce } from "~/hooks/use-debounce"
import { supabase } from "~/lib/supabase"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"

type UserSearchResult = {
    id: string
    name: string
    email: string
    mobile: string | null
    avatar: string | null
}

export function UserEmailSearch() {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState("")
    const debouncedQuery = useDebounce(query, 300)
    const navigate = useNavigate()

    const { data, isLoading } = useQuery({
        queryKey: queryKeys.users.searchByEmail(debouncedQuery),
        queryFn: async () => {
            if (!debouncedQuery) return []
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) return []

            const response = await api.get<{ success: boolean; data: UserSearchResult[] }>(
                `/api/admin/users/search/email?q=${debouncedQuery}`,
                token
            )
            return response.data
        },
        enabled: debouncedQuery.length > 0,
    })

    const users = data || []

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[300px] justify-between"
                >
                    {query ? query : "Search user by email..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Type email to search..."
                        value={query}
                        onValueChange={setQuery}
                    />
                    <CommandList>
                        {isLoading && (
                            <div className="py-6 text-center text-sm">
                                <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                                Searching...
                            </div>
                        )}
                        {!isLoading && users.length === 0 && debouncedQuery && (
                            <CommandEmpty>No user found.</CommandEmpty>
                        )}
                        {!isLoading && users.length > 0 && (
                            <CommandGroup heading="Users">
                                {users.map((user) => (
                                    <CommandItem
                                        key={user.id}
                                        value={user.email}
                                        onSelect={() => {
                                            navigate(`/admin/users/${user.id}`)
                                            setOpen(false)
                                        }}
                                    >
                                        <div className="flex items-center gap-2 w-full">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={user.avatar || undefined} />
                                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="truncate font-medium">{user.name}</span>
                                                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                                            </div>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
