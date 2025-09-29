import { Button } from '@/components/ui-kit/Button';
import { Badge } from '@/components/ui-kit/Badge'; // (legacy usage can be removed later)
import LabelBadge from '@/components/common/LabelBadge';
import { useEffect, useMemo } from 'react';
import { useLabelStore } from '@/stores/useLabelStore';
import { Label } from '@/components/ui-kit/Label';
import { HomePageSkeleton } from '@/components/homepage/HomePageSkeleton';
import { ScrollArea } from '@/components/ui-kit/Scroll-area';
import { Card } from '@/components/ui-kit/Card';
import { Plus } from 'lucide-react';

// Simple mock label sets until API is implemented
interface MockLabelSet {
  id: string;
  name: string;
  labels: { id: string; name: string; color?: string }[];
}

export default function LabelsPage() {
  const { labels, loading, fetchLabels } = useLabelStore();

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  // Derive some mock label sets from existing labels (repeat / slice) for UI preview
  const mockLabelSets: MockLabelSet[] = useMemo(() => {
    const base = labels.slice(0, 6);
    const fallback: MockLabelSet[] = [
      {
        id: 'set-task-type',
        name: 'Task Type',
        labels: base.length ? base : [
          { id: 'bug', name: 'Bug', color: '#991b1b' },
          { id: 'enhancement', name: 'Enhancement', color: '#1d4ed8' },
          { id: 'feature', name: 'New Feature', color: '#ca8a04' },
        ],
      },
      {
        id: 'set-priority',
        name: 'Priority',
        labels: [
          { id: 'p0', name: 'P0', color: '#dc2626' },
          { id: 'p1', name: 'P1', color: '#ea580c' },
          { id: 'p2', name: 'P2', color: '#d97706' },
          { id: 'p3', name: 'P3', color: '#65a30d' },
          { id: 'p4', name: 'P4', color: '#0d9488' },
        ],
      },
      {
        id: 'set-sprint',
        name: 'Sprint',
        labels: [
          { id: 'sprint-50', name: 'sprint-50', color: '#334155' },
          { id: 'sprint-48', name: 'sprint-48', color: '#475569' },
          { id: 'sprint-47', name: 'sprint-47', color: '#475569' },
          { id: 'sprint-46', name: 'sprint-46', color: '#64748b' },
          { id: 'sprint-45', name: 'sprint-45', color: '#64748b' },
          { id: 'sprint-44', name: 'sprint-44', color: '#94a3b8' },
          { id: 'sprint-43', name: 'sprint-43', color: '#475569' },
          { id: 'sprint-42', name: 'sprint-42', color: '#64748b' },
          { id: 'sprint-41', name: 'sprint-41', color: '#64748b' },
          { id: 'sprint-40', name: 'sprint-40', color: '#94a3b8' },
          { id: 'sprint-45', name: 'sprint-45', color: '#64748b' },
          { id: 'sprint-44', name: 'sprint-44', color: '#94a3b8' },
          { id: 'sprint-43', name: 'sprint-43', color: '#475569' },
          { id: 'sprint-42', name: 'sprint-42', color: '#64748b' },
          { id: 'sprint-41', name: 'sprint-41', color: '#64748b' },
          { id: 'sprint-40', name: 'sprint-40', color: '#94a3b8' },
        ],
      },
      // Additional mock sets to force horizontal scrolling
      ...Array.from({ length: 1 }).map((_, i) => ({
        id: `set-mock-${i}`,
        name: `Set ${i + 1}`,
        labels: [
          { id: `m-${i}-1`, name: `Item ${i + 1}-1`, color: '#1d4ed8' },
          { id: `m-${i}-2`, name: `Item ${i + 1}-2`, color: '#7c3aed' },
          { id: `m-${i}-3`, name: `Item ${i + 1}-3`, color: '#0d9488' },
          { id: `m-${i}-4`, name: `Item ${i + 1}-4`, color: '#ca8a04' },
          { id: `m-${i}-5`, name: `Item ${i + 1}-5`, color: '#475569' },
        ],
      })),
    ];
    return fallback;
  }, [labels]);

  return (
    <div className="w-full h-full p-3 py-3 flex flex-col gap-8 overflow-hidden">
      {/* My Labels Section */}
      <section>
        <div className="mb-3">
          <Label className="text-xl font-medium">Labels</Label>
        </div>
        <div className="flex items-start">
          <Card className="p-3 flex flex-wrap gap-3 shadow-none rounded-md border bg-background dark:bg-muted/60 max-w-full">
            {loading && <HomePageSkeleton />}
            {!loading && (
              <div className="flex flex-wrap items-center gap-3">
                {(labels.length > 0 ? labels : [
                  { id: 'mock-bug', name: 'Bug', color: '#991b1b' },
                  { id: 'mock-enh', name: 'Enhancement', color: '#1d4ed8' },
                  { id: 'mock-feature', name: 'New Feature', color: '#ca8a04' },
                  { id: 'mock-docs', name: 'Docs', color: '#0369a1' },
                  { id: 'mock-refactor', name: 'Refactor', color: '#7c3aed' },
                ]).map((l: any) => (
                  <LabelBadge key={l.id} text={l.name} color={l.color} />
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Add new label"
                  className="!p-1 w-6 h-6 flex items-center justify-center rounded-md bg-gray-200 dark:bg-muted/70 hover:bg-gray-200/70 text-muted-foreground"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* Label Sets Section */}
      <section className="flex flex-col gap-4 flex-1 overflow-hidden">
        <div className="flex items-center gap-3 mb-1">
          <Label className="text-xl font-medium">Label Sets</Label>
          <Button
            variant="outline"
            size="icon"
            aria-label="Add label set"
            className="!p-1 w-6 h-6 flex items-center justify-center rounded-md bg-gray-200 dark:bg-muted/70 hover:bg-gray-200/70 text-muted-foreground"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
        <div className="overflow-x-auto pb-3 pr-2 -ml-1">
          {loading ? (
            <HomePageSkeleton />
          ) : (
            <div className="flex gap-3 items-start w-max pl-1">
              {mockLabelSets.map(set => (
                <Card
                  key={set.id}
                  className="flex flex-col rounded-md  shadow-none bg-background dark:bg-muted/60 max-w-[260px] w-auto h-[400px]"
                >
                  <div className="px-[14px] py-3 border-b border-border/40 shrink-0">
                    <h3 className="text-sm font-medium leading-tight truncate">{set.name}</h3>
                  </div>

                  <div className="flex-1 min-h-0">{/* establishes containing block for ScrollArea viewport */}
                    <ScrollArea className="h-full w-full px-[14px]">
                      <div className="flex flex-col space-y-2 my-2">
                        {set.labels.map(l => (
                          <LabelBadge key={l.id} text={l.name} color={l.color} />
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
