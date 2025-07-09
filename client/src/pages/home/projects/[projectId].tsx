import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui-kit/Card";
import { Input } from "@/components/ui-kit/Input";
import { Textarea } from "@/components/ui-kit/Textarea";
import { Label } from "@/components/ui-kit/Label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui-kit/Select";
import { Avatar, AvatarFallback } from "@/components/ui-kit/Avatar";
import { UserPlus } from "lucide-react";
import { apiClient } from '@/utils/APIClient';
import { ProjectResDto } from '@fullstack/common';
import { ProjectRole } from '@fullstack/common';
import { toast } from "sonner";
import { marked } from 'marked';

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<ProjectResDto | null>(null);
  const [loading, setLoading] = useState(true);
  // UI state for editing
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descInputRef = useRef<HTMLTextAreaElement>(null);

  const html = marked.parse(project?.description?.toString() || '');

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    apiClient.get<ProjectResDto>(`/api/projects/${projectId}`)
      .then((data) => {
        setProject(data);
        setTitleInput(data?.name || "");
        setDescInput(data?.description || "");
      })
      .catch((err) => {
        const msg = err?.message || 'Failed to load project';
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  // Handlers for editing
  const handleTitleClick = () => {
    setEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };
  const handleDescClick = () => {
    setEditingDesc(true);
    setTimeout(() => {
      if (descInputRef.current) {
        descInputRef.current.focus();
        const val = descInputRef.current.value;
        descInputRef.current.setSelectionRange(val.length, val.length);
      }
    }, 0);
  };
  const handleTitleBlur = async () => {
    setEditingTitle(false);
    if (project && titleInput.trim() && titleInput !== project.name) {
      try {
        const updated = await apiClient.put(`/api/projects/${project.id}`, { name: titleInput });
        setProject((p) => p ? { ...p, name: titleInput } : p);
        toast.success('Project name updated');
      } catch {
        toast.error('Failed to update project name');
        setTitleInput(project.name);
      }
    } else if (project) {
      setTitleInput(project.name);
    }
  };
  const handleDescBlur = async () => {
    setEditingDesc(false);
    if (project && descInput !== (project.description || "")) {
      try {
        const updated = await apiClient.put(`/api/projects/${project.id}`, { description: descInput });
        setProject((p) => p ? { ...p, description: descInput } : p);
        toast.success('Project description updated');
      } catch {
        toast.error('Failed to update description');
        setDescInput(project.description || "");
      }
    } else if (project) {
      setDescInput(project.description || "");
    }
  };

  return (
    <div className="h-full w-full flex gap-4 p-1">
      {/* Project Info Card */}
      <Card className="flex flex-col h-full w-7/10 p-3 shadow-none">
        {loading ? (
          <Label className="text-slate-500">Loading project...</Label>
        ) : project ? (
          <>
            {/* Project Header (no icon) */}
            <div className="flex items-center mb-2">
              {editingTitle ? (
                <Input
                  ref={titleInputRef}
                  value={titleInput}
                  onChange={e => setTitleInput(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={e => { 
                    if (e.key === 'Enter') { 
                      handleTitleBlur(); 
                    } else if (e.key === 'Escape') {
                      setEditingTitle(false);
                    }
                  }}
                  className="!text-2xl font-bold flex-1 h-14"
                  maxLength={128}
                />
              ) : (
                <Label
                  className="text-2xl font-black truncate cursor-pointer hover:bg-secondary dark:hover:bg-secondary rounded p-3 flex-1"
                  title={project.name}
                  onClick={handleTitleClick}
                >
                  {project.name ? project.name.charAt(0).toUpperCase() + project.name.slice(1) : ''}
                </Label>
              )}
            </div>
            {/* Project Description */}
            <hr className="border-t border-gray-200 dark:border-gray-700 mb-4" />
            <div className="p-4 flex flex-col flex-1 overflow-auto">
              <h2 className="text-md font-semibold mb-2">Project Description:</h2>
              {editingDesc ? (
                <Textarea
                  ref={descInputRef}
                  value={descInput}
                  onChange={e => setDescInput(e.target.value)}
                  onBlur={handleDescBlur}
                  onCancel={() => {
                    setEditingDesc(false);
                  }}
                  placeholder="Enter a project description…(Markdown supported!)"
                  className="flex-1 !text-[0.95rem] min-h-[15rem] leading-relaxed px-4 mt-3"
                  autoSize={true}
                  maxLength={5000}
                />
              ) : (
                <div className="overflow-y-auto">
                  {project?.description ? (
                    <div
                      className="markdown-body !text-[0.95rem] !bg-card p-4 cursor-pointer"
                      onClick={handleDescClick}
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  ) : (
                    <div
                      className="markdown-body !text-[0.95rem] !bg-card p-4 cursor-pointer text-muted-foreground italic"
                      onClick={handleDescClick}
                    >
                      Enter a project description… (Markdown supported!)
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : null}
      </Card>
      {/* Team Members Card */}
      <Card className="flex flex-col w-3/10 min-w-50 self-start px-5 py-4 shadow-none">
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
            project.members.map((member, idx) => (
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
                {/* Role dropdown using UI kit Select, using real role if present */}
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
      {/* Other cards can be added below here in the future */}
    </div>
  );
}
