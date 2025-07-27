import { roleOptions } from '@/consts/roleOptions';
import { useState } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { Card } from '@/components/ui-kit/Card';
import { Label } from '@/components/ui-kit/Label';
import { Avatar, AvatarFallback } from '@/components/ui-kit/Avatar';
import { UserPlus } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui-kit/Select';
import { ProjectRole, UserResDto } from '@fullstack/common';
import { MemberInvitationDialog } from '@/components/projectspage/settingTab/MemberInvitationDialog';
import { withToast } from '@/utils/toastUtils';
import { getErrorMessage } from '@/resources/errorMessages';

interface ProjectTeamTabProps {
  project: any;
}

export function ProjectTeamTab({ project }: ProjectTeamTabProps) {
  // roleOptions imported
  const [inviteOpen, setInviteOpen] = useState(false);
  const { updateMemberRoleToProject } = useProjectStore();

  const handleRoleChange = async (projectId: string, memberId: string, newRole: string, oldRole: string) => {
    if (newRole === oldRole) return;

    await withToast(
      async () => {
        await updateMemberRoleToProject(projectId, memberId, newRole);
      },
      {
        success: 'Role updated.',
        error: (err: any) =>
          getErrorMessage(err?.code, err?.message || 'Failed to update role. Please try again.')
      }
    );
  };

  return (
    <div className="flex flex-col gap-4 m-2 w-full">

      {/* Team Members Card */}
      <Card className="flex flex-col w-1/2 px-5 py-4 shadow-none">
        <div className="flex items-center justify-between">
          <Label className="text-md font-semibold">Team Members</Label>
          <UserPlus
            className="cursor-pointer hover:bg-secondary rounded mt-1 p-1"
            aria-label="Add project member"
            onClick={() => setInviteOpen(true)}
          />
        </div>
        <Label className="text-muted-foreground mb-5">Invite your team members to collaborate.</Label>
        <div className="flex flex-col gap-4">
          {project?.members && project.members.length > 0 ? (
            project.members.map((member: any, idx: number) => (
              <div key={member.id || idx} className="flex items-center gap-4">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-md font-bold text-primary-purple bg-secondary dark:bg-muted-foreground">
                    {member.name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <Label className="font-medium dark:text-white mb-1">{member.name}</Label>
                  <Label className="text-xs text-muted-foreground">{member.email}</Label>
                </div>
                <Select
                  value={member.role || ProjectRole.MEMBER}
                  onValueChange={async (newRole) => {
                    await handleRoleChange(project.id, member.id, newRole, member.role);
                  }}
                >
                  <SelectTrigger size="sm" className="min-w-[110px]">
                    <SelectValue>
                      {roleOptions.find((opt: typeof roleOptions[0]) => opt.value === member.role)?.label || 'Role'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((opt: typeof roleOptions[0]) => (
                      <SelectItem key={opt.value} value={opt.value} className='cursor-pointer'>
                        <div className="flex flex-col">
                          <Label className="font-medium cursor-pointer">{opt.label}</Label>
                          <span className="text-xs text-muted-foreground">{opt.description}</span>
                        </div>
                      </SelectItem>
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

      {/* Team Activities Card */}
      <Card className="flex flex-col w-1/2 px-5 py-4 shadow-none">
        <Label className="text-md font-semibold mb-2">Team Activities</Label>
        {/* Placeholder for activities */}
        <Label className="text-slate-400 italic">No activities yet.</Label>
      </Card>

      {/* Invite Member Modal */}
      {inviteOpen && (
        <MemberInvitationDialog open={inviteOpen} setOpen={setInviteOpen} projectId={project.id} />
      )}
    </div>
  );
}
