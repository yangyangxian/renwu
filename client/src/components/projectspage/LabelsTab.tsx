import LabelBadge from '@/components/common/LabelBadge';
import { useEffect } from 'react';
import { useLabelStore } from '@/stores/useLabelStore';
import { Label } from '@/components/ui-kit/Label';
import { HomePageSkeleton } from '@/components/homepage/HomePageSkeleton';
import { Card } from '@/components/ui-kit/Card';
import AddLabelDialog from '@/components/labelpage/AddLabelDialog';
import AddLabelSetDialog from '@/components/labelpage/AddLabelSetDialog';
import SetCard from '@/components/labelpage/SetCard';
import { useProjectStore } from '@/stores/useProjectStore';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useState } from 'react';

export function ProjectLabelsTab() {
  const { currentProject } = useProjectStore();
  const { labels, loading, fetchLabels, deleteLabel, labelSets, fetchLabelSets } = useLabelStore();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [labelToDelete, setLabelToDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!currentProject?.id) return;
    fetchLabels(currentProject.id);
    fetchLabelSets(currentProject.id);
  }, [fetchLabels, fetchLabelSets, currentProject?.id]);

  return (
    <Card className="shadow-none m-2 p-6 py-4 flex flex-col gap-8 w-1/2">
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete label"
        description={
          <Label className="text-sm">
            This will permanently delete the label{labelToDelete?.name ? ` "${labelToDelete.name}"` : ''} from this
            project. This action cannot be undone. Are you sure you want to continue?
          </Label>
        }
        confirmText="Delete"
        confirmVariant="destructive"
        confirmDisabled={!labelToDelete}
        onConfirm={async () => {
          if (!labelToDelete) return;
          await deleteLabel(labelToDelete.id);
          setLabelToDelete(null);
        }}
        onCancel={() => setLabelToDelete(null)}
      />
      <section>
        <div className="mb-4">
          <Label className="text-xl font-medium">Labels</Label>
          <Label className="block text-[13px] text-muted-foreground leading-relaxed font-normal">
            Configure labels for this project.
          </Label>
        </div>
        <div className="flex items-start">
          {loading && <HomePageSkeleton />}
          {!loading && (
            <Card
              className="p-3 px-4 flex flex-wrap gap-3 card-border max-w-full w-[600px]"
            >
              <div className="flex flex-wrap items-center gap-2">
                {labels.map((l: any) => (
                  <LabelBadge
                    key={l.id}
                    text={l.name}
                    color={l.color}
                    onDelete={() => {
                      setLabelToDelete({ id: l.id, name: l.name });
                      setDeleteConfirmOpen(true);
                    }}
                  />
                ))}
                <AddLabelDialog triggerClassName="ml-1" projectId={currentProject?.id} />
              </div>
            </Card>
          )}
        </div>
      </section>

      <section className="flex flex-col flex-1 overflow-hidden">
        <div className="mb-5">
          <div className="flex items-center gap-3">
            <Label className="text-xl font-medium">Label Sets</Label>
            <AddLabelSetDialog projectId={currentProject?.id} />
          </div>
          <Label className="block text-[13px] text-muted-foreground leading-relaxed font-normal">
            These sets can be applied to this project.
          </Label>
        </div>
        <div className="overflow-x-auto pb-3 pr-2 overflow-y-visible">
          {loading ? (
            <HomePageSkeleton />
          ) : (
            <div className="flex gap-3 items-start w-max">
              {labelSets.map(set => (
                <SetCard key={set.id} set={set} />
              ))}
            </div>
          )}
        </div>
      </section>
    </Card>
  );
}
