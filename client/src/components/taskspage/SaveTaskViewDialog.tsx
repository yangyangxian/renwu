import { Dialog, DialogContent } from "@/components/ui-kit/Dialog";
import { Button } from "@/components/ui-kit/Button";
import { Input } from "@/components/ui-kit/Input";
import { statusLabels, statusIcons } from "@/consts/taskStatusConfig";
import { Folder, CalendarRange, Search, Filter, SortAsc, SortDesc, Kanban, List, ArrowUpDown } from "lucide-react";
import { TaskViewMode } from "@fullstack/common";
import React, { useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui-kit/Label";
import { TaskDateRange, TaskSortField, TaskSortOrder } from "@fullstack/common";
import { useTaskViewStore } from "@/stores/useTaskViewStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useNavigate } from "react-router-dom";
import { MYTASKS_PATH } from "@/routes/routeConfig";
interface SaveTaskViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export const SaveTaskViewDialog: React.FC<SaveTaskViewDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { currentDisplayViewConfig, createTaskView, setCurrentSelectedTaskView } = useTaskViewStore();
  const { projects } = useProjectStore();
  const [viewName, setViewName] = useState("");
  const navigate = useNavigate();

  const handleSave = async () => {
    if (!viewName.trim()) return;
    try {
      const newView = await createTaskView(viewName.trim(), currentDisplayViewConfig);
      setCurrentSelectedTaskView(newView);
      toast.success("Task view saved successfully!");
      onOpenChange(false);
      setViewName("");
      // Auto-navigate to the new view
      navigate(`${MYTASKS_PATH}?view=${newView.name.replace(/\s+/g, '-')}`);
    } catch (err) {
      toast.error("Failed to save task view.");
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <Label asChild className="text-md font-medium block">
          <div>Save the following filters as a new task view:</div>
        </Label>
        <div className="space-y-3 text-sm rounded-lg px-3 py-2 mb-3">
          <div className="flex items-center gap-3">
            <Folder className="w-4 h-4 text-primary" />
            <Label className="font-medium min-w-[90px]">Project:</Label>
            <span>
              {(() => {
                if (currentDisplayViewConfig.projectId === "all") return "All Tasks";
                if (currentDisplayViewConfig.projectId === "personal") return "Personal Tasks";
                const project = projects.find((p) => p.id === currentDisplayViewConfig.projectId);
                return project ? project.name : "Unknown";
              })()}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <CalendarRange className="w-4 h-4 text-primary" />
            <Label className="font-medium min-w-[90px]">Date Range:</Label>
            <span>
              {currentDisplayViewConfig.dateRange === TaskDateRange.LAST_3_MONTHS && "Last 3 months"}
              {currentDisplayViewConfig.dateRange === TaskDateRange.LAST_1_YEAR && "Last 1 year"}
              {currentDisplayViewConfig.dateRange === TaskDateRange.ALL_TIME && "All Time"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Search className="w-4 h-4 text-primary" />
            <Label className="font-medium min-w-[90px]">Search Term:</Label>
            <span>
              {currentDisplayViewConfig.searchTerm ? (
                <span className="text-primary">{currentDisplayViewConfig.searchTerm}</span>
              ) : (
                <span className="text-muted-foreground">(none)</span>
              )}
            </span>
          </div>
          {currentDisplayViewConfig.viewMode !== TaskViewMode.BOARD && (
            <>
              <div className="flex items-center gap-3">
                <Filter className="w-4 h-4 text-primary" />
                <Label className="font-medium min-w-[90px]">Status:</Label>
                <span className="flex flex-wrap gap-2 items-center">
                  {currentDisplayViewConfig.status && currentDisplayViewConfig.status.length > 0
                    ? currentDisplayViewConfig.status.map((s: string) => (
                        <span key={s} className="inline-flex items-center gap-1">
                          {statusIcons[s as keyof typeof statusIcons]}
                          {statusLabels[s as keyof typeof statusLabels]}
                        </span>
                      ))
                    : "All"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <ArrowUpDown className="w-4 h-4 text-primary" />
                <Label className="font-medium min-w-[90px]">Sort By:</Label>
                <span>
                  {currentDisplayViewConfig.sortField === TaskSortField.DUE_DATE && "Due Date"}
                  {currentDisplayViewConfig.sortField === TaskSortField.UPDATE_DATE && "Update Date"}
                  {currentDisplayViewConfig.sortField === TaskSortField.TITLE && "Title"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {currentDisplayViewConfig.sortOrder === TaskSortOrder.ASC ? (
                  <SortAsc className="w-4 h-4 text-primary" />
                ) : (
                  <SortDesc className="w-4 h-4 text-primary" />
                )}
                <Label className="font-medium min-w-[90px]">Order:</Label>
                <span>
                  {currentDisplayViewConfig.sortOrder === TaskSortOrder.ASC ? "Ascending" : "Descending"}
                </span>
              </div>
            </>
          )}
          <div className="flex items-center gap-3">
            {currentDisplayViewConfig.viewMode === TaskViewMode.BOARD ? <Kanban className="w-4 h-4 text-primary" /> : <List className="w-4 h-4 text-primary" />}
            <Label className="font-medium min-w-[90px]">View Mode:</Label>
            <span>
              {currentDisplayViewConfig.viewMode === TaskViewMode.BOARD ? "Board" : "List"}
            </span>
          </div>
        </div>
        <div className="mb-3">
          <Label htmlFor="task-view-name" className="text-md font-medium mb-3 block">Task View Name</Label>
          <Input
            id="task-view-name"
            placeholder="Enter a name for this view"
            value={viewName}
            onChange={e => setViewName(e.target.value)}
            className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 focus:ring-2 focus:ring-primary"
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleSave}
            disabled={!viewName.trim()}
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
