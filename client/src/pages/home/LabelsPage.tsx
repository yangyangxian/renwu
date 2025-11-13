import LabelBadge from '@/components/common/LabelBadge';
import { useEffect, useMemo } from 'react';
import { useLabelStore } from '@/stores/useLabelStore';
import { Label } from '@/components/ui-kit/Label';
import { HomePageSkeleton } from '@/components/homepage/HomePageSkeleton';
import { Card } from '@/components/ui-kit/Card';
import AddLabelDialog from '@/components/labelpage/AddLabelDialog';
import AddLabelSetDialog from '@/components/labelpage/AddLabelSetDialog';
import SetCard from '@/components/labelpage/SetCard';
export default function LabelsPage() {
  const { labels, loading, fetchLabels, deleteLabel, labelSets, fetchLabelSets } = useLabelStore();

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  useEffect(() => {
    fetchLabelSets();
  }, [fetchLabelSets]);

  return (
    <div className="w-full h-full p-3 py-3 flex flex-col gap-8 overflow-hidden">
      {/* My Labels Section */}
      <section>
        <div className="mb-4">
          <Label className="text-xl font-medium">Labels</Label>
          <Label className="block text-[13px] text-muted-foreground leading-relaxed font-normal">
            Personal labels you create here can be applied to your own tasks or attached to a project later.
          </Label>
        </div>
        <div className="flex items-start">

          {loading && <HomePageSkeleton />}
          {!loading && (
            <Card className="p-3 flex flex-wrap gap-3 shadow-none rounded-md border 
              bg-background dark:bg-muted/60 max-w-full w-[600px]">
              <div className="flex flex-wrap items-center gap-2">
                {labels.map((l: any) => (
                  <LabelBadge
                    key={l.id}
                    text={l.name}
                    color={l.color}
                    onDelete={() => deleteLabel(l.id)}
                  />
                ))}
                <AddLabelDialog />
              </div>
            </Card>
          )}

        </div>
      </section>

      {/* Label Sets Section */}
      <section className="flex flex-col flex-1 overflow-hidden">
        <div className="mb-5">
            <div className="flex items-center gap-2">
            <Label className="text-xl font-medium">Label Sets</Label>
            <AddLabelSetDialog />
          </div>
          <Label className="block text-[13px] text-muted-foreground leading-relaxed font-normal">
            These sets can be applied to your personal tasks or linked to a project.
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
    </div>
  );
}
