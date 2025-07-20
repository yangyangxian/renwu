import React, { useRef, useState, useEffect } from 'react';
import { Card } from '@/components/ui-kit/Card';
import { Textarea } from '@/components/ui-kit/Textarea';
import { marked } from 'marked';
import { toast } from 'sonner';
import { ProjectResDto } from '@fullstack/common';

interface ProjectDescriptionCardProps {
  project: ProjectResDto;
  updateProject: (id: string, data: Partial<Pick<ProjectResDto, 'description'>>) => Promise<any>;
  className?: string;
}

export const ProjectDescriptionCard: React.FC<ProjectDescriptionCardProps> = ({ project, updateProject, className }) => {
  const [editingDesc, setEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState("");
  const descInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (project) {
      setDescInput(project.description || "");
    }
    setEditingDesc(false);
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

  const handleSubmitDes = async (newValue: string) => {
    setEditingDesc(false);
    setDescInput(newValue);
    if (!project) return;
    try {
      await updateProject(project.id, { description: newValue });
      toast.success('Project description updated');
    } catch {
      toast.error('Failed to update description');
      setDescInput(project.description || "");
    }
  };

  return (
    <Card className={`flex flex-1 flex-col h-full${className ? ` ${className}` : ''}`}>
      {editingDesc ? (
        <Textarea
          ref={descInputRef}
          initialValue={descInput}
          onSubmit={handleSubmitDes}
          onCancel={() => setEditingDesc(false)}
          className="min-h-40 my-4"
          maxLength={10000}
          storageKey={project?.id}
        />
      ) : (
        <>
          {descInput ? (
            <div
              className="markdown-body !text-[0.9rem] !leading-5 !bg-card !py-3 h-full cursor-pointer overflow-auto"
              onClick={handleDescClick}
              dangerouslySetInnerHTML={{ __html: marked.parse(descInput || '') }}
            />
          ) : (
            <div
              className="markdown-body !text-[0.9rem] !bg-card p-4 pt-5 cursor-pointer text-muted-foreground italic"
              onClick={handleDescClick}
            >
              Enter a project description… (Markdown supported!)
            </div>
          )}
        </>
      )}
    </Card>
  );
};
