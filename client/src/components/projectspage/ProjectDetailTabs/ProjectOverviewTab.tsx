import { Card } from '@/components/ui-kit/Card';
import { Textarea } from '@/components/ui-kit/Textarea';
import { Label } from '@/components/ui-kit/Label';
import { Info } from 'lucide-react';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui-kit/Hover-card';
import { marked } from 'marked';
import { useState, useRef, useEffect } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { toast } from 'sonner';
import { RadioChartCard } from '@/components/RadioChartCard';
import { TaskStatus } from '@fullstack/common';

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
  //const html = marked.parse(descInput || '');
  console.log("ProjectOverviewTab rendered with project.");

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

  // Helper to normalize description for comparison
  const normalizeDesc = (str: string) =>
    (str || "")
      .replace(/\r\n/g, "\n") // normalize line endings
      .replace(/\s+$/gm, "")    // trim trailing spaces per line
      .trim();

  const handleDescBlur = async () => {
    setEditingDesc(false);
    if (!project) return;
    const prev = normalizeDesc(project.description || "");
    const next = normalizeDesc(descInput);
    if (next !== prev) {
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

  // Canonical status config for chart
  const statusConfig: Record<string, { label: string; color: string; dotClass: string }> = {
    [TaskStatus.TODO]: {
      label: 'To Do',
      color: '#f59e42',
      dotClass: 'bg-amber-400',
    },
    [TaskStatus.IN_PROGRESS]: {
      label: 'In Progress',
      color: '#2563eb',
      dotClass: 'bg-blue-600',
    },
    [TaskStatus.DONE]: {
      label: 'In Review',
      color: '#10b981',
      dotClass: 'bg-emerald-500',
    },
    [TaskStatus.CLOSE]: {
      label: 'Done',
      color: '#a3a3a3',
      dotClass: 'bg-gray-400',
    },
  };

  const statusKeys = Object.keys(statusConfig);
  const statusCounts: Record<string, number> = {};
  statusKeys.forEach(key => { statusCounts[key] = 0; });
  if (Array.isArray(tasks)) {
    tasks.forEach(task => {
      // Normalize status key (assume task.status matches TaskStatus values)
      const key = String(task.status).toLowerCase();
      if (statusCounts.hasOwnProperty(key)) {
        statusCounts[key]++;
      }
    });
  }
  const chartData = statusKeys.map(key => ({
    key,
    value: statusCounts[key],
    label: statusConfig[key].label,
    color: statusConfig[key].color,
    dotClass: statusConfig[key].dotClass,
  }));

  return (
    <div className="flex gap-3 p-2 items-start flex-1 overflow-y-auto">
      <RadioChartCard data={chartData} className='w-1/3 lg:w-1/4'/>
      <Card className="flex flex-1 flex-col h-full shadow-md pb-3">
        <div className="flex items-center gap-2 p-3 border-b-1">
          <Label className="text-md font-semibold">Project Description:</Label>
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
            className="w-9.5/10 p-2 m-4 mb-1 border rounded-md overflow-y-auto min-h-50"
            maxLength={10000}
          />
        ) : (
          <>
            {descInput ? (
              <div
                className="markdown-body !text-[1rem] !leading-5 !bg-card p-4 pt-5 h-full cursor-pointer overflow-auto"
                onClick={handleDescClick}
                dangerouslySetInnerHTML={{ __html: marked.parse(descInput || '') }}
              />
            ) : (
              <div
                className="markdown-body !text-[0.95rem] !bg-card p-4 pt-5 cursor-pointer text-muted-foreground italic"
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
