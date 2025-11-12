import React, { useEffect } from 'react';
import { Card } from '@/components/ui-kit/Card';
import { ScrollArea } from '@/components/ui-kit/Scroll-area';
import LabelBadge from '@/components/common/LabelBadge';
import AddLabelDialog from '@/components/labelpage/AddLabelDialog';
import { useLabelStore } from '@/stores/useLabelStore';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui-kit/Button';

const SetCard: React.FC<{ set: any }> = ({ set }) => {
  const { fetchLabelsForSet, deleteLabel, deleteLabelSet } = useLabelStore();

  useEffect(() => {
    if (!set.labels || set.labels.length === 0) fetchLabelsForSet(set.id);
  }, [set.id]);

  return (
    <Card className="relative flex flex-col rounded-md shadow-none bg-background dark:bg-muted/60 max-w-[260px] w-auto h-[400px]">
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Delete ${set.name}`}
        onClick={() => deleteLabelSet(set.id)}
        className="absolute right-1 top-1 opacity-0 hover:opacity-100 transition-opacity text-gray-500 
          hover:text-red-600 bg-white/70 hover:bg-red-100 dark:bg-black/80 dark:hover:bg-red-900 
          rounded-full w-6 h-6 flex items-center justify-center z-9999"
        title={`Delete ${set.name}`}
      >
        <Trash2 className="w-3 h-3" />
      </Button>

      <div className="px-4 pt-3 pb-2 border-b border-border/40 shrink-0 flex items-center">
        <label className="text-md font-medium leading-tight truncate mr-2">{set.name}</label>
      </div>

      <div className="flex-1 min-h-0 pt-1">
        <ScrollArea className="h-full w-full px-3">
          <div className="flex flex-col space-y-2 my-2 overflow-x-visible">
            {(set.labels ?? []).map((l: any) => (
              <LabelBadge key={l.id} text={l.name} color={l.color} onDelete={() => deleteLabel(l.id)} />
            ))}
          </div>

          <AddLabelDialog labelSetId={set.id}/>

        </ScrollArea>
      </div>
    </Card>
  );
};

export default SetCard;
