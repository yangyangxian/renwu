import React, { useRef, useState, useEffect } from 'react';
import { Card } from '@/components/ui-kit/Card';
import { toast } from 'sonner';
import { ProjectResDto } from '@fullstack/common';
import { MarkdownnEditor } from '@/components/common/editor/MarkdownEditor';
import { marked } from 'marked';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui-kit/Button';

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
    <Card className={`flex-1 overflow-y-auto h-full${className ? ` ${className}` : ''}`}>
      {editingDesc ? (
        <MarkdownnEditor
          value={descInput}
          onSave={(val) => { handleSubmitDes(val); setEditingDesc(false); }}
          onCancel={() => {
            setEditingDesc(false);
            setDescInput(project?.description || "");
          }}
          showSaveCancel={true}
        />
      ) : (
        <div className="relative group">
          {descInput ? (
            <>
              <div
                className="markdown-body pt-[18px]"
                dangerouslySetInnerHTML={{ __html: marked.parse(descInput) }}
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-5 right-3 opacity-70 group-hover:opacity-100 transition-opacity"
                onClick={handleDescClick}
                title="Edit description"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <div
              className="markdown-body"
              onClick={handleDescClick}
            >
              Enter a project description… (Markdown supported!)
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
