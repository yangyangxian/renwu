
import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui-kit/Card";
import { Input } from "@/components/ui-kit/Input";
import { Textarea } from "@/components/ui-kit/Textarea";
import { Label } from "@/components/ui-kit/Label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui-kit/Select";
import { Avatar, AvatarFallback } from "@/components/ui-kit/Avatar";
import { apiClient } from '@/utils/APIClient';
import { ProjectResDto } from '@fullstack/common';
import { ProjectRole } from '@fullstack/common';
import { toast } from "sonner";

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
  // No need for error state, we use toast for user feedback

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
    setTimeout(() => descInputRef.current?.focus(), 0);
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
    <div className="h-full w-full flex flex-col gap-4 p-2">
      {/* Project Info Card */}
      <Card className="flex flex-col w-1/3 shadow-2xs p-3">
        {loading ? (
          <Label className="text-slate-500">Loading project...</Label>
        ) : project ? (
          <>
            {/* Project Header */}
            <div className="flex items-center justify-between mb-2">
              {editingTitle ? (
                <Input
                  ref={titleInputRef}
                  value={titleInput}
                  onChange={e => setTitleInput(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={e => { if (e.key === 'Enter') { handleTitleBlur(); } }}
                  className="!text-xl font-bold truncate px-2 py-1"
                  maxLength={128}
                />
              ) : (
                <Label
                  className="text-xl font-black truncate cursor-pointer hover:bg-secondary dark:hover:bg-secondary px-2 py-1 rounded"
                  title={project.name}
                  onClick={handleTitleClick}
                >
                  {project.name ? project.name.charAt(0).toUpperCase() + project.name.slice(1) : ''}
                </Label>
              )}
              {/* Placeholder for future delete button */}
            </div>
            {/* Project Description */}
            <div>
              {editingDesc ? (
                <Textarea
                  ref={descInputRef}
                  value={descInput}
                  onChange={e => setDescInput(e.target.value)}
                  onBlur={handleDescBlur}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { handleDescBlur(); } }}
                  className="text-slate-700 dark:text-slate-300 whitespace-pre-line min-h-[6rem] px-2 py-1"
                  maxLength={256}
                  rows={2}
                />
              ) : (
                <Label
                  className="whitespace-pre-line cursor-pointer hover:bg-secondary dark:hover:bg-secondary p-2 rounded"
                  onClick={handleDescClick}
                  title={project.description || undefined}
                >
                  {project.description || <span className="italic">No description</span>}
                </Label>
              )}
            </div>
          </>
        ) : null}
      </Card>
      {/* Team Members Card */}
      <Card className="flex flex-col w-1/3 shadow-2xs px-5 py-3">
        <Label className="text-md font-semibold mb-2">Team Members</Label>
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
                  <Label className="font-medium text-slate-900 dark:text-white truncate mb-[2px]">{member.name}</Label>
                  <Label className="text-xs text-slate-500 truncate">{member.email}</Label>
                </div>
                {/* Role dropdown using UI kit Select, using real role if present */}
                <Select value={member.role || ProjectRole.MEMBER}>
                  <SelectTrigger className="px-3">
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
