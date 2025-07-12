import { Card } from '@/components/ui-kit/Card';
import { Textarea } from '@/components/ui-kit/Textarea';
import { Label } from '@/components/ui-kit/Label';
import { Info } from 'lucide-react';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui-kit/Hover-card';
import { marked } from 'marked';
import React, { useState, useRef, useEffect } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { toast } from 'sonner';

interface ProjectOverviewTabProps {
  project: any;
  projectId: string;
  tasks: any[];
}

export function ProjectOverviewTab({ project, projectId, tasks }: ProjectOverviewTabProps) {
  const { updateProject } = useProjects(projectId);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState("");
  const descInputRef = useRef<HTMLTextAreaElement>(null);
  // Use descInput for live preview after editing
  const html = marked.parse(descInput || '');

  useEffect(() => {
    if (project) {
      setDescInput(project.description || "");
    }
  }, [project]);

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

  const handleDescBlur = async () => {
    setEditingDesc(false);
    if (!project) return;
    if (descInput !== (project.description || "")) {
      try {
        await updateProject(projectId, { description: descInput });
        toast.success('Project description updated');
      } catch {
        toast.error('Failed to update description');
        setDescInput(project.description || "");
      }
    } else {
      setDescInput(project.description || "");
    }
  };

  return (
    <div className="flex gap-3 h-full overflow-y-auto p-2">
        <Card className="flex h-full shadow-none p-3 w-1/2">
            {/* Example usage: dashboard with tasks count */}
            <div>Tasks: {tasks?.length ?? 0}</div>
        </Card>
        <Card className="flex flex-col h-full w-1/2 p-3 overflow-y-auto shadow-none">
            <div className="flex items-center gap-2 mb-1">
            <h2 className="text-md font-semibold">Project Description:</h2>
            <HoverCard openDelay={0}>
                <HoverCardTrigger asChild>
                <Info className="w-4 h-4" />
                </HoverCardTrigger>
                <HoverCardContent className="w-80 text-xs leading-relaxed">
                <div className="font-semibold text-sm mb-2">Markdown Syntax</div>
                <ul className="list-disc pl-5">
                    <li><b>Bold:</b> <code>**bold**</code> or <code>__bold__</code></li>
                    <li><b>Italic:</b> <code>*italic*</code> or <code>_italic_</code></li>
                    <li><b>Link:</b> <code>[title](url)</code></li>
                    <li><b>List:</b> <code>* item</code></li>
                    <li><b>Number List:</b> <code> 1. item</code></li>
                    <li><b>Heading:</b> <code># H1</code>, <code>## H2</code>, ...</li>
                    <li><b>Code:</b> <code>`inline code`</code> or <code>```block```</code></li>
                </ul>
                </HoverCardContent>
            </HoverCard>
            </div>
            {editingDesc ? (
            <Textarea
                ref={descInputRef}
                value={descInput}
                onChange={e => setDescInput(e.target.value)}
                onBlur={handleDescBlur}
                onKeyDown={e => { if (e.key === 'Escape') setEditingDesc(false); }}
                className="w-full h-full p-2 border rounded-md"
                maxLength={1024}
            />
            ) : (
            <>
                {descInput ? (
                <div
                    className="markdown-body !text-[0.95rem] !bg-card p-3 h-full cursor-pointer"
                    onClick={handleDescClick}
                    dangerouslySetInnerHTML={{ __html: html }}
                />
                ) : (
                <div
                    className="markdown-body !text-[0.95rem] !bg-card p-3 cursor-pointer text-muted-foreground italic"
                    onClick={handleDescClick}
                >
                    Enter a project description… (Markdown supported!)
                </div>
                )}
            </>
            )}
        </Card>
    </div>
  );
}
