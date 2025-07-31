import { roleOptions } from '@/consts/roleOptions';
import { useProjectStore } from '@/stores/useProjectStore';
import { useState } from 'react';
import { Card } from '@/components/ui-kit/Card';
import { Label } from '@/components/ui-kit/Label';
import { Avatar, AvatarFallback } from '@/components/ui-kit/Avatar';
import { UserPlus } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui-kit/Select';
import { ProjectMemberResDto, ProjectResDto, ProjectRole, UserResDto } from '@fullstack/common';
import { MemberInvitationDialog } from '@/components/projectspage/settingTab/MemberInvitationDialog';
import { withToast } from '@/utils/toastUtils';
import { getErrorMessage } from '@/resources/errorMessages';

interface ProjectTeamTabProps {
  project: ProjectResDto | null;
}

export function ProjectTeamTab({ project }: ProjectTeamTabProps) {
  // roleOptions imported
  const [inviteOpen, setInviteOpen] = useState(false);
  const { updateMemberRoleToProject, projectRoles } = useProjectStore();

  const handleRoleChange = async (projectId: string, memberId: string, oldRoleId: string, newRoleId: string, newRoleName: string) => {
    if (newRoleId === oldRoleId) return;

    await withToast(
      async () => {
        await updateMemberRoleToProject(projectId, memberId, newRoleId, newRoleName);
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
            project.members.map((member: ProjectMemberResDto, idx: number) => (
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
                  value={member.roleId || ProjectRole.MEMBER}
                  onValueChange={async (newRole) => {
                    await handleRoleChange(project.id, member.id, member.roleId, newRole, projectRoles.find(role => role.id === newRole)?.name || '');
                  }}
                >
                  <SelectTrigger size="sm" className="min-w-[110px]">
                    <SelectValue>
                      {roleOptions.find(opt => opt.value === projectRoles.find(role => role.id === member.roleId)?.name)?.label || 'Role'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {projectRoles.map(role => {
                      const option = roleOptions.find(opt => opt.value === role.name);
                      return option ? (
                        <SelectItem key={role.id} value={role.id} className='cursor-pointer'>
                          <div className="flex flex-col">
                            <Label className="font-medium cursor-pointer">{option.label}</Label>
                            <span className="text-xs text-muted-foreground">{option.description}</span>
                          </div>
                        </SelectItem>
                      ) : null;
                    })}
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
      {inviteOpen && project != null && (
        <MemberInvitationDialog open={inviteOpen} setOpen={setInviteOpen} projectId={project!.id} />
      )}
    </div>
  );
}

