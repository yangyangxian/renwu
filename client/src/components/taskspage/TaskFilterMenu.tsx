import { Input } from "@/components/ui-kit/Input";
import { Search } from "lucide-react";
import { TaskResDto, TaskDateRange } from "@fullstack/common";
import { useEffect } from "react";
import { TaskFilterDropdown } from "@/components/taskspage/TaskFilterDropdown";

interface TaskFilterMenuProps {
  showProjectSelect?: boolean;
  showDateRange?: boolean;
  showSearch?: boolean;
  tasks: TaskResDto[];
  onFilter: (filtered: TaskResDto[]) => void;
  // controlled values from parent
  selectedProject: string;
  dateRange: TaskDateRange;
  searchTerm: string;
  // change handlers from parent
  onSelectedProjectChange?: (projectId: string) => void;
  onDateRangeChange?: (range: TaskDateRange) => void;
  onSearchTermChange?: (term: string) => void;
}

export function TaskFilterMenu({
  showProjectSelect,
  showDateRange,
  showSearch,
  tasks,
  onFilter,
  selectedProject,
  dateRange,
  searchTerm,
  onSelectedProjectChange,
  onDateRangeChange,
  onSearchTermChange,
}: TaskFilterMenuProps) {
  // Filtering depends on controlled values from parent
  useEffect(() => {
    const filtered = tasks.filter(t => {
      // Date filter
      let dateOk = true;
      if (showDateRange) {
        let threshold: Date | null = null;
        if (dateRange !== TaskDateRange.ALL_TIME) {
          threshold = new Date();
          if (dateRange === TaskDateRange.LAST_3_MONTHS) threshold.setMonth(threshold.getMonth() - 3);
          if (dateRange === TaskDateRange.LAST_1_YEAR) threshold.setFullYear(threshold.getFullYear() - 1);
          threshold.setHours(0, 0, 0, 0);
        }
        const updatedAt = t.updatedAt ? new Date(t.updatedAt) : null;
        dateOk = !threshold || (updatedAt ? updatedAt >= threshold : false);
      }

      // Project filter
      let projectOk = true;
      if (showProjectSelect) {
        const isPersonal = t.projectId === null || t.projectId === undefined || t.projectId === '';
        if (selectedProject === 'all') {
          projectOk = true;
        } else if (selectedProject === 'personal') {
          projectOk = isPersonal;
        } else {
          projectOk = t.projectId == selectedProject;
        }
      }
      
      // Search filter
      let searchOk = true;
      if (showSearch) {
        const q = searchTerm.trim().toLowerCase();
        // Empty search means "no search filter" (but keep other filters)
        if (q) {
          searchOk =
            t.title.toLowerCase().includes(q) ||
            (t.description || '').toLowerCase().includes(q);
        }
      }

      return dateOk && projectOk && searchOk;
    });
    onFilter(filtered);
  }, [tasks, dateRange, selectedProject, searchTerm, onFilter, showProjectSelect, showDateRange, showSearch]);

  return (
    <div className="flex gap-3 items-center flex-grow">
      {(showProjectSelect || showDateRange) && (
        <TaskFilterDropdown
          showProjectSelect={showProjectSelect}
          selectedProject={selectedProject}
          onSelectedProjectChange={onSelectedProjectChange}
          value={dateRange}
          onChange={(v) => onDateRangeChange?.(v)}
        />
      )}

      {showSearch && (
        <div className="min-w-[9rem] relative flex items-center">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            value={searchTerm}
            onChange={e => onSearchTermChange?.(e.target.value)}
            placeholder="Search"
            className="bg-white-black text-sm pl-9 max-w-[10rem]"
          />
        </div>
      )}
    </div>
  );
}
