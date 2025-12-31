import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui-kit/Select";
import { Input } from "@/components/ui-kit/Input";
import { Folder, Search } from "lucide-react";
import { TaskResDto, TaskDateRange } from "@fullstack/common";
import { useEffect } from "react";
import { useProjectStore } from "@/stores/useProjectStore";
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
  const { projects } = useProjectStore();

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
      {showProjectSelect && (
        <Select
          value={selectedProject}
          onValueChange={v => {
            onSelectedProjectChange?.(v);
          }}
          defaultValue="all"
        >
          <SelectTrigger
            className="px-3 bg-white dark:text-primary flex items-center min-w-[9rem]"
            id="project-select"
          >
            <Folder className="w-4 h-4" />
            <SelectValue placeholder="Select project..." className="text-left w-full" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-left">All Tasks</SelectItem>
            <SelectItem value="personal" className="text-left">Personal Tasks</SelectItem>
            {/* Divider */}
            {projects.length > 0 && <div className="h-px bg-gray-200 my-1" role="separator" />}
            {projects.map(project => (
              <SelectItem key={project.id} value={project.id} className="text-left">{project.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showDateRange && (
      <TaskFilterDropdown
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
