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
    <Card className="flex flex-col rounded-md shadow-none bg-background dark:bg-muted/60 max-w-[260px] w-auto h-[400px]">
      <div className="px-4 pt-3 pb-2 border-b border-border/40 shrink-0 flex">
        <label className="text-md font-medium leading-tight truncate mr-2">{set.name}</label>
        <AddLabelDialog labelSetId={set.id}/>
      </div>

      <div className="flex-1 min-h-0 pt-1">
        <ScrollArea className="h-full w-full px-3">
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
