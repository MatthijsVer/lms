"use client";

import {
  TimelineContent,
  ContentBlock,
  ContentBlockType,
} from "@/lib/content-blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Trash2,
  Calendar,
  Star,
  Target,
  Trophy,
  AlertCircle,
  GripVertical,
  Settings2,
  List,
  Copy,
  Eye,
  Layout,
  ChevronRight,
  Info,
} from "lucide-react";
import { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from "@dnd-kit/modifiers";

interface TimelineBlockEditorProps {
  block: ContentBlock & { type: ContentBlockType.TIMELINE };
  onChange: (block: ContentBlock) => void;
}

// Event type configuration
const eventTypeConfig = {
  event: {
    icon: Calendar,
    color: "bg-blue-500",
    label: "Event",
    description: "A regular timeline event",
  },
  milestone: {
    icon: Star,
    color: "bg-yellow-500",
    label: "Milestone",
    description: "A significant achievement or marker",
  },
  deadline: {
    icon: AlertCircle,
    color: "bg-red-500",
    label: "Deadline",
    description: "A time-sensitive deadline",
  },
  achievement: {
    icon: Trophy,
    color: "bg-green-500",
    label: "Achievement",
    description: "A completed goal or accomplishment",
  },
};

// Sortable Event Card Component
interface SortableEventCardProps {
  event: TimelineContent["events"][0];
  index: number;
  onUpdate: (updates: Partial<TimelineContent["events"][0]>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function SortableEventCard({
  event,
  index,
  onUpdate,
  onDelete,
  onDuplicate,
}: SortableEventCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: event.id,
    data: {
      type: "event",
      event,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const eventConfig = eventTypeConfig[event.type || "event"];
  const IconComponent = eventConfig.icon;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("transition-all", isDragging && "opacity-50 scale-95")}
    >
      <Card
        className={cn(
          "overflow-hidden transition-all hover:shadow-md",
          isDragging && "shadow-lg"
        )}
      >
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="p-4">
            {/* Event Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="cursor-grab hover:cursor-grabbing touch-none"
                  {...attributes}
                  {...listeners}
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                </div>

                <div className="flex items-center gap-2 flex-1">
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full flex-shrink-0",
                      eventConfig.color
                    )}
                  />
                  <IconComponent className="h-4 w-4 text-muted-foreground flex-shrink-0" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">
                        {event.title}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {eventConfig.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(event.date)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 transition-transform",
                        isExpanded && "rotate-90"
                      )}
                    />
                  </Button>
                </CollapsibleTrigger>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onDuplicate}
                        className="h-8 w-8"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Duplicate event</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <AlertDialog
                  open={showDeleteDialog}
                  onOpenChange={setShowDeleteDialog}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Event</AlertDialogTitle>
                      <AlertDialogDescription>
                    Are you sure you want to delete &quot;{event.title}&quot;? This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={onDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>

          <CollapsibleContent>
            <div className="px-4 pb-4 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`event-title-${index}`}>
                      Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`event-title-${index}`}
                      value={event.title}
                      onChange={(e) => onUpdate({ title: e.target.value })}
                      placeholder="Event title"
                      className="font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`event-description-${index}`}>
                      Description
                      <span className="text-xs text-muted-foreground ml-2">
                        (Optional)
                      </span>
                    </Label>
                    <Textarea
                      id={`event-description-${index}`}
                      value={event.description || ""}
                      onChange={(e) =>
                        onUpdate({ description: e.target.value })
                      }
                      placeholder="Add a detailed description..."
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor={`event-date-${index}`}>
                        Date <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`event-date-${index}`}
                        type="date"
                        value={event.date}
                        onChange={(e) => onUpdate({ date: e.target.value })}
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`event-time-${index}`}>
                        Time
                        <span className="text-xs text-muted-foreground ml-1">
                          (Optional)
                        </span>
                      </Label>
                      <Input
                        id={`event-time-${index}`}
                        type="time"
                        value={event.time || ""}
                        onChange={(e) => onUpdate({ time: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`event-type-${index}`}>Event Type</Label>
                    <Select
                      value={event.type || "event"}
                      onValueChange={(value: keyof typeof eventTypeConfig) =>
                        onUpdate({ type: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(eventTypeConfig).map(
                          ([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    "w-2 h-2 rounded-full",
                                    config.color
                                  )}
                                />
                                <config.icon className="h-4 w-4" />
                                <span>{config.label}</span>
                              </div>
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {eventTypeConfig[event.type || "event"].description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`event-color-${index}`}>
                      Custom Color
                      <span className="text-xs text-muted-foreground ml-2">
                        (Override type color)
                      </span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`event-color-${index}`}
                        type="color"
                        value={
                          event.color ||
                          eventTypeConfig[event.type || "event"].color
                        }
                        onChange={(e) => onUpdate({ color: e.target.value })}
                        className="h-10 w-20 cursor-pointer"
                      />
                      <Input
                        value={
                          event.color ||
                          eventTypeConfig[event.type || "event"].color
                        }
                        onChange={(e) => onUpdate({ color: e.target.value })}
                        placeholder="#3b82f6"
                        className="flex-1 font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdate({ color: undefined })}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}

export function TimelineBlockEditor({
  block,
  onChange,
}: TimelineBlockEditorProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const content = block.content as TimelineContent;

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateContent = useCallback(
    (updates: Partial<TimelineContent>) => {
      onChange({
        ...block,
        content: { ...content, ...updates },
      });
    },
    [block, content, onChange]
  );

  const addEvent = useCallback(() => {
    const newEvent = {
      id: `event-${Date.now()}`,
      title: `Event ${(content.events?.length || 0) + 1}`,
      description: "",
      date: new Date().toISOString().split("T")[0],
      type: "event" as const,
      icon: "calendar",
    };

    updateContent({
      events: [...(content.events || []), newEvent],
    });
  }, [content.events, updateContent]);

  const updateEvent = useCallback(
    (index: number, updates: Partial<TimelineContent["events"][0]>) => {
      const newEvents = [...(content.events || [])];
      newEvents[index] = { ...newEvents[index], ...updates };
      updateContent({ events: newEvents });
    },
    [content.events, updateContent]
  );

  const deleteEvent = useCallback(
    (index: number) => {
      const newEvents = content.events?.filter((_, i) => i !== index) || [];
      updateContent({ events: newEvents });
    },
    [content.events, updateContent]
  );

  const duplicateEvent = useCallback(
    (index: number) => {
      const eventToDuplicate = content.events?.[index];
      if (!eventToDuplicate) return;

      const newEvent = {
        ...eventToDuplicate,
        id: `event-${Date.now()}`,
        title: `${eventToDuplicate.title} (Copy)`,
      };

      const newEvents = [...(content.events || [])];
      newEvents.splice(index + 1, 0, newEvent);
      updateContent({ events: newEvents });
    },
    [content.events, updateContent]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (over && active.id !== over.id) {
        const oldIndex =
          content.events?.findIndex((e) => e.id === active.id) ?? -1;
        const newIndex =
          content.events?.findIndex((e) => e.id === over.id) ?? -1;

        if (oldIndex !== -1 && newIndex !== -1) {
          updateContent({
            events: arrayMove(content.events || [], oldIndex, newIndex),
          });
        }
      }
    },
    [content.events, updateContent]
  );

  // Sort events if chronological is enabled
  const displayEvents = useMemo(() => {
    if (!content.events) return [];
    if (!content.chronological) return content.events;

    return [...content.events].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });
  }, [content.events, content.chronological]);

  const activeEvent = activeId
    ? content.events?.find((e) => e.id === activeId)
    : null;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timeline Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Timeline Title
              <span className="text-xs text-muted-foreground ml-2">
                (Optional)
              </span>
            </Label>
            <Input
              id="title"
              value={content.title || ""}
              onChange={(e) => updateContent({ title: e.target.value })}
              placeholder="Enter a title for your timeline..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">
              Instructions
              <span className="text-xs text-muted-foreground ml-2">
                (Optional)
              </span>
            </Label>
            <Textarea
              id="instructions"
              value={content.instructions || ""}
              onChange={(e) => updateContent({ instructions: e.target.value })}
              placeholder="Provide instructions or context for the timeline..."
              rows={3}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="events" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Events
            <Badge variant="secondary" className="ml-1">
              {content.events?.length || 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Timeline Events</h3>
              <p className="text-sm text-muted-foreground">
                Add and configure events for your timeline
              </p>
            </div>
            <Button onClick={addEvent}>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>

          {content.events && content.events.length > 0 ? (
            <>
              {content.chronological && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 rounded-lg">
                  <Info className="h-4 w-4" />
                  <span className="text-sm">
                    Events are automatically sorted by date (chronological mode
                    enabled)
                  </span>
                </div>
              )}

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
              >
                <SortableContext
                  items={displayEvents.map((e) => e.id)}
                  strategy={verticalListSortingStrategy}
                  disabled={content.chronological}
                >
                  <div className="space-y-3">
                    {displayEvents.map((event, index) => {
                      const originalIndex =
                        content.events?.findIndex((e) => e.id === event.id) ??
                        index;
                      return (
                        <SortableEventCard
                          key={event.id}
                          event={event}
                          index={originalIndex}
                        onUpdate={(updates) =>
                          updateEvent(originalIndex, updates)
                        }
                        onDelete={() => deleteEvent(originalIndex)}
                        onDuplicate={() => duplicateEvent(originalIndex)}
                        />
                      );
                    })}
                  </div>
                </SortableContext>

                <DragOverlay modifiers={[restrictToWindowEdges]}>
                  {activeEvent ? (
                    <Card className="shadow-xl opacity-90">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "w-3 h-3 rounded-full",
                              eventTypeConfig[activeEvent.type || "event"].color
                            )}
                          />
                          <span className="font-medium">
                            {activeEvent.title}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </>
          ) : (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-muted rounded-full">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">No events yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Start building your timeline by adding your first event
                  </p>
                </div>
                <Button onClick={addEvent} size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Event
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4 mt-4">
          {/* Layout Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Layout & Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="layout">Timeline Layout</Label>
                <Select
                  value={content.layout || "vertical"}
                  onValueChange={(value: "vertical" | "horizontal") =>
                    updateContent({ layout: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vertical">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-0.5">
                          <div className="w-3 h-0.5 bg-foreground" />
                          <div className="w-3 h-0.5 bg-foreground" />
                          <div className="w-3 h-0.5 bg-foreground" />
                        </div>
                        Vertical Layout
                      </div>
                    </SelectItem>
                    <SelectItem value="horizontal">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          <div className="w-0.5 h-3 bg-foreground" />
                          <div className="w-0.5 h-3 bg-foreground" />
                          <div className="w-0.5 h-3 bg-foreground" />
                        </div>
                        Horizontal Layout
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose how the timeline should be displayed
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Display Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Display Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Show Dates</Label>
                  <p className="text-xs text-muted-foreground">
                    Display event dates on the timeline
                  </p>
                </div>
                <Switch
                  checked={content.showDates !== false}
                  onCheckedChange={(checked) =>
                    updateContent({ showDates: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Show Times</Label>
                  <p className="text-xs text-muted-foreground">
                    Display event times when available
                  </p>
                </div>
                <Switch
                  checked={content.showTimes === true}
                  onCheckedChange={(checked) =>
                    updateContent({ showTimes: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    Chronological Order
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically sort events by date
                  </p>
                </div>
                <Switch
                  checked={content.chronological === true}
                  onCheckedChange={(checked) =>
                    updateContent({ chronological: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Exercise Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Exercise Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    Shuffle Events
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Start with events in random order
                  </p>
                </div>
                <Switch
                  checked={content.shuffleEvents !== false}
                  onCheckedChange={(checked) =>
                    updateContent({ shuffleEvents: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    Allow Partial Credit
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Award points for partially correct ordering
                  </p>
                </div>
                <Switch
                  checked={content.allowPartialCredit !== false}
                  onCheckedChange={(checked) =>
                    updateContent({ allowPartialCredit: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Show Hints</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow hints after submission (uses event descriptions)
                  </p>
                </div>
                <Switch
                  checked={content.allowHints !== false}
                  onCheckedChange={(checked) =>
                    updateContent({ allowHints: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Scoring */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Scoring & Points
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="points">Point Value</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="points"
                    type="number"
                    min="0"
                    max="100"
                    value={content.points || 1}
                    onChange={(e) =>
                      updateContent({ points: parseInt(e.target.value) || 1 })
                    }
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    {content.points === 1 ? "point" : "points"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Points awarded for viewing or completing the timeline
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
