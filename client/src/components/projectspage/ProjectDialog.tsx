import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui-kit/Dialog";
import { Input } from "@/components/ui-kit/Input";
import { Textarea } from "@/components/ui-kit/Textarea";
import { Button } from "@/components/ui-kit/Button";
import { Label } from "@/components/ui-kit/Label";
import { FolderOpen, FileText } from "lucide-react";

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (project: { name: string; description: string }) => void;
  initialValues?: {
    name?: string;
    description?: string;
  };
  title?: string;
}

export const ProjectDialog: React.FC<ProjectDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialValues = {},
  title = "Add New Project",
}) => {
  const [name, setName] = useState(initialValues.name || "");
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Get the current value from the textarea ref
    const description = textareaRef.current?.value || "";
    
    await onSubmit({ name, description });
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <DialogTitle>{title}</DialogTitle>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-name" className="text-base flex items-center gap-3">
              <FolderOpen className="size-4" />
              Project Name
            </Label>
            <Input
              id="project-name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
              placeholder="Enter project name"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-description" className="text-base flex items-center gap-3">
              <FileText className="size-4" />
              Description
            </Label>
            <Textarea
              ref={textareaRef}
              id="project-description"
              initialValue={initialValues.description || ""}
              placeholder="Enter project description"
              rows={6}
              showButtons={false}
            />
          </div>
          <div className="flex justify-end gap-3">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
