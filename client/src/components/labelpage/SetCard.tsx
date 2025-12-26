import React, { useState } from 'react';
import { Card } from '@/components/ui-kit/Card';
import LabelBadge from '@/components/common/LabelBadge';
import AddLabelDialog from '@/components/labelpage/AddLabelDialog';
import { useProjectStore } from '@/stores/useProjectStore';
import { useLabelStore } from '@/stores/useLabelStore';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui-kit/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui-kit/Dialog';
import { Label } from '../ui-kit/Label';
import GradientScrollArea from '../common/GradientScrollArea';

const SetCard: React.FC<{ set: any }> = ({ set }) => {
  const { deleteLabel, deleteLabelSet } = useLabelStore();
  const { currentProject } = useProjectStore();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <Card className="relative flex flex-col px-1 rounded-md shadow-none bg-background dark:bg-muted/60 max-w-[260px] w-auto h-[400px]">
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${set.name}`}
            onClick={() => setConfirmOpen(true)}
            className="absolute right-1 top-1 opacity-0 hover:opacity-100 transition-opacity text-gray-500 
              hover:text-red-600 bg-white/70 hover:bg-red-100 dark:bg-black/80 dark:hover:bg-red-900 
              rounded-full w-6 h-6 flex items-center justify-center z-9999"
            title={`Delete ${set.name}`}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete label set</DialogTitle>
          </DialogHeader>

          <Label className="text-sm">
            This will delete the label set "{set.name}" and all labels inside the set. This action cannot be undone. Are you sure you want to continue?
          </Label>

          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={async () => {
                setConfirmOpen(false);
                await deleteLabelSet(set.id);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="px-[14px] pt-2 pb-1 border-b border-border/40 shrink-0 flex items-center">
        <Label className="text-sm font-medium truncate">{set.name}</Label>
      </div>

      <GradientScrollArea topOverlayHeight={30} bottomOverlayHeight={40} scrollAreaClassName='px-3 pr-4 pt-3' className="h-full w-full">
        <div className="flex flex-col h-full"> 
          {/* why we need to add my-3 here? its because if we add py-3 on the scrollarea
              the content edge will not be aligned with the top of scroll bar which looks
              not good  */}    
          {(set.labels ?? []).map((l: any) => (
            <LabelBadge className="mb-2" key={l.id} text={l.name} color={l.color} onDelete={() => deleteLabel(l.id)} />
          ))}

          <AddLabelDialog labelSetId={set.id} projectId={currentProject?.id} />
        </div>

      </GradientScrollArea>

    </Card>
  );
};

export default SetCard;
