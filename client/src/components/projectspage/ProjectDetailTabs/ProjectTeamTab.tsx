import { Card } from '@/components/ui-kit/Card';
import { Label } from '@/components/ui-kit/Label';
import { Avatar, AvatarFallback } from '@/components/ui-kit/Avatar';
import { UserPlus } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui-kit/Select';
import { ProjectRole } from '@fullstack/common';
import React from 'react';

interface ProjectTeamTabProps {
  project: any;
}

export function ProjectTeamTab({ project }: ProjectTeamTabProps) {
  return (
    <div className="flex gap-4 w-full">
      {/* Team Activities Card (left) */}
      <Card className="flex flex-col w-2/3 min-w-64 self-start px-5 py-4 shadow-none">
        <Label className="text-md font-semibold mb-2">Team Activities</Label>
        {/* Placeholder for activities */}
        <Label className="text-slate-400 italic">No activities yet.</Label>
      </Card>
      {/* Team Members Card (right, smaller) */}
      <Card className="flex flex-col w-1/3 min-w-48 self-start px-5 py-4 shadow-none">
        <div className="flex items-center justify-between">
          <Label className="text-md font-semibold">Team Members</Label>
          <UserPlus
            className="cursor-pointer hover:bg-secondary rounded mt-1 p-1"
            aria-label="Add project member"
            onClick={() => {/* TODO: open add member modal or trigger add logic */}}
          />
        </div>
        <Label className="text-muted-foreground mb-5">Invite your team members to collaborate.</Label>
        <div className="flex flex-col gap-4">
          {project?.members && project.members.length > 0 ? (
            project.members.map((member: any, idx: number) => (
              <div key={member.id || idx} className="flex items-center gap-4">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-lg font-bold text-slate-500 bg-slate-200">
                    {member.name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <Label className="font-medium text-slate-900 dark:text-white mb-[3px]">{member.name}</Label>
                  <Label className="text-xs text-slate-500">{member.email}</Label>
                </div>
                <Select value={member.role || ProjectRole.MEMBER}>
                  <SelectTrigger className="py-1">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ProjectRole).map(([key, value]) => (
                      <SelectItem key={value} value={value}>{key.charAt(0) + key.slice(1).toLowerCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))
          ) : (
            <Label className="text-slate-400 italic">No team members yet.</Label>
          )}
        </div>
      </Card>
    </div>
  );
}
