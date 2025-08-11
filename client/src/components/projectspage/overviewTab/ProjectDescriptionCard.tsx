import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui-kit/Card';
import { toast } from 'sonner';
import { ProjectResDto } from '@fullstack/common';
import { MarkdownnEditor, MarkdownEditorHandle } from '@/components/common/editor/MarkdownEditor';
import { marked } from 'marked';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui-kit/Button';
import { UnsavedChangesIndicator } from '@/components/common/UnsavedChangesIndicator';

interface ProjectDescriptionCardProps {
  project: ProjectResDto;
  updateProject: (id: string, data: Partial<Pick<ProjectResDto, 'description'>>) => Promise<any>;
  className?: string;
}

export const ProjectDescriptionCard: React.FC<ProjectDescriptionCardProps> = ({ project, updateProject, className }) => {
  const [editingDesc, setEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState("");
  const descInputRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<MarkdownEditorHandle | null>(null);
  const [isDirty, setIsDirty] = useState(false);

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

  const renderedHtml: string = useMemo(() => {
    const out = marked.parse(descInput) as unknown;
    return typeof out === 'string' ? out : '';
  }, [descInput]);

  return (
    <Card className={`flex-1 break-all overflow-y-auto h-full ${className ? ` ${className}` : ''}`}>
      {editingDesc ? (
        <div className="relative h-full">
          <div className="flex overflow-y-auto h-93/100 pr-3">
            <MarkdownnEditor
              ref={editorRef}
              value={descInput}
              onSave={(val) => { handleSubmitDes(val); setEditingDesc(false); }}
              onCancel={() => {
                setEditingDesc(false);
                setDescInput(project?.description || "");
              }}
              showSaveCancel={false}
              onDirtyChange={setIsDirty}
            />
          </div>
          <div className="flex justify-end items-center gap-2 my-2">
            {isDirty && (
              <div className='mr-3'>
                <UnsavedChangesIndicator />
              </div>
            )}
            <Button size="sm" variant="default" disabled={!isDirty} onClick={() => editorRef.current?.save()}>
              Save
            </Button>
            <Button size="sm" variant="secondary" onClick={() => editorRef.current?.cancel()}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative group">
          {descInput ? (
            <>
              <div
                className="markdown-body pt-[18px] pr-3"
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-5 right-1 opacity-70 group-hover:opacity-100 transition-opacity"
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
