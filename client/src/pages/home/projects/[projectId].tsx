import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui-kit/Card";
import { Input } from "@/components/ui-kit/Input";
import { Label } from "@/components/ui-kit/Label";
import { ProjectOverviewTab } from "@/components/projectspage/ProjectDetailTabs/ProjectOverviewTab";
import { ProjectTasksTab } from "@/components/projectspage/ProjectDetailTabs/ProjectTasksTab";
import { ProjectTeamTab } from "@/components/projectspage/ProjectDetailTabs/ProjectTeamTab";
import { ProjectSettingsTab } from "@/components/projectspage/ProjectDetailTabs/ProjectSettingsTab";
import { Pencil } from "lucide-react";
import { LayoutDashboard, List, Users, Settings } from "lucide-react";
import { toast } from "sonner";
import { marked } from 'marked';
import { useProjects } from "@/hooks/useProjects";
import { Tabs, TabsList, TabsTrigger } from '@/components/ui-kit/Tabs';

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { project, updateProject } = useProjects(projectId);

  // If projectId is missing, show error
  if (!projectId) {
    return <div className="p-8 text-center text-lg text-red-500">Project not found.</div>;
  }

  // UI state for editing
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descInputRef = useRef<HTMLTextAreaElement>(null);
  const [activeTab, setActiveTab] = useState<'overview'|'tasks'|'team'|'settings'>('overview');
  
  const html = marked.parse(project?.description?.toString() || '');

  useEffect(() => {
    if (project) {
      setTitleInput(project.name || "");
      setDescInput(project.description || "");
    }
  }, [project]);

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
    if (!project) return;
    if (titleInput.trim() && titleInput !== project.name) {
      try {
        await updateProject(projectId, { name: titleInput });
        toast.success('Project name updated');
      } catch {
        toast.error('Failed to update project name');
        setTitleInput(project.name); // Revert on failure
      }
    } else {
      setTitleInput(project.name);
    }
  };
  
  const handleDescBlur = async () => {
    setEditingDesc(false);
    if (!project) return;
    if (descInput !== (project.description || "")) {
      try {
        await updateProject(projectId, { description: descInput });
        toast.success('Project description updated');
      } catch {
        toast.error('Failed to update description');
        setDescInput(project.description || ""); // Revert on failure
      }
    } else {
      setDescInput(project.description || "");
    }
  };

  return (
    <div className="h-full w-full flex flex-col gap-2 p-1">
      {/* Project Name at the top */}
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
            className="!text-[22px] font-black flex-1 h-[35px] rounded pl-2"
            maxLength={128}
          />
        ) : (
          <div className="flex items-center gap-2">
            <Label
              className="pl-1 text-[22px] font-black cursor-pointer hover:bg-secondary dark:hover:bg-secondary rounded"
              title={project?.name}
              onClick={handleTitleClick}
            >
              {project?.name ? project.name.charAt(0).toUpperCase() + project.name.slice(1) : ''}
            </Label>
            <span className="cursor-pointer flex items-center" title="Edit project name" onClick={handleTitleClick}>
              <Pencil className="ml-2 h-3 w-3 text-muted-foreground hover:text-primary" />
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={val => setActiveTab(val as typeof activeTab)}
        className="mb-2"
      >
        <TabsList className="bg-white dark:bg-muted">
          <TabsTrigger value="overview" className="px-4 flex items-center gap-2 focus:z-10 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-black">
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tasks" className="px-4 flex items-center gap-2 focus:z-10 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-black">
            <List className="w-4 h-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="team" className="px-4 flex items-center gap-2 focus:z-10 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-black">
            <Users className="w-4 h-4" />
            Team Activities
          </TabsTrigger>
          <TabsTrigger value="settings" className="px-4 flex items-center gap-2 focus:z-10 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-black">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <ProjectOverviewTab
          project={project}
          editingDesc={editingDesc}
          descInput={descInput}
          descInputRef={descInputRef}
          handleDescClick={handleDescClick}
          handleDescBlur={handleDescBlur}
          setEditingDesc={setEditingDesc}
          setDescInput={setDescInput}
        />
      )}
      {activeTab === 'tasks' && <ProjectTasksTab />}
      {activeTab === 'team' && <ProjectTeamTab project={project} />}
      {activeTab === 'settings' && <ProjectSettingsTab />}
    </div>
  );
}
