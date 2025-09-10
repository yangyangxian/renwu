import { Button } from '@/components/ui-kit/Button';
import { Badge } from '@/components/ui-kit/Badge';
import { useEffect } from 'react';
import { useLabelStore } from '@/stores/useLabelStore';
import { Label } from '@/components/ui-kit/Label';
import { HomePageSkeleton } from '@/components/homepage/HomePageSkeleton';

export default function LabelsPage() {
  const { labels, loading, fetchLabels } = useLabelStore();

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  return (
    <div className="w-full h-full p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div>
            <Label className="text-2xl font-semibold">My Labels</Label>
          </div>
        </div>
        <div>
          <Button variant="default">New Label</Button>
        </div>
      </div>

      <div>
        {loading && <HomePageSkeleton />}
        {!loading && labels.length === 0 && (
          <div className="text-muted-foreground">No labels yet. Click "New Label" to create one.</div>
        )}

        {!loading && labels.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {labels.map((l) => (
              <Badge key={l.id} variant="outline" className="px-3 py-1" style={{ background: l.color || undefined }}>
                {l.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
