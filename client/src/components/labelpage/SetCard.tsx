import React, { useEffect } from 'react';
import { Card } from '@/components/ui-kit/Card';
import { ScrollArea } from '@/components/ui-kit/Scroll-area';
import LabelBadge from '@/components/common/LabelBadge';
import AddLabelDialog from '@/components/labelpage/AddLabelDialog';
import { useLabelStore } from '@/stores/useLabelStore';

const SetCard: React.FC<{ set: any }> = ({ set }) => {
  const { fetchLabelsForSet, deleteLabel } = useLabelStore();

  useEffect(() => {
    if (!set.labels || set.labels.length === 0) fetchLabelsForSet(set.id);
  }, [set.id]);

  return (
    <Card className="flex flex-col rounded-md  shadow-none bg-background dark:bg-muted/60 max-w-[260px] w-auto h-[400px]">
      <div className="p-3 border-b border-border/40 shrink-0 flex">
        <label className="text-md font-medium leading-tight truncate px-2">{set.name}</label>
        <div className="flex items-center gap-1">
          <AddLabelDialog labelSetId={set.id} triggerClassName="!p-1 w-5 h-5 flex items-center justify-center text-muted-foreground" />
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full w-full px-[14px]">
          <div className="flex flex-col space-y-2 my-2">
            {(set.labels ?? []).map((l: any) => (
              <LabelBadge key={l.id} text={l.name} color={l.color} onDelete={() => deleteLabel(l.id)} />
            ))}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
};

export default SetCard;
