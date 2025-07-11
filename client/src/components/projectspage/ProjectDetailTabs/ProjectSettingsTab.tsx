import { Card } from '@/components/ui-kit/Card';
import { Label } from '@/components/ui-kit/Label';
import React from 'react';

export function ProjectSettingsTab() {
  return (
    <Card className="flex flex-col h-full w-full p-3 shadow-none">
      <Label className="text-slate-500">Settings will be shown here.</Label>
    </Card>
  );
}
