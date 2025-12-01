"use client"

import { useState, useEffect } from "react"
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
    type DropAnimation,
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
    Calendar as CalendarIcon
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Textarea } from "~/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover"
// import { Calendar } from "~/components/ui/calendar"
import { TiptapEditor } from "~/components/tiptap-editor"
import React from "react"
const Calendar = React.lazy(() => import("~/components/ui/calendar").then(module => ({ default: module.Calendar })))
import { api, ApiError } from "~/lib/api.client"
import { queryKeys } from "~/lib/query-keys"
import { cn } from "~/lib/utils"

import { Label } from "~/components/ui/label"
import { Separator } from "~/components/ui/separator"

// --- Types ---

import type { CourseSection, CourseContent } from "~/types/course"

type SectionWithContent = CourseSection & {
    chapters: CourseContent[]
    isExpanded: boolean
}

// --- Mock Data ---

// --- Mock Data Removed ---

// --- Sortable Components ---

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
                "mb-4 rounded-lg border bg-card text-card-foreground shadow-sm",
                isDragging && "opacity-50"
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
                    className="flex items-center gap-2 font-medium hover:underline"
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
                "mb-2 flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm transition-colors hover:bg-accent",
                isSelected && "border-primary bg-accent",
                isDragging && "opacity-50"
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
                className="text-muted-foreground hover:text-destructive"
                aria-label="Delete chapter"
            >
                <Trash2 className="h-4 w-4" />
            </button>
        </div>
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
        queryFn: () => api.get<{ data: CourseSection[] }>(`/api/admin/courses/${courseId}/sections`),
        enabled: !!courseId,
    })

    // Fetch Content
    const { data: contentData } = useQuery({
        queryKey: queryKeys.courses.content(courseId || ''),
        queryFn: () => api.get<{ data: CourseContent[] }>(`/api/admin/courses/${courseId}/content`),
        enabled: !!courseId,
    })

    // Combine Data
    useEffect(() => {
        if (sectionsData?.data && contentData?.data) {
            const combined: SectionWithContent[] = sectionsData.data.map(section => ({
                ...section,
                isExpanded: true, // Default to expanded
                chapters: contentData.data
                    .filter(c => c.sectionId === section.id)
                    .sort((a, b) => a.order - b.order)
            })).sort((a, b) => a.order - b.order)

            setSections(combined)
        }
    }, [sectionsData, contentData])

    // --- Mutations ---

    const createSectionMutation = useMutation({
        mutationFn: (title: string) =>
            api.post<{ data: CourseSection }>(`/api/admin/courses/${courseId}/sections`, {
                title,
                order: sections.length + 1
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.courses.sections(courseId!) })
            toast.success("Section created")
        },
        onError: (error: ApiError) => toast.error(error.message)
    })

    const deleteSectionMutation = useMutation({
        mutationFn: (sectionId: string) => api.delete(`/api/admin/sections/${sectionId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.courses.sections(courseId!) })
            toast.success("Section deleted")
        },
        onError: (error: ApiError) => toast.error(error.message)
    })

    const updateSectionMutation = useMutation({
        mutationFn: ({ id, title }: { id: string, title: string }) =>
            api.put(`/api/admin/sections/${id}`, { title }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.courses.sections(courseId!) })
        },
        onError: (error: ApiError) => toast.error(error.message)
    })

    const createChapterMutation = useMutation({
        mutationFn: (sectionId: string) =>
            api.post<{ data: CourseContent }>(`/api/admin/sections/${sectionId}/content`, {
                courseId,
                title: "New Chapter",
                type: "video",
                order: sections.find(s => s.id === sectionId)?.chapters.length || 0 + 1
            }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.courses.content(courseId!) })
            setSelectedChapterId(data.data.id)
            toast.success("Chapter added")
        },
        onError: (error: ApiError) => toast.error(error.message)
    })

    const deleteChapterMutation = useMutation({
        mutationFn: (chapterId: string) => api.delete(`/api/admin/content/${chapterId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.courses.content(courseId!) })
            setSelectedChapterId(null)
            toast.success("Chapter deleted")
        },
        onError: (error: ApiError) => toast.error(error.message)
    })

    const updateChapterMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: Partial<CourseContent> }) =>
            api.put(`/api/admin/content/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.courses.content(courseId!) })
            toast.success("Chapter saved")
        },
        onError: (error: ApiError) => toast.error(error.message)
    })

    const reorderMutation = useMutation({
        mutationFn: (payload: { type: 'section' | 'content', sortedOrder: { id: string, order: number }[] }) =>
            api.put('/api/admin/sort-order', payload),
        onSuccess: () => {
            // Optimistic update handled by local state, but we should invalidate to be safe
            queryClient.invalidateQueries({ queryKey: queryKeys.courses.sections(courseId!) })
            queryClient.invalidateQueries({ queryKey: queryKeys.courses.content(courseId!) })
        },
        onError: (error: ApiError) => toast.error(error.message)
    })


    const [activeDragId, setActiveDragId] = useState<string | null>(null)

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
        if (confirm("Are you sure you want to delete this section?")) {
            deleteSectionMutation.mutate(sectionId)
        }
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
        if (confirm("Are you sure you want to delete this chapter?")) {
            deleteChapterMutation.mutate(chapterId)
        }
    }

    const handleUpdateChapter = (field: keyof CourseContent, value: any) => {
        if (!selectedChapterId) return
        // Optimistic update for local state
        setSections(
            sections.map((s) => ({
                ...s,
                chapters: s.chapters.map((c) =>
                    c.id === selectedChapterId ? { ...c, [field]: value } : c
                ),
            }))
        )
    }

    const handleUpdateSectionTitle = (sectionId: string, title: string) => {
        // Optimistic update
        setSections(
            sections.map((s) => (s.id === sectionId ? { ...s, title } : s))
        )
        // Debounce this in a real app, for now we can just update on blur or have a save button? 
        // The UI has an input that updates on change. Let's use onBlur for the API call to avoid too many requests.
    }

    // Helper for title update on blur
    const handleSectionTitleBlur = (sectionId: string, title: string) => {
        updateSectionMutation.mutate({ id: sectionId, title })
    }

    const handleSaveChapter = () => {
        if (!selectedChapterId) return
        const chapter = sections.flatMap(s => s.chapters).find(c => c.id === selectedChapterId)
        if (chapter) {
            updateChapterMutation.mutate({ id: chapter.id, data: chapter })
        }
    }

    // --- Drag and Drop Logic ---

    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragId(event.active.id as string)
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
            // Find source and destination sections
            const sourceSection = sections.find((s) =>
                s.chapters.some((c) => c.id === activeId)
            )
            const destSection = sections.find(
                (s) =>
                    s.id === overId || s.chapters.some((c) => c.id === overId)
            )

            if (!sourceSection || !destSection) return

            // If moving within the same section
            if (sourceSection.id === destSection.id) {
                const oldIndex = sourceSection.chapters.findIndex(
                    (c) => c.id === activeId
                )
                const newIndex = sourceSection.chapters.findIndex(
                    (c) => c.id === overId
                )

                if (oldIndex !== newIndex) {
                    setSections(
                        sections.map((s) => {
                            if (s.id === sourceSection.id) {
                                const newChapters = arrayMove(s.chapters, oldIndex, newIndex)
                                // Call API to reorder
                                const sortedOrder = newChapters.map((c, index) => ({ id: c.id, order: index + 1 }))
                                reorderMutation.mutate({ type: 'content', sortedOrder })
                                return {
                                    ...s,
                                    chapters: newChapters,
                                }
                            }
                            return s
                        })
                    )
                    toast.success("Chapters reordered")
                }
            } else {
                // Moving between sections (simplified: append to end if dropped on section, or insert if dropped on chapter)
                // For now, let's just handle same-section reordering to keep it simple as per initial plan, 
                // but the structure allows for cross-section if we implement `onDragOver` correctly.
                // Given the complexity, I'll stick to same-section reordering for now unless `dnd-kit` makes it easy.
                // Actually, `dnd-kit` needs `onDragOver` for cross-container sorting.
            }
        }
    }

    const selectedChapter = sections
        .flatMap((s) => s.chapters)
        .find((c) => c.id === selectedChapterId)

    return (
        <div className="flex flex-1 flex-col p-4 pt-0">
            <div className="container mx-auto space-y-6 max-w-5xl h-full">
                <div className="flex items-center gap-2 py-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to={`/admin/courses/${courseId}`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h2 className="text-lg font-semibold">Course Content Manager</h2>
                </div>

                <div className="grid h-[calc(100vh-12rem)] grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left Sidebar: Structure */}
                    <Card className="flex flex-col overflow-hidden lg:col-span-1">
                        <CardHeader className="bg-muted/50 px-4 py-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">Curriculum</CardTitle>
                                <Button size="sm" onClick={handleAddSection}>
                                    <Plus className="mr-2 h-4 w-4" /> Section
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-4">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragStart={handleDragStart}
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
                                                    className="mb-2 h-8"
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
                                        <div className="rounded-md border bg-background p-2 shadow-md">
                                            Dragging...
                                        </div>
                                    ) : null}
                                </DragOverlay>
                            </DndContext>
                        </CardContent>
                    </Card>

                    {/* Right Side: Content Editor */}
                    <Card className="flex flex-col overflow-hidden lg:col-span-2">
                        {selectedChapter ? (
                            <>
                                <CardHeader className="border-b px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <CardTitle>Edit Chapter</CardTitle>
                                            <p className="text-sm text-muted-foreground">
                                                {selectedChapter.title}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() =>
                                                    handleDeleteChapter(selectedChapter.id)
                                                }
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </Button>
                                            <Button size="sm" onClick={handleSaveChapter}>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Changes
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 overflow-y-auto p-6">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label>Chapter Title</Label>
                                            <Input
                                                value={selectedChapter.title}
                                                onChange={(e) =>
                                                    handleUpdateChapter("title", e.target.value)
                                                }
                                                placeholder="e.g. Introduction to React"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Content (Rich Text)</Label>
                                            <TiptapEditor
                                                value={selectedChapter.desc || ''}
                                                onChange={(value) =>
                                                    handleUpdateChapter("desc", value)
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-6 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>Video Link</Label>
                                                <div className="flex items-center gap-2">
                                                    <Video className="h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        value={selectedChapter.videoLink || ''}
                                                        onChange={(e) =>
                                                            handleUpdateChapter(
                                                                "videoLink",
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Video URL"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Access On</Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full justify-start text-left font-normal",
                                                                !selectedChapter.accessOnDate &&
                                                                "text-muted-foreground"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {selectedChapter.accessOnDate ? (
                                                                format(new Date(selectedChapter.accessOnDate), "PPP")
                                                            ) : (
                                                                <span>Pick a date</span>
                                                            )}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <React.Suspense fallback={<div className="p-4">Loading...</div>}>
                                                            <Calendar
                                                                mode="single"
                                                                selected={selectedChapter.accessOnDate ? new Date(selectedChapter.accessOnDate) : undefined}
                                                                onSelect={(date) =>
                                                                    handleUpdateChapter("accessOnDate", date?.toISOString())
                                                                }
                                                                initialFocus
                                                            />
                                                        </React.Suspense>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Assignment / Resources</Label>
                                            <p className="text-xs text-muted-foreground">Use the description field above for assignments.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </>
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                                <FileText className="mb-4 h-12 w-12 opacity-20" />
                                <p>Select a chapter to edit content</p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    )
}
