"use client"

import { useState, useEffect, Suspense, lazy } from "react"
import { useParams, Link } from "react-router"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    type DragStartEvent,
    type DragOverEvent,
    type DragEndEvent,
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
    GripVertical,
    Plus,
    Trash2,
    ChevronRight,
    ChevronDown,
    Save,
    ArrowLeft,
    FileText,
    Video,
    Calendar as CalendarIcon,
    Loader2
} from "lucide-react"
import { toast } from "sonner"
import { format, isValid } from "date-fns"
import { useQuery, useMutation, useQueryClient, useQueries } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
import { z } from "zod"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
// import { Textarea } from "~/components/ui/textarea"

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog"
import {
    Field,
    FieldLabel,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldSeparator,
} from "~/components/ui/field"

import { TiptapEditor } from "~/components/tiptap-editor"
import React from "react"
const Calendar = lazy(() => import("~/components/ui/calendar").then(module => ({ default: module.Calendar })))
import { api, ApiError } from "~/lib/api.client"
import { queryKeys } from "~/lib/query-keys"
import { cn } from "~/lib/utils"
import { supabase } from "~/lib/supabase"

import { Label } from "~/components/ui/label"


// --- Types ---

import type { CourseSection, CourseContent } from "~/types/course"

type SectionWithContent = CourseSection & {
    chapters: CourseContent[]
    isExpanded: boolean
}

// --- Zod Schema ---

const chapterSchema = z.object({
    title: z.string().min(1, "Title is required"),
    desc: z.string().optional(),
    type: z.enum(["video", "liveClass", "assignment", "article"]),
    videoLink: z.string().url("Invalid URL").optional().or(z.literal("")),
    xp: z.number().min(0).optional(),
    accessOn: z.number().min(0).optional(),
    accessTill: z.number().min(0).optional().nullable(),
    accessOnDate: z.string().optional().nullable(),
    accessTillDate: z.string().optional().nullable(),
})

type ChapterFormValues = z.infer<typeof chapterSchema>

// --- Sub-components ---

function SortableSection({
    section,
    onToggle,
    onDelete,
    onAddChapter,
    children,
}: {
    section: SectionWithContent
    onToggle: (id: string) => void
    onDelete: (id: string) => void
    onAddChapter: (sectionId: string) => void
    children: React.ReactNode
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: section.id, data: { type: "SECTION", section } })

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group mb-4 overflow-hidden border bg-background text-foreground rounded-md",
                isDragging && "opacity-50 z-50 border-primary shadow-lg",
            )}
        >
            <div className="flex items-center gap-2 p-3">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab text-muted-foreground hover:text-foreground"
                    aria-label="Drag to reorder section"
                >
                    <GripVertical className="h-5 w-5" />
                </button>
                <button
                    onClick={() => onToggle(section.id)}
                    className="flex items-center gap-2 font-medium hover:underline cursor-pointer"
                >
                    {section.isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                    {section.title}
                </button>
                <div className="ml-auto flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onAddChapter(section.id)}
                        title="Add Chapter"
                        aria-label="Add Chapter"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(section.id)}
                        className="text-destructive hover:text-destructive"
                        title="Delete Section"
                        aria-label="Delete Section"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            {section.isExpanded && <div className="p-2 pt-0 pl-8">{children}</div>}
        </div>
    )
}

function SortableChapter({
    chapter,
    isSelected,
    onClick,
    onDelete,
}: {
    chapter: CourseContent
    isSelected: boolean
    onClick: () => void
    onDelete: (e: React.MouseEvent) => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: chapter.id, data: { type: "CHAPTER", chapter } })

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={onClick}
            className={cn(
                "group/chapter mb-1 flex cursor-pointer items-center gap-2 border border-transparent px-2 py-1.5 text-sm transition-colors hover:bg-muted/50 rounded-md",
                isSelected && "bg-primary/5 text-primary font-medium hover:bg-primary/5",
                !isSelected && "hover:border-border",
                isDragging && "opacity-50",
            )}
        >
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab text-muted-foreground hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
                aria-label="Drag to reorder chapter"
            >
                <GripVertical className="h-4 w-4" />
            </button>
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 truncate">{chapter.title}</span>
            <button
                onClick={onDelete}
                className="text-muted-foreground hover:text-destructive cursor-pointer"
                aria-label="Delete chapter"
            >
                <Trash2 className="h-4 w-4" />
            </button>
        </div>
    )
}

function ChapterEditForm({
    chapter,
    onSave,
    onDelete,
    onTitleChange,
}: {
    chapter: CourseContent
    onSave: (data: Partial<CourseContent>) => void
    onDelete: () => void
    onTitleChange: (title: string) => void
}) {
    const {
        register,
        control,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<ChapterFormValues>({
        resolver: zodResolver(chapterSchema),
        defaultValues: {
            title: chapter.title,
            desc: chapter.desc || "",
            type: chapter.type,
            videoLink: chapter.videoLink || "",
            xp: chapter.xp || 0,
            accessOn: chapter.accessOn || 0,
            accessTill: chapter.accessTill,
            accessOnDate: chapter.accessOnDate,
            accessTillDate: chapter.accessTillDate,
        },
    })

    // Sync title change for sidebar preview
    React.useEffect(() => {
        const subscription = watch((value, { name, type }) => {
            if (name === "title" && value.title) {
                onTitleChange(value.title)
            }
        })
        return () => subscription.unsubscribe()
    }, [watch, onTitleChange])

    const onSubmit = (data: ChapterFormValues) => {
        // Sanitize data: allow null in form for UX, but convert to undefined or matches Type for API
        // If the type expects undefined for "empty", we convert null (from empty input) to undefined.
        const payload = {
            ...data,
            accessTill: data.accessTill ?? undefined,
            accessOnDate: data.accessOnDate ?? undefined,
            accessTillDate: data.accessTillDate ?? undefined,
        }
        onSave(payload)
    }

    const renderDatePicker = (name: "accessOnDate" | "accessTillDate", label: string) => (
        <Controller
            control={control}
            name={name}
            render={({ field }) => (
                <Field className="flex flex-col">
                    <FieldLabel>{label}</FieldLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                            >
                                {field.value && isValid(new Date(field.value)) ? (
                                    format(new Date(field.value), "PPP")
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Suspense fallback={<div className="p-4 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
                                <Calendar
                                    mode="single"
                                    selected={field.value ? new Date(field.value) : undefined}
                                    onSelect={(date) => field.onChange(date?.toISOString() ?? null)}
                                    initialFocus
                                />
                            </Suspense>
                        </PopoverContent>
                    </Popover>
                    <FieldError errors={[errors[name]]} />
                </Field>
            )}
        />
    )

    return (
        <>
            <form id="chapter-form" onSubmit={handleSubmit(onSubmit)} className="contents">
                <div className="border-b px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="font-semibold leading-none tracking-tight">Edit Chapter</h3>
                            <p className="text-sm text-muted-foreground">
                                {chapter.title}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={onDelete}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                            <Button type="submit" size="sm">
                                <Save className="mr-2 h-4 w-4" />
                                Save
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    <FieldGroup>
                        <Field>
                            <FieldLabel>Chapter Title</FieldLabel>
                            <Input placeholder="e.g. Introduction to React" {...register("title")} />
                            <FieldError errors={[errors.title]} />
                        </Field>

                        <div className="grid gap-6 md:grid-cols-2">
                            <Controller
                                control={control}
                                name="type"
                                render={({ field }) => (
                                    <Field>
                                        <FieldLabel>Content Type</FieldLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="video">Video</SelectItem>
                                                <SelectItem value="liveClass">Live Class</SelectItem>
                                                <SelectItem value="assignment">Assignment</SelectItem>
                                                <SelectItem value="article">Article</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FieldError errors={[errors.type]} />
                                    </Field>
                                )}
                            />

                            <Field>
                                <FieldLabel>XP (Experience Points)</FieldLabel>
                                <Input
                                    type="number"
                                    placeholder="e.g. 50"
                                    {...register("xp", { valueAsNumber: true })}
                                />
                                <FieldError errors={[errors.xp]} />
                            </Field>
                        </div>

                        <Field>
                            <FieldLabel>Content (Rich Text)</FieldLabel>
                            <Controller
                                control={control}
                                name="desc"
                                render={({ field }) => (
                                    <TiptapEditor
                                        value={field.value || ''}
                                        onChange={field.onChange}
                                    />
                                )}
                            />
                            <FieldError errors={[errors.desc]} />
                        </Field>

                        <Field>
                            <FieldLabel>Video Link</FieldLabel>
                            <div className="flex items-center gap-2">
                                <Video className="h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Video URL"
                                    {...register("videoLink")}
                                />
                            </div>
                            <FieldError errors={[errors.videoLink]} />
                        </Field>

                        <FieldSeparator>Access Control</FieldSeparator>

                        <div className="grid gap-6 md:grid-cols-2">
                            <Field>
                                <FieldLabel>Access On (Days after enrollment)</FieldLabel>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    {...register("accessOn", { valueAsNumber: true })}
                                />
                                <FieldError errors={[errors.accessOn]} />
                            </Field>

                            <Field>
                                <FieldLabel>Access Till (Days duration)</FieldLabel>
                                <Input
                                    type="number"
                                    placeholder="Unlimited"
                                    {...register("accessTill", {
                                        setValueAs: (v) => v === "" ? null : parseInt(v, 10)
                                    })}
                                />
                                <FieldError errors={[errors.accessTill]} />
                            </Field>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            {renderDatePicker("accessOnDate", "Access Starts On (Specific Date)")}
                            {renderDatePicker("accessTillDate", "Access Ends On (Specific Date)")}
                        </div>
                    </FieldGroup>
                </div>
            </form>
        </>
    )
}


// --- Main Component ---

export default function CourseContentPage() {
    const { id: courseId } = useParams()
    const [sections, setSections] = useState<SectionWithContent[]>([])
    const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)
    const queryClient = useQueryClient()

    // Fetch Sections
    const { data: sectionsData } = useQuery({
        queryKey: queryKeys.courses.sections(courseId || ''),
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) throw new ApiError("Unauthorized", 401)
            return api.get<{ data: CourseSection[] }>(`/api/admin/courses/${courseId}/sections`, token)
        },
        enabled: !!courseId,
    })

    const sectionIds = sectionsData?.data?.map(s => s.id) || []

    // Fetch Content for each section
    const contentQueries = useQueries({
        queries: sectionIds.map(sectionId => ({
            queryKey: queryKeys.courses.sectionContent(sectionId),
            queryFn: async () => {
                const { data: { session } } = await supabase.auth.getSession()
                const token = session?.access_token
                if (!token) throw new ApiError("Unauthorized", 401)
                return api.get<{ data: CourseContent[] }>(`/api/admin/sections/${sectionId}/content`, token)
            },
        }))
    })



    const contentData = contentQueries.map(q => q.data)

    // Combine Data
    useEffect(() => {
        if (sectionsData?.data) {
            setSections(prevSections => {
                // If we have previous sections, try to preserve expand state
                const expandState = new Map(prevSections.map(s => [s.id, s.isExpanded]))

                const combined: SectionWithContent[] = sectionsData.data.map((section, index) => {
                    const chapters = contentData[index]?.data || []

                    return {
                        ...section,
                        isExpanded: expandState.has(section.id) ? expandState.get(section.id)! : true, // Default to expanded
                        chapters: chapters.sort((a, b) => a.order - b.order)
                    }
                }).sort((a, b) => a.order - b.order)

                return combined
            })
        }
    }, [sectionsData, JSON.stringify(contentData)])

    // --- Mutations ---

    const createSectionMutation = useMutation({
        mutationFn: async (title: string) => {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) throw new ApiError("Unauthorized", 401)
            return api.post<{ data: CourseSection }>(`/api/admin/courses/${courseId}/sections`, {
                title,
                order: sections.length + 1
            }, token)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.courses.sections(courseId!) })
            toast.success("Section created")
        },
        onError: (error: ApiError) => toast.error(error.message)
    })

    const deleteSectionMutation = useMutation({
        mutationFn: async (sectionId: string) => {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) throw new ApiError("Unauthorized", 401)
            return api.delete(`/api/admin/sections/${sectionId}`, token)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.courses.sections(courseId!) })
            toast.success("Section deleted")
        },
        onError: (error: ApiError) => toast.error(error.message)
    })

    const updateSectionMutation = useMutation({
        mutationFn: async ({ id, title }: { id: string, title: string }) => {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) throw new ApiError("Unauthorized", 401)
            return api.put(`/api/admin/sections/${id}`, { title }, token)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.courses.sections(courseId!) })
        },
        onError: (error: ApiError) => toast.error(error.message)
    })

    const createChapterMutation = useMutation({
        mutationFn: async (sectionId: string) => {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) throw new ApiError("Unauthorized", 401)
            return api.post<{ data: CourseContent }>(`/api/admin/sections/${sectionId}/content`, {
                courseId,
                title: "New Chapter",
                type: "video",
                order: (sections.find(s => s.id === sectionId)?.chapters.length || 0) + 1
            }, token)
        },
        onSuccess: (data, sectionId) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.courses.sectionContent(sectionId) })
            setSelectedChapterId(data.data.id)
            toast.success("Chapter added")
        },
        onError: (error: ApiError) => toast.error(error.message)
    })

    const deleteChapterMutation = useMutation({
        mutationFn: async (chapterId: string) => {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) throw new ApiError("Unauthorized", 401)
            return api.delete(`/api/admin/content/${chapterId}`, token)
        },
        onSuccess: (data, deletedChapterId) => {
            sectionIds.forEach(id => queryClient.invalidateQueries({ queryKey: queryKeys.courses.sectionContent(id) }))

            if (selectedChapterId === deletedChapterId) {
                setSelectedChapterId(null)
            }
            toast.success("Chapter deleted")
        },
        onError: (error: ApiError) => toast.error(error.message)
    })
    const updateChapterMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: Partial<CourseContent> }) => {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) throw new ApiError("Unauthorized", 401)
            return api.put(`/api/admin/content/${id}`, data, token)
        },
        onSuccess: (data, variables) => {
            // Invalidate the specific section and the content detail
            const chapter = sections.flatMap(s => s.chapters).find(c => c.id === variables.id)
            if (chapter) {
                queryClient.invalidateQueries({ queryKey: queryKeys.courses.sectionContent(chapter.sectionId) })
            } else {
                sectionIds.forEach(id => queryClient.invalidateQueries({ queryKey: queryKeys.courses.sectionContent(id) }))
            }
            queryClient.invalidateQueries({ queryKey: queryKeys.courses.contentDetail(variables.id) })
            toast.success("Chapter saved")
        },
        onError: (error: ApiError) => toast.error(error.message)
    })

    const reorderMutation = useMutation({
        mutationFn: async (payload: { type: 'section' | 'content', sortedOrder: { id: string, order: number }[] }) => {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) throw new ApiError("Unauthorized", 401)
            return api.put('/api/admin/sort-order', payload, token)
        },
        onSuccess: () => {
            // Optimistic update handled by local state, but we should invalidate to be safe
            queryClient.invalidateQueries({ queryKey: queryKeys.courses.sections(courseId!) })
            sectionIds.forEach(id => queryClient.invalidateQueries({ queryKey: queryKeys.courses.sectionContent(id) }))
        },
        onError: (error: ApiError) => toast.error(error.message)
    })


    const [activeDragId, setActiveDragId] = useState<string | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<{
        open: boolean;
        type: 'section' | 'chapter' | null;
        id: string | null;
        title: string;
    }>({ open: false, type: null, id: null, title: '' })

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // --- Actions ---

    const handleAddSection = () => {
        createSectionMutation.mutate("New Section")
    }

    const handleDeleteSection = (sectionId: string) => {
        const section = sections.find(s => s.id === sectionId)
        setDeleteConfirm({
            open: true,
            type: 'section',
            id: sectionId,
            title: section?.title || 'Section'
        })
    }

    const handleToggleSection = (sectionId: string) => {
        setSections(
            sections.map((s) =>
                s.id === sectionId ? { ...s, isExpanded: !s.isExpanded } : s
            )
        )
    }

    const handleAddChapter = (sectionId: string) => {
        createChapterMutation.mutate(sectionId)
    }

    const handleDeleteChapter = (chapterId: string) => {
        const chapter = sections.flatMap(s => s.chapters).find(c => c.id === chapterId)
        setDeleteConfirm({
            open: true,
            type: 'chapter',
            id: chapterId,
            title: chapter?.title || 'Chapter'
        })
    }

    const handleOptimisticTitleUpdate = (title: string) => {
        if (!selectedChapterId) return
        setSections(
            sections.map((s) => ({
                ...s,
                chapters: s.chapters.map((c) =>
                    c.id === selectedChapterId ? { ...c, title } : c
                ),
            }))
        )
    }

    const handleUpdateSectionTitle = (sectionId: string, title: string) => {
        // Optimistic update
        setSections(
            sections.map((s) => (s.id === sectionId ? { ...s, title } : s))
        )
    }

    // Helper for title update on blur
    const handleSectionTitleBlur = (sectionId: string, title: string) => {
        updateSectionMutation.mutate({ id: sectionId, title })
    }

    const handleSaveChapter = (data: Partial<CourseContent>) => {
        if (!selectedChapterId) return
        updateChapterMutation.mutate({ id: selectedChapterId, data })
    }

    const handleConfirmDelete = () => {
        if (deleteConfirm.type === 'section' && deleteConfirm.id) {
            deleteSectionMutation.mutate(deleteConfirm.id)
        } else if (deleteConfirm.type === 'chapter' && deleteConfirm.id) {
            deleteChapterMutation.mutate(deleteConfirm.id)
        }
        setDeleteConfirm({ open: false, type: null, id: null, title: '' }) // Reset state
    }

    // --- Drag and Drop Logic ---

    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragId(event.active.id as string)
    }

    const handleDragOver = (event: DragOverEvent) => {
        // We only allow reordering within the same section, which is handled
        // by the SortableContext and handleDragEnd.
        // We do explicitly prevent cross-section dragging by NOT handling it here.
        return
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        setActiveDragId(null)

        if (!over) return

        const activeId = active.id as string
        const overId = over.id as string

        // Moving Sections
        if (active.data.current?.type === "SECTION") {
            if (activeId !== overId) {
                setSections((items) => {
                    const oldIndex = items.findIndex((i) => i.id === activeId)
                    const newIndex = items.findIndex((i) => i.id === overId)
                    const newItems = arrayMove(items, oldIndex, newIndex)

                    // Call API to reorder
                    const sortedOrder = newItems.map((s, index) => ({ id: s.id, order: index + 1 }))
                    reorderMutation.mutate({ type: 'section', sortedOrder })

                    return newItems
                })
                toast.success("Sections reordered")
            }
            return
        }

        // Moving Chapters
        if (active.data.current?.type === "CHAPTER") {
            const originalChapter = active.data.current.chapter as CourseContent

            // Find where it ended up
            const newSection = sections.find(s => s.chapters.some(c => c.id === activeId) || s.id === overId || s.chapters.some(c => c.id === overId))

            // Robust check: Ensure we are dealing with the SAME section
            // originalChapter.sectionId must match the section we are dropping into.
            // If newSection is not found, or matches a different section ID than the original, we ignore.

            // Note: overId can be a Section ID (if dropped on header) or Chapter ID.
            const targetSection = sections.find(s => s.id === overId || s.chapters.some(c => c.id === overId))

            if (!targetSection) return

            // STRICT CONSTRAINT: Disallow moving to a different section
            if (targetSection.id !== originalChapter.sectionId) {
                return
            }

            // At this point, targetSection is the same as the source section.
            // We just need to reorder.

            const currentSection = targetSection;
            const oldIndex = currentSection.chapters.findIndex(c => c.id === activeId)
            const newIndex = currentSection.chapters.findIndex(c => c.id === overId)

            // If dropped on the Section itself (header), we might want to move it to the start or end?
            // But typically SortableContext items are the chapters. 
            // If overId equals sectionId, it means dropped on the container? 
            // In our JSX, SortableContext items are chapters. The Section header is outside SortableContext for chapters?
            // Actually, SortableContext wraps the chapters. The Section header is handled by SortableSection.
            // If we drop on the Section header, 'overId' will be the section ID (as it is also a Sortable item in the parent context!).
            // If we drop on a section header, we probably shouldn't reorder the chapter *within* the section unless we handle that logic.
            // For now, let's assume if overId is the Section ID, we don't reorder (or move to top?).
            // Let's stick to standard behavior: if overId is NOT a chapter in the section, ignore reorder.

            if (oldIndex === -1 || newIndex === -1) return;

            if (activeId !== overId) {
                setSections((prev) => prev.map(s => {
                    if (s.id === currentSection.id) {
                        const newChapters = arrayMove(s.chapters, oldIndex, newIndex)
                        const sortedOrder = newChapters.map((c, index) => ({ id: c.id, order: index + 1 }))
                        reorderMutation.mutate({ type: 'content', sortedOrder })
                        return { ...s, chapters: newChapters }
                    }
                    return s
                }))
                toast.success("Chapters reordered")
            }
        }
    }

    // Use local state (sections) as the source of truth for the editor to support optimistic updates.
    const selectedChapter = sections
        .flatMap((s) => s.chapters)
        .find((c) => c.id === selectedChapterId)

    return (
        <div className="flex flex-col gap-8 p-8 max-w-[1600px] mx-auto w-full">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight">Course Content</h1>
                    <p className="text-muted-foreground">Manage curriculum, sections, and chapter content.</p>
                </div>
            </div>

            <div className="grid h-[calc(100vh-14rem)] grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left Sidebar: Structure */}
                <div className="flex flex-col overflow-hidden border bg-background lg:col-span-1 rounded-md">
                    <div className="bg-muted/50 px-4 py-3 border-b">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold leading-none tracking-tight">Curriculum</h3>
                            <Button size="sm" onClick={handleAddSection}>
                                <Plus className="mr-2 h-4 w-4" /> Section
                            </Button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={sections.map((s) => s.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {sections.map((section) => (
                                    <SortableSection
                                        key={section.id}
                                        section={section}
                                        onToggle={handleToggleSection}
                                        onDelete={handleDeleteSection}
                                        onAddChapter={handleAddChapter}
                                    >
                                        <div className="space-y-2">
                                            <Input
                                                value={section.title}
                                                onChange={(e) =>
                                                    handleUpdateSectionTitle(
                                                        section.id,
                                                        e.target.value
                                                    )
                                                }
                                                className="mb-2 h-8 focus-visible:ring-0"
                                                placeholder="Section Title"
                                                onBlur={(e) => handleSectionTitleBlur(section.id, e.target.value)}
                                            />
                                            <SortableContext
                                                items={section.chapters.map((c) => c.id)}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                {section.chapters.map((chapter) => (
                                                    <SortableChapter
                                                        key={chapter.id}
                                                        chapter={chapter}
                                                        isSelected={
                                                            chapter.id === selectedChapterId
                                                        }
                                                        onClick={() =>
                                                            setSelectedChapterId(chapter.id)
                                                        }
                                                        onDelete={(e) => {
                                                            e.stopPropagation()
                                                            handleDeleteChapter(chapter.id)
                                                        }}
                                                    />
                                                ))}
                                            </SortableContext>
                                            {section.chapters.length === 0 && (
                                                <p className="text-center text-xs text-muted-foreground">
                                                    No chapters. Click + to add.
                                                </p>
                                            )}
                                        </div>
                                    </SortableSection>
                                ))}
                            </SortableContext>
                            <DragOverlay>
                                {activeDragId ? (
                                    <div className="border bg-background p-2 shadow-md">
                                        Dragging...
                                    </div>
                                ) : null}
                            </DragOverlay>
                        </DndContext>
                    </div>
                </div>

                {/* Right Side: Content Editor */}
                <div className="flex flex-col overflow-hidden border bg-background lg:col-span-2 rounded-md">
                    {selectedChapter ? (
                        <ChapterEditForm
                            key={selectedChapter.id}
                            chapter={selectedChapter}
                            onSave={handleSaveChapter}
                            onDelete={() => handleDeleteChapter(selectedChapter.id)}
                            onTitleChange={handleOptimisticTitleUpdate}
                        />
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                            <FileText className="mb-4 h-12 w-12 opacity-20" />
                            <p>Select a chapter to edit content</p>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={deleteConfirm.open} onOpenChange={(open) => !open && setDeleteConfirm(prev => ({ ...prev, open: false }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the{" "}
                            {deleteConfirm.type} <span className="font-medium text-foreground">"{deleteConfirm.title}"</span> and remove it from our servers.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirm(prev => ({ ...prev, open: false }))}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmDelete}>
                            Delete {deleteConfirm.type === 'section' ? 'Section' : 'Chapter'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
