import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui-kit/Select";
import { Input } from "@/components/ui-kit/Input";
import { Calendar, Folder } from "lucide-react";
import { Search } from "lucide-react";
import { ProjectResDto, TaskResDto } from "@fullstack/common";
import { useState, useEffect } from "react";
import logger from "@/utils/logger";
import { useProjectStore } from "@/stores/useProjectStore";

interface TaskFilterMenuProps {
  showProjectSelect?: boolean;
  showDateRange?: boolean;
  showSearch?: boolean;
  tasks: TaskResDto[];
  onFilter: (filtered: TaskResDto[]) => void;
  onProjectSelect?: (projectId: string) => void;
}

export function TaskFilterMenu({
  showProjectSelect,
  showDateRange,
  showSearch,
  tasks,
  onFilter,
  onProjectSelect,
}: TaskFilterMenuProps) {
  const { projects } = useProjectStore();
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [dateRange, setDateRange] = useState<'1m' | '3m' | '1y' | 'all'>("1m");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    const filtered = tasks.filter(t => {
      // Date filter
      let dateOk = true;
      if (showDateRange) {
        let threshold: Date | null = null;
        if (dateRange !== 'all') {
          threshold = new Date();
          if (dateRange === '1m') threshold.setMonth(threshold.getMonth() - 1);
          if (dateRange === '3m') threshold.setMonth(threshold.getMonth() - 3);
          if (dateRange === '1y') threshold.setFullYear(threshold.getFullYear() - 1);
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
        searchOk = t.title.toLowerCase().includes(searchTerm.trim().toLowerCase()) || (t.description || '').toLowerCase().includes(searchTerm.trim().toLowerCase());
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
            setSelectedProject(v);
            if (v === "all" || v === "personal") v = '';
            if (onProjectSelect) onProjectSelect(v);
          }}
          defaultValue="all"
        >
          <SelectTrigger
            size="sm"
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
        <div className="flex items-center">
          <Select value={dateRange} onValueChange={v => setDateRange(v as any)}>
            <SelectTrigger size="sm" className="min-w-[10rem] px-2 bg-white dark:text-primary flex gap-2" id="date-range-select">
              <Calendar className="w-4 h-4" />
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Last 30 days</SelectItem>
              <SelectItem value="3m">Last 3 months</SelectItem>
              <SelectItem value="1y">Last 1 year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {showSearch && (
        <div className="min-w-[9rem] relative flex items-center">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search"
            className="bg-white-black text-sm pl-9 max-w-[10rem] h-[31px]"
          />
        </div>
      )}
    </div>
  );
}
