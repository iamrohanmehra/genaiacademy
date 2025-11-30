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
import { useQuery } from "@tanstack/react-query"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Textarea } from "~/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover"
import { Calendar } from "~/components/ui/calendar"
import { cn } from "~/lib/utils"

import { Label } from "~/components/ui/label"
import { Separator } from "~/components/ui/separator"

// --- Types ---

type Chapter = {
    id: string
    title: string
    content: string
    assignment: string
    videoId: string
    accessOn: Date | undefined
}

type Section = {
    id: string
    title: string
    chapters: Chapter[]
    isExpanded: boolean
}

// --- Mock Data ---

const initialSections: Section[] = [
    {
        id: "section-1",
        title: "Introduction",
        isExpanded: true,
        chapters: [
            {
                id: "chapter-1",
                title: "Welcome to the Course",
                content: "Welcome content...",
                assignment: "",
                videoId: "12345",
                accessOn: new Date(),
            },
        ],
    },
]

// --- Sortable Components ---

function SortableSection({
    section,
    onToggle,
    onDelete,
    onAddChapter,
    children,
}: {
    section: Section
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
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(section.id)}
                        className="text-destructive hover:text-destructive"
                        title="Delete Section"
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
    chapter: Chapter
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
            >
                <GripVertical className="h-4 w-4" />
            </button>
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 truncate">{chapter.title}</span>
            <button
                onClick={onDelete}
                className="text-muted-foreground hover:text-destructive"
            >
                <Trash2 className="h-4 w-4" />
            </button>
        </div>
    )
}

// --- Main Component ---

export default function CourseContentPage() {
    const { id } = useParams()
    // const [sections, setSections] = useState<Section[]>(initialSections) // Removed initial mock data
    const [sections, setSections] = useState<Section[]>([])

    const { data: queryData, isLoading } = useQuery({
        queryKey: ['course-content', id],
        queryFn: async () => {
            // Simulate API call or fetch real data if endpoint exists
            // For now returning mock data to maintain functionality
            return new Promise<Section[]>((resolve) => {
                setTimeout(() => resolve(initialSections), 500)
            })
        },
        enabled: !!id,
    })

    const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)

    // Sync query data to local state for DnD
    useEffect(() => {
        if (queryData) {
            setSections(queryData)
            if (!selectedChapterId && queryData.length > 0 && queryData[0].chapters.length > 0) {
                setSelectedChapterId(queryData[0].chapters[0].id)
            }
        }
    }, [queryData])

    const [activeDragId, setActiveDragId] = useState<string | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // --- Actions ---

    const handleAddSection = () => {
        const newSection: Section = {
            id: `section-${Date.now()}`,
            title: "New Section",
            chapters: [],
            isExpanded: true,
        }
        setSections([...sections, newSection])
        toast.success("Section created")
    }

    const handleDeleteSection = (sectionId: string) => {
        if (confirm("Are you sure you want to delete this section?")) {
            setSections(sections.filter((s) => s.id !== sectionId))
            toast.success("Section deleted")
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
        const newChapter: Chapter = {
            id: `chapter-${Date.now()}`,
            title: "New Chapter",
            content: "",
            assignment: "",
            videoId: "",
            accessOn: undefined,
        }
        setSections(
            sections.map((s) =>
                s.id === sectionId
                    ? { ...s, chapters: [...s.chapters, newChapter], isExpanded: true }
                    : s
            )
        )
        setSelectedChapterId(newChapter.id)
        toast.success("Chapter added")
    }

    const handleDeleteChapter = (chapterId: string) => {
        if (confirm("Are you sure you want to delete this chapter?")) {
            setSections(
                sections.map((s) => ({
                    ...s,
                    chapters: s.chapters.filter((c) => c.id !== chapterId),
                }))
            )
            if (selectedChapterId === chapterId) {
                setSelectedChapterId(null)
            }
            toast.success("Chapter deleted")
        }
    }

    const handleUpdateChapter = (field: keyof Chapter, value: any) => {
        if (!selectedChapterId) return
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
        setSections(
            sections.map((s) => (s.id === sectionId ? { ...s, title } : s))
        )
    }

    const handleSaveChapter = () => {
        toast.success("Chapter saved successfully")
        // In a real app, this would make an API call
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
                    return arrayMove(items, oldIndex, newIndex)
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
                                return {
                                    ...s,
                                    chapters: arrayMove(s.chapters, oldIndex, newIndex),
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
                        <Link to={`/admin/courses/${id}`}>
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
                                            <Textarea
                                                value={selectedChapter.content}
                                                onChange={(e) =>
                                                    handleUpdateChapter("content", e.target.value)
                                                }
                                                className="min-h-[200px] font-mono"
                                                placeholder="# Markdown supported..."
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Supports Markdown formatting.
                                            </p>
                                        </div>

                                        <div className="grid gap-6 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>Video ID</Label>
                                                <div className="flex items-center gap-2">
                                                    <Video className="h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        value={selectedChapter.videoId}
                                                        onChange={(e) =>
                                                            handleUpdateChapter(
                                                                "videoId",
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Bunny Stream / YouTube ID"
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
                                                                !selectedChapter.accessOn &&
                                                                "text-muted-foreground"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {selectedChapter.accessOn ? (
                                                                format(selectedChapter.accessOn, "PPP")
                                                            ) : (
                                                                <span>Pick a date</span>
                                                            )}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar
                                                            mode="single"
                                                            selected={selectedChapter.accessOn}
                                                            onSelect={(date) =>
                                                                handleUpdateChapter("accessOn", date)
                                                            }
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Assignment / Resources</Label>
                                            <Textarea
                                                value={selectedChapter.assignment}
                                                onChange={(e) =>
                                                    handleUpdateChapter(
                                                        "assignment",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Link to assignment or resource description..."
                                            />
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
