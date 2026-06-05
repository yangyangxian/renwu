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
  selectedLabelId?: string | null;
  selectedLabelIds?: string[] | null;
  selectedLabelSetId?: string | null;
  selectedLabelSetLabelIds?: string[] | null;
  selectedLabelSetLabelIdsBySet?: Record<string, string[]> | null;
  // change handlers from parent
  onSelectedProjectChange?: (projectId: string) => void;
  onDateRangeChange?: (range: TaskDateRange) => void;
  onSearchTermChange?: (term: string) => void;
  onSelectedLabelChange?: (labelId: string | null) => void;
  onSelectedLabelIdsChange?: (labelIds: string[] | null) => void;
  onSelectedLabelSetChange?: (labelSetId: string | null, labelIds?: string[] | null) => void;
  onSelectedLabelSetLabelIdsChange?: (labelIds: string[] | null) => void;
  onSelectedLabelSetLabelIdsBySetChange?: (labelIdsBySet: Record<string, string[]> | null) => void;
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
  selectedLabelId,
  selectedLabelIds,
  selectedLabelSetId,
  selectedLabelSetLabelIds,
  selectedLabelSetLabelIdsBySet,
  onSelectedProjectChange,
  onDateRangeChange,
  onSearchTermChange,
  onSelectedLabelChange,
  onSelectedLabelIdsChange,
  onSelectedLabelSetChange,
  onSelectedLabelSetLabelIdsChange,
  onSelectedLabelSetLabelIdsBySetChange,
}: TaskFilterMenuProps) {
  const { fetchLabels, fetchLabelSets, getLabelsForProjectId, getLabelSetsForProjectId } = useLabelStore();
  const hasMultiLabelFilter = (selectedLabelIds?.length ?? 0) > 0
    || Object.values(selectedLabelSetLabelIdsBySet ?? {}).some((labelIds) => labelIds.length > 0);
  const hasActiveFilters = useMemo(() => {
    const hasProjectFilter = !!showProjectSelect && selectedProject !== 'all';
    const hasDateRangeFilter = !!showDateRange && dateRange !== TaskDateRange.ALL_TIME;
    const hasSearchFilter = !!showSearch && searchTerm.trim().length > 0;
    const hasLabelFilter = !!selectedLabelId;
    const hasLabelSetFilter = !!selectedLabelSetId;

    return hasProjectFilter || hasDateRangeFilter || hasSearchFilter || hasLabelFilter || hasLabelSetFilter || hasMultiLabelFilter;
  }, [dateRange, hasMultiLabelFilter, searchTerm, selectedLabelId, selectedLabelSetId, selectedProject, showDateRange, showProjectSelect, showSearch]);
  const normalizedLabelSetScopeProjectId = selectedProject === 'all'
    ? undefined
    : selectedProject === 'personal'
      ? null
      : selectedProject;
  const scopedLabels = useMemo(
    () => getLabelsForProjectId(normalizedLabelSetScopeProjectId),
    [getLabelsForProjectId, normalizedLabelSetScopeProjectId]
  );
  const scopedLabelSets = useMemo(
    () => getLabelSetsForProjectId(normalizedLabelSetScopeProjectId),
    [getLabelSetsForProjectId, normalizedLabelSetScopeProjectId]
  );
  const labelSetLabelIds = useMemo(
    () => new Set(scopedLabelSets.flatMap((labelSet) => labelSet.labels.map((label) => label.id))),
    [scopedLabelSets]
  );
  const independentLabelIds = useMemo(
    () => new Set(scopedLabels.filter((label) => !labelSetLabelIds.has(label.id)).map((label) => label.id)),
    [labelSetLabelIds, scopedLabels]
  );

  useEffect(() => {
    if (normalizedLabelSetScopeProjectId === undefined) {
      if (selectedLabelId) {
        onSelectedLabelChange?.(null);
      }
      if (selectedLabelSetId) {
        onSelectedLabelSetChange?.(null, null);
      }
      if (selectedLabelIds?.length) {
        onSelectedLabelIdsChange?.(null);
      }
      if (selectedLabelSetLabelIdsBySet && Object.keys(selectedLabelSetLabelIdsBySet).length > 0) {
        onSelectedLabelSetLabelIdsBySetChange?.(null);
      }
      return;
    }

    fetchLabels(normalizedLabelSetScopeProjectId ?? undefined, { setActiveScope: false });
    fetchLabelSets(normalizedLabelSetScopeProjectId ?? undefined, { setActiveScope: false });
  }, [
    fetchLabels,
    fetchLabelSets,
    normalizedLabelSetScopeProjectId,
    onSelectedLabelChange,
    onSelectedLabelIdsChange,
    onSelectedLabelSetChange,
    onSelectedLabelSetLabelIdsBySetChange,
    selectedLabelId,
    selectedLabelIds,
    selectedLabelSetId,
    selectedLabelSetLabelIdsBySet,
  ]);

  useEffect(() => {
    if (!selectedLabelId) {
      return;
    }

    const labelExists = scopedLabels.some((label) => label.id === selectedLabelId);
    if (!labelExists && scopedLabels.length > 0) {
      onSelectedLabelChange?.(null);
    }
  }, [onSelectedLabelChange, scopedLabels, selectedLabelId]);

  useEffect(() => {
    if (!selectedLabelIds?.length) {
      return;
    }

    if (scopedLabels.length === 0) {
      return;
    }

    const availableLabelIds = new Set(scopedLabels.map((label) => label.id));
    const validSelectedLabelIds = selectedLabelIds.filter((labelId) => availableLabelIds.has(labelId));
    if (validSelectedLabelIds.length !== selectedLabelIds.length) {
      onSelectedLabelIdsChange?.(validSelectedLabelIds.length > 0 ? validSelectedLabelIds : null);
    }
  }, [onSelectedLabelIdsChange, scopedLabels, selectedLabelIds]);

  useEffect(() => {
    if (!selectedLabelSetId) {
      return;
    }

    const labelSetExists = scopedLabelSets.some((labelSet) => labelSet.id === selectedLabelSetId);
    if (!labelSetExists && scopedLabelSets.length > 0) {
      onSelectedLabelSetChange?.(null, null);
    }
  }, [onSelectedLabelSetChange, scopedLabelSets, selectedLabelSetId]);

  useEffect(() => {
    if (!selectedLabelSetId || !selectedLabelSetLabelIds?.length) {
      return;
    }

    const selectedLabelSet = scopedLabelSets.find((labelSet) => labelSet.id === selectedLabelSetId);
    if (!selectedLabelSet) {
      return;
    }

    const availableLabelIds = new Set(selectedLabelSet.labels.map((label) => label.id));
    const validSelectedLabelIds = selectedLabelSetLabelIds.filter((labelId) => availableLabelIds.has(labelId));
    if (validSelectedLabelIds.length !== selectedLabelSetLabelIds.length) {
      onSelectedLabelSetLabelIdsChange?.(validSelectedLabelIds.length > 0 ? validSelectedLabelIds : null);
    }
  }, [onSelectedLabelSetLabelIdsChange, scopedLabelSets, selectedLabelSetId, selectedLabelSetLabelIds]);

  useEffect(() => {
    if (!selectedLabelSetLabelIdsBySet) {
      return;
    }

    if (scopedLabelSets.length === 0) {
      return;
    }

    const nextSelectedLabelSetLabelIdsBySet: Record<string, string[]> = {};
    for (const labelSet of scopedLabelSets) {
      const availableLabelIds = new Set(labelSet.labels.map((label) => label.id));
      const validLabelIds = (selectedLabelSetLabelIdsBySet[labelSet.id] ?? []).filter((labelId) => availableLabelIds.has(labelId));
      if (validLabelIds.length > 0) {
        nextSelectedLabelSetLabelIdsBySet[labelSet.id] = validLabelIds;
      }
    }

    if (JSON.stringify(nextSelectedLabelSetLabelIdsBySet) !== JSON.stringify(selectedLabelSetLabelIdsBySet)) {
      onSelectedLabelSetLabelIdsBySetChange?.(
        Object.keys(nextSelectedLabelSetLabelIdsBySet).length > 0 ? nextSelectedLabelSetLabelIdsBySet : null
      );
    }
  }, [onSelectedLabelSetLabelIdsBySetChange, scopedLabelSets, selectedLabelSetLabelIdsBySet]);

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
      let labelOk = true;
      if (hasMultiLabelFilter) {
        const taskLabelIds = new Set((t.labels || []).map((label) => label.id));
          const selectedFilterLabelIds = new Set<string>(selectedLabelIds ?? []);

        if (selectedLabelId) {
            selectedFilterLabelIds.add(selectedLabelId);
        }

        for (const labelIds of Object.values(selectedLabelSetLabelIdsBySet ?? {})) {
          for (const labelId of labelIds) {
              selectedFilterLabelIds.add(labelId);
          }
        }

          labelOk = (t.labels || []).some((label) => selectedFilterLabelIds.has(label.id));
      } else {
        if (selectedLabelId) {
          labelOk = (t.labels || []).some((label) => label.id === selectedLabelId);
        }

        if (selectedLabelSetId) {
        const selectedLabelSet = scopedLabelSets.find((labelSet) => labelSet.id === selectedLabelSetId);
        if (selectedLabelSet) {
          const selectedLabelIds = new Set(
            selectedLabelSetLabelIds?.length
              ? selectedLabelSetLabelIds
              : selectedLabelSet.labels.map((label) => label.id)
          );
          labelSetOk = (t.labels || []).some((label) => selectedLabelIds.has(label.id));
        }
        }
      }

      return dateOk && projectOk && searchOk && labelOk && labelSetOk;
    });
    onFilter(filtered);
  }, [
    tasks,
    dateRange,
    selectedProject,
    searchTerm,
    selectedLabelId,
    selectedLabelIds,
    selectedLabelSetId,
    selectedLabelSetLabelIds,
    selectedLabelSetLabelIdsBySet,
    hasMultiLabelFilter,
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
          hasActiveFilters={hasActiveFilters}
          showProjectSelect={showProjectSelect}
          selectedProject={selectedProject}
          onSelectedProjectChange={onSelectedProjectChange}
          showLabelFilter={true}
          selectedLabelId={selectedLabelId}
          selectedLabelIds={selectedLabelIds}
          onSelectedLabelChange={onSelectedLabelChange}
          onSelectedLabelIdsChange={onSelectedLabelIdsChange}
          showLabelSetFilter={true}
          selectedLabelSetId={selectedLabelSetId}
          onSelectedLabelSetChange={onSelectedLabelSetChange}
          selectedLabelSetLabelIds={selectedLabelSetLabelIds}
          selectedLabelSetLabelIdsBySet={selectedLabelSetLabelIdsBySet}
          onSelectedLabelSetLabelIdsBySetChange={onSelectedLabelSetLabelIdsBySetChange}
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
