import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui-kit/Select";
import { Input } from "@/components/ui-kit/Input";
import { Calendar, Folder } from "lucide-react";
import { ProjectResDto, TaskResDto } from "@fullstack/common";

interface TaskFilterMenuProps {
  showProjectSelect?: boolean;
  showDateRange?: boolean;
  showSearch?: boolean;
  projects: ProjectResDto[];
  tasks: TaskResDto[];
  onFilter: (filtered: TaskResDto[]) => void;
}

import { useState, useEffect } from "react";
export function TaskFilterMenu({
  showProjectSelect,
  showDateRange,
  showSearch,
  projects,
  tasks,
  onFilter,
}: TaskFilterMenuProps) {
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [dateRange, setDateRange] = useState<'1m' | '3m' | '1y' | 'all'>("1m");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    // Filtering logic
    let threshold: Date | null = null;
    if (dateRange !== 'all') {
      threshold = new Date();
      if (dateRange === '1m') threshold.setMonth(threshold.getMonth() - 1);
      if (dateRange === '3m') threshold.setMonth(threshold.getMonth() - 3);
      if (dateRange === '1y') threshold.setFullYear(threshold.getFullYear() - 1);
      threshold.setHours(0, 0, 0, 0);
    }
    const filtered = tasks.filter(t => {
      const updatedAt = t.updatedAt ? new Date(t.updatedAt) : null;
      const dateOk = !threshold || (updatedAt && updatedAt >= threshold);
      const isPersonal = t.projectId === null || t.projectId === undefined || t.projectId === '';
      let projectOk = false;
      if (selectedProject === 'all') projectOk = true;
      else if (selectedProject === 'personal') projectOk = isPersonal;
      else projectOk = t.projectId == selectedProject;
      const searchOk = t.title.toLowerCase().includes(searchTerm.trim().toLowerCase());
      return dateOk && projectOk && searchOk;
    });
    onFilter(filtered);
  }, [tasks, dateRange, selectedProject, searchTerm, onFilter]);

  return (
    <div className="flex gap-3 items-center flex-grow">
      {showProjectSelect && (
        <Select value={selectedProject} onValueChange={setSelectedProject} defaultValue="all">
          <SelectTrigger
            className="px-3 bg-white dark:text-primary flex items-center min-w-[10rem]"
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
            <SelectTrigger className="min-w-[10rem] px-2 bg-white dark:text-primary flex gap-2" id="date-range-select">
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
        <div className="min-w-[9rem]">
          <Input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search"
            className="bg-white-black transition-colors duration-50 text-sm"
          />
        </div>
      )}
    </div>
  );
}
