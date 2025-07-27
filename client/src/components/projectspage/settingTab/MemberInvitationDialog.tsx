import { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { getUsersByEmailSearch } from '@/apiRequests/apiEndpoints';
import { Card } from '@/components/ui-kit/Card';
import { Label } from '@/components/ui-kit/Label';
import { Avatar, AvatarFallback } from '@/components/ui-kit/Avatar';
import { UserPlus } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui-kit/Select';
import { ProjectAddMemberResDto, ProjectRole, UserResDto } from '@fullstack/common';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui-kit/Dialog';
import { Check, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui-kit/Button';
import { Input } from '@/components/ui-kit/Input';
import { apiClient } from '@/utils/APIClient';
import { addProjectMember } from '@/apiRequests/apiEndpoints';
import { withToast } from '@/utils/toastUtils';
import { getErrorMessage } from '@/resources/errorMessages';
import { roleOptions } from '@/consts/roleOptions';

interface MemberInvitationDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  projectId: string;
}

export function MemberInvitationDialog({ open, setOpen, projectId }: MemberInvitationDialogProps) {
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const justSelectedUserRef = useRef(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const blurTimeout = useRef<NodeJS.Timeout | null>(null);
  const [selectedRole, setSelectedRole] = useState(ProjectRole.MEMBER);
  const [inviteLoading, setInviteLoading] = useState(false);
  const { fetchCurrentProject } = useProjectStore();

  useEffect(() => {
    if (justSelectedUserRef.current) {
      justSelectedUserRef.current = false;
      return;
    }
    if (open && searchEmail.length >= 1 && (searchLoading || searchResults.length > 0)) {
      setDropdownOpen(true);
    }
  }, [searchLoading, searchResults, open, searchEmail]);

  const handleSearchEmailChange = (value: string) => {
    setSearchEmail(value);
    setSearchResults([]);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    if (value.length < 1) return;
    setSearchLoading(true);
    debounceTimeout.current = setTimeout(async () => {
      try {
        const data = await apiClient.get(getUsersByEmailSearch(value)) as UserResDto[];
        setSearchResults(data);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  };

  const handleInvite = async () => {
    setInviteLoading(true);
    await withToast(
      async () => {
        const res: ProjectAddMemberResDto = await apiClient.post(addProjectMember(projectId), {
          email: searchEmail,
          role: selectedRole,
        });
        if (!res.success) {
          throw new Error('Invitation failed to send email.');
        }
        await fetchCurrentProject(projectId);
        setOpen(false);
      },
      {
        success: 'Member invited.',
        error: (err: any) => getErrorMessage(err?.code, err?.message || 'Failed to invite member.')
      }
    );
    setInviteLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add Project Member
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-3">
          {/* Email Entry Section */}
          <div className="flex flex-col gap-1">
            <Label className="font-medium flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              Enter an email address to invite a user
            </Label>
            <Label className="text-xs text-muted-foreground mb-2">
              If the email matches an existing user, you can select them from the dropdown. If the email does not exist, an invitation will be sent to that address to join your project.
            </Label>
            <div className="relative">
              <Input
                type="email"
                className="w-full border rounded-lg px-3 py-2"
                value={searchEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearchEmail(e.target.value);
                  handleSearchEmailChange(e.target.value);
                  setSelectedUser(null);
                  justSelectedUserRef.current = false;
                }}
                onFocus={() => {
                  if (searchEmail.length >= 2 && open) {
                    setDropdownOpen(true);
                  }
                }}
                onBlur={() => {
                  blurTimeout.current = setTimeout(() => setDropdownOpen(false), 120);
                }}
                autoComplete="off"
              />
              {(searchEmail.length >= 1 && open && (searchLoading || searchResults.length > 0) && dropdownOpen) && (
                <Card
                  className={cn(
                    "absolute left-0 right-0 mt-2 z-10 rounded-md outline outline-gray-200 dark:outline-[#2A2B2F] shadow bg-popover dark:bg-popover text-popover-foreground",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2",
                  )}
                  data-state={dropdownOpen ? "open" : "closed"}
                  data-side="bottom"
                  onMouseDown={() => {
                    if (blurTimeout.current) clearTimeout(blurTimeout.current);
                  }}
                >
                  {searchLoading ? (
                    <Label className="px-3 py-2 text-muted-foreground">Searching...</Label>
                  ) : (
                    <div className="p-1">
                      {searchResults.map((user, idx) => (
                        <div
                          key={user.id || idx}
                          tabIndex={0}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded-md text-sm outline-none transition-colors",
                            selectedUser?.email === user.email
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-muted hover:text-foreground focus-visible:bg-accent focus-visible:text-accent-foreground active:bg-accent/80"
                          )}
                          onMouseDown={() => {
                            setSelectedUser(user);
                            setSearchEmail(user.email);
                            setDropdownOpen(false);
                            justSelectedUserRef.current = true;
                          }}
                        >
                          <Avatar className="w-6 h-6"><AvatarFallback>{user.name?.[0] || '?'}</AvatarFallback></Avatar>
                          <div className="flex-1 min-w-0">
                            <Label className="font-medium cursor-pointer">{user.name}</Label>
                            <Label className="block text-xs text-muted-foreground cursor-pointer">{user.email}</Label>
                          </div>
                          <Check className={cn("ml-auto w-4 h-4 transition-opacity duration-100", selectedUser?.email === user.email ? "opacity-100" : "opacity-0")} />
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}
            </div>
          </div>

          {/* Role Selection Section */}
          <div className="flex flex-col gap-2 mt-3">
            <Label className="font-medium flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-muted-foreground" />
              Role for new member
            </Label>
            <Select value={selectedRole} onValueChange={value => setSelectedRole(value as ProjectRole)}>
              <SelectTrigger className="w-full text-secondary-foreground">
                <SelectValue>
                  {roleOptions.find(opt => opt.value === selectedRole)?.label || 'Role'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map(opt => (
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
          <div className="flex gap-2 justify-end mt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              disabled={inviteLoading || !searchEmail || !selectedRole}
              onClick={handleInvite}
            >
              {inviteLoading ? 'Inviting...' : 'Invite'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
