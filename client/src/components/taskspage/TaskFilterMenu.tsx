import { Input } from "@/components/ui-kit/Input";
import { Search } from "lucide-react";
import { TaskResDto, TaskDateRange } from "@fullstack/common";
import { useEffect, useMemo } from "react";
import { TaskFilterDropdown } from "@/components/taskspage/TaskFilterDropdown";
import { useLabelStore } from "@/stores/useLabelStore";

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
  selectedLabelSetId?: string | null;
  // change handlers from parent
  onSelectedProjectChange?: (projectId: string) => void;
  onDateRangeChange?: (range: TaskDateRange) => void;
  onSearchTermChange?: (term: string) => void;
  onSelectedLabelSetChange?: (labelSetId: string | null) => void;
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
  selectedLabelSetId,
  onSelectedProjectChange,
  onDateRangeChange,
  onSearchTermChange,
  onSelectedLabelSetChange,
}: TaskFilterMenuProps) {
  const { fetchLabelSets, getLabelSetsForProjectId } = useLabelStore();
  const normalizedLabelSetScopeProjectId = selectedProject === 'all'
    ? undefined
    : selectedProject === 'personal'
      ? null
      : selectedProject;
  const scopedLabelSets = useMemo(
    () => getLabelSetsForProjectId(normalizedLabelSetScopeProjectId),
    [getLabelSetsForProjectId, normalizedLabelSetScopeProjectId]
  );

  useEffect(() => {
    if (normalizedLabelSetScopeProjectId === undefined) {
      if (selectedLabelSetId) {
        onSelectedLabelSetChange?.(null);
      }
      return;
    }

    fetchLabelSets(normalizedLabelSetScopeProjectId ?? undefined, { setActiveScope: false });
  }, [fetchLabelSets, normalizedLabelSetScopeProjectId, onSelectedLabelSetChange, selectedLabelSetId]);

  useEffect(() => {
    if (!selectedLabelSetId) {
      return;
    }

    const labelSetExists = scopedLabelSets.some((labelSet) => labelSet.id === selectedLabelSetId);
    if (!labelSetExists && scopedLabelSets.length > 0) {
      onSelectedLabelSetChange?.(null);
    }
  }, [onSelectedLabelSetChange, scopedLabelSets, selectedLabelSetId]);

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

      let labelSetOk = true;
      if (selectedLabelSetId) {
        const selectedLabelSet = scopedLabelSets.find((labelSet) => labelSet.id === selectedLabelSetId);
        if (selectedLabelSet) {
          const selectedLabelIds = new Set(selectedLabelSet.labels.map((label) => label.id));
          labelSetOk = (t.labels || []).some((label) => selectedLabelIds.has(label.id));
        }
      }

      return dateOk && projectOk && searchOk && labelSetOk;
    });
    onFilter(filtered);
  }, [
    tasks,
    dateRange,
    selectedProject,
    searchTerm,
    selectedLabelSetId,
    scopedLabelSets,
    onFilter,
    showProjectSelect,
    showDateRange,
    showSearch,
  ]);

  return (
    <div className="flex gap-3 items-center grow">
      {(showProjectSelect || showDateRange) && (
        <TaskFilterDropdown
          showProjectSelect={showProjectSelect}
          selectedProject={selectedProject}
          onSelectedProjectChange={onSelectedProjectChange}
          showLabelSetFilter={true}
          selectedLabelSetId={selectedLabelSetId}
          onSelectedLabelSetChange={onSelectedLabelSetChange}
          value={dateRange}
          onChange={(v) => onDateRangeChange?.(v)}
        />
      )}

      {showSearch && (
        <div className="min-w-36 relative flex items-center">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            value={searchTerm}
            onChange={e => onSearchTermChange?.(e.target.value)}
            placeholder="Search"
            className="bg-white-black text-sm pl-9 max-w-40"
          />
        </div>
      )}
    </div>
  );
}
