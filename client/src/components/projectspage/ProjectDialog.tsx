import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui-kit/Dialog";
import { Input } from "@/components/ui-kit/Input";
import { Textarea } from "@/components/ui-kit/Textarea";
import { Button } from "@/components/ui-kit/Button";
import { Label } from "@/components/ui-kit/Label";
import { FolderOpen, FileText, Tag } from "lucide-react";
import { ProjectCreateReqSchema } from "@fullstack/common";

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (project: { name: string; slug: string; description: string }) => void;
  initialValues?: {
    name?: string;
    slug?: string;
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
  const [slug, setSlug] = useState(initialValues.slug || "");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; slug?: string; description?: string }>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const description = textareaRef.current?.value || "";
    // Validate using Zod schema
    const result = ProjectCreateReqSchema.safeParse({ name, slug, description });
    if (!result.success) {
      // Map Zod errors to field errors
      const fieldErrors: { name?: string; slug?: string; description?: string } = {};
      result.error.issues.forEach((err) => {
        const key = err.path[0];
        if (typeof key === "string" && (key === "name" || key === "slug" || key === "description")) {
          fieldErrors[key] = err.message;
        }
      });
      setErrors(fieldErrors);
      setLoading(false);
      return;
    }
    setErrors({});
    await onSubmit({ name, slug, description });
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <DialogTitle>{title}</DialogTitle>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6 mt-3">
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
            {errors.name && (
              <span className="flex items-center gap-1 text-red-500 text-xs mt-1">
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                {errors.name}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-slug" className="text-base flex items-center gap-3">
              <Tag className="size-4" />
              Slug
            </Label>
            <Input
              id="project-slug"
              value={slug}
              onChange={e => setSlug(e.target.value)}
              required
              minLength={2}
              maxLength={3}
              placeholder="Enter 2-3 character slug (e.g. 'abc')"
              className="font-sans text-base"
            />
            {errors.slug && (
              <span className="flex items-center gap-1 text-red-500 text-xs mt-1">
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                {errors.slug}
              </span>
            )}
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
            {errors.description && (
              <span className="flex items-center gap-1 text-red-500 text-xs mt-1">
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                {errors.description}
              </span>
            )}
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
