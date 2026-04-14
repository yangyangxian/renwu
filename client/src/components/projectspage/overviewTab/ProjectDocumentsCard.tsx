import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui-kit/Card';
import { toast } from 'sonner';
import { ProjectDocumentResDto, ProjectDocumentUpdateReqDto, ProjectResDto } from '@fullstack/common';
import { MarkdownnEditor, MarkdownEditorHandle } from '@/components/common/editor/MarkdownEditor';
import { marked } from 'marked';
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui-kit/Button';
import { UnsavedChangesIndicator } from '@/components/common/UnsavedChangesIndicator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui-kit/Tabs';
import { ConfirmDeleteDialog } from '@/components/common/ConfirmDeleteDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui-kit/Dropdown-menu';
import { cn } from '@/lib/utils';

interface ProjectDocumentsCardProps {
  project: ProjectResDto;
  createProjectDocument: (projectId: string) => Promise<ProjectDocumentResDto>;
  updateProjectDocument: (projectId: string, documentId: string, data: ProjectDocumentUpdateReqDto) => Promise<ProjectDocumentResDto>;
  deleteProjectDocument: (projectId: string, documentId: string) => Promise<void>;
  className?: string;
}

export const ProjectDocumentsCard: React.FC<ProjectDocumentsCardProps> = ({
  project,
  createProjectDocument,
  updateProjectDocument,
  deleteProjectDocument,
  className,
}) => {
  const documents = project.documents ?? [];
  const editorRef = useRef<MarkdownEditorHandle | null>(null);
  const editorShellRef = useRef<HTMLDivElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const [activeDocumentId, setActiveDocumentId] = useState<string>(documents[0]?.id ?? '');
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [renamingDocumentId, setRenamingDocumentId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState('');
  const [docInput, setDocInput] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [pendingDeleteDocument, setPendingDeleteDocument] = useState<ProjectDocumentResDto | null>(null);

  const activeDocument = useMemo(
    () => documents.find((document) => document.id === activeDocumentId) ?? documents[0] ?? null,
    [activeDocumentId, documents]
  );

  useEffect(() => {
    if (!documents.length) {
      setActiveDocumentId('');
      setEditingDocumentId(null);
      setDocInput('');
      setIsDirty(false);
      return;
    }

    if (!activeDocumentId || !documents.some((document) => document.id === activeDocumentId)) {
      setActiveDocumentId(documents[0].id);
    }
  }, [activeDocumentId, documents]);

  useEffect(() => {
    if (!activeDocument) {
      setDocInput('');
      setIsDirty(false);
      return;
    }

    if (!activeDocument.content?.trim()) {
      setIsEditorReady(false);
      setEditingDocumentId(activeDocument.id);
      setRenamingDocumentId(null);
    }

    if (editingDocumentId !== activeDocument.id) {
      setDocInput(activeDocument.content || '');
      setIsDirty(false);
    }
  }, [activeDocument, editingDocumentId]);

  useEffect(() => {
    if (!renamingDocumentId) {
      return;
    }

    window.setTimeout(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }, 0);
  }, [renamingDocumentId]);

  useEffect(() => {
    if (editingDocumentId !== activeDocument?.id || !isEditorReady) {
      return;
    }

    window.setTimeout(() => {
      const proseMirror = editorShellRef.current?.querySelector('.ProseMirror') as HTMLElement | null;
      if (!proseMirror) {
        return;
      }

      proseMirror.focus();

      const selection = window.getSelection();
      if (!selection) {
        return;
      }

      const range = document.createRange();
      range.selectNodeContents(proseMirror);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }, 0);
  }, [activeDocument?.id, editingDocumentId, isEditorReady]);

  const renderedHtml: string = useMemo(() => {
    const out = marked.parse(docInput) as unknown;
    return typeof out === 'string' ? out : '';
  }, [docInput]);

  const handleDocumentClick = () => {
    if (!activeDocument) {
      return;
    }

    setIsEditorReady(false);
    setEditingDocumentId(activeDocument.id);
  };

  const handleStartRename = (document: ProjectDocumentResDto) => {
    setRenamingDocumentId(document.id);
    setTitleDraft(document.title);
  };

  const handleSubmitTitle = async () => {
    if (!project.id || !activeDocument || !renamingDocumentId || isSavingTitle) {
      return;
    }

    const trimmedTitle = titleDraft.trim();
    if (!trimmedTitle) {
      setTitleDraft(activeDocument.title);
      setRenamingDocumentId(null);
      return;
    }

    if (trimmedTitle === activeDocument.title) {
      setRenamingDocumentId(null);
      return;
    }

    setIsSavingTitle(true);
    try {
      await updateProjectDocument(project.id, activeDocument.id, { title: trimmedTitle });
      toast.success('Document renamed');
      setRenamingDocumentId(null);
    } catch {
      toast.error('Failed to rename document');
      setTitleDraft(activeDocument.title);
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleCreateDocument = async () => {
    if (!project.id || isCreatingDocument) {
      return;
    }

    setIsCreatingDocument(true);
    try {
      const createdDocument = await createProjectDocument(project.id);
      setActiveDocumentId(createdDocument.id);
      setEditingDocumentId(createdDocument.id);
      setRenamingDocumentId(null);
      setDocInput(createdDocument.content || '');
      setIsEditorReady(false);
    } catch {
      toast.error('Failed to create document');
    } finally {
      setIsCreatingDocument(false);
    }
  };

  const handleRequestDelete = (document: ProjectDocumentResDto) => {
    setPendingDeleteDocument(document);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteDocument = async () => {
    if (!project.id || !pendingDeleteDocument) {
      return;
    }

    const currentIndex = documents.findIndex((document) => document.id === pendingDeleteDocument.id);
    const fallbackDocument = documents[currentIndex - 1] ?? documents[currentIndex + 1] ?? null;

    try {
      await deleteProjectDocument(project.id, pendingDeleteDocument.id);
      if (fallbackDocument) {
        setActiveDocumentId(fallbackDocument.id);
      }
      setEditingDocumentId(null);
      setRenamingDocumentId(null);
      setIsDeleteDialogOpen(false);
      setPendingDeleteDocument(null);
      toast.success('Document deleted');
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const handleSubmitDocument = async (newValue: string) => {
    if (!project.id || !activeDocument) {
      return;
    }

    try {
      await updateProjectDocument(project.id, activeDocument.id, { content: newValue });
      setDocInput(newValue);
      setEditingDocumentId(null);
      setIsEditorReady(false);
      toast.success('Document updated');
    } catch {
      toast.error('Failed to update document');
      setDocInput(activeDocument.content || '');
    }
  };

  return (
    <Card className={`flex h-full min-w-0 flex-1 overflow-hidden break-all ${className ? ` ${className}` : ''}`}>
      <div className="pt-2">
        <div className="font-bold text-md">Wiki</div>
        <div className="mt-3 flex items-center gap-1.5">
          <Tabs
            value={activeDocument?.id ?? ''}
            onValueChange={(value) => {
              setEditingDocumentId(null);
              setRenamingDocumentId(null);
              setActiveDocumentId(value);
            }}
            className="min-w-0 max-w-full gap-0"
          >
            <div className="min-w-0 max-w-full overflow-x-auto">
              <TabsList variant="line" className="h-10 w-max min-w-0 border-b-0">
                {documents.map((document) => (
                  renamingDocumentId === document.id ? (
                    <div
                      key={document.id}
                      className="flex h-10 max-w-[12rem] flex-none items-center border-b-2 border-foreground px-2"
                    >
                      <input
                        ref={titleInputRef}
                        value={titleDraft}
                        onChange={(event) => setTitleDraft(event.target.value)}
                        onBlur={() => {
                          void handleSubmitTitle();
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            event.currentTarget.blur();
                          }
                          if (event.key === 'Escape') {
                            setTitleDraft(document.title);
                            setRenamingDocumentId(null);
                          }
                        }}
                        className="h-7 w-full rounded-md border border-transparent bg-transparent px-0 py-1 text-sm font-medium leading-tight text-foreground shadow-none outline-none"
                        disabled={isSavingTitle}
                      />
                    </div>
                  ) : document.id === activeDocument?.id ? (
                    <div
                      key={document.id}
                      className={cn(
                        "flex h-10 max-w-[14rem] flex-none items-center gap-1 border-b-2 border-foreground px-2 text-sm font-medium leading-tight text-foreground"
                      )}
                    >
                      <button
                        type="button"
                        className="min-w-0 flex-1 cursor-default truncate text-left"
                        onDoubleClick={() => {
                          handleStartRename(document);
                        }}
                      >
                        {document.title}
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="size-6 shrink-0 rounded-sm"
                            title={`Actions for ${document.title}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-36">
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => handleStartRename(document)}
                          >
                            <Pencil className="h-4 w-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            variant="destructive"
                            disabled={documents.length <= 1}
                            onClick={() => handleRequestDelete(document)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ) : (
                    <TabsTrigger
                      key={document.id}
                      value={document.id}
                      className="max-w-[12rem] flex-none justify-start px-2 text-sm font-medium leading-tight"
                      onDoubleClick={() => {
                        if (activeDocument?.id === document.id) {
                          handleStartRename(document);
                        }
                      }}
                    >
                      <span className="truncate">{document.title}</span>
                    </TabsTrigger>
                  )
                ))}
              </TabsList>
            </div>
          </Tabs>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="-translate-y-0.5 size-7 rounded-md"
            onClick={() => {
              void handleCreateDocument();
            }}
            disabled={isCreatingDocument}
            title="Add document"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col pt-3 pb-4">
        {!activeDocument ? (
          <div className="mx-2 flex h-full items-center justify-center rounded-lg border border-dashed border-border/70 px-4 py-3 text-sm text-muted-foreground">
            Create a document to start writing.
          </div>
        ) : editingDocumentId === activeDocument.id ? (
          <div className="relative flex h-full w-full flex-col">
            <div
              ref={editorShellRef}
              className="mx-2 flex min-h-0 flex-1 overflow-y-auto rounded-xl border border-border bg-background px-3 py-3 pr-1 shadow-xs"
            >
              <div
                className="w-full"
              >
                <MarkdownnEditor
                  ref={editorRef}
                  value={docInput}
                  onSave={(value) => { void handleSubmitDocument(value); }}
                  onCancel={() => {
                    setEditingDocumentId(null);
                    setDocInput(activeDocument.content || '');
                    setIsDirty(false);
                    setIsEditorReady(false);
                  }}
                  showSaveCancel={false}
                  onDirtyChange={setIsDirty}
                  onReadyChange={setIsEditorReady}
                />
              </div>
            </div>

            <div className="mt-4 mr-2 flex items-center justify-end gap-2">
              {isDirty && (
                <div className="mr-3">
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
          <div className="relative flex h-full min-h-0 group">
            <div className="relative mx-2 flex h-full w-[calc(100%-1rem)] overflow-y-auto pr-1">
              <div className="markdown-body w-full rounded-xl border border-transparent bg-background px-3 py-3">
                <div
                  className="w-full"
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-3 right-2 opacity-70 transition-opacity group-hover:opacity-100"
                onClick={handleDocumentClick}
                title="Edit document"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setPendingDeleteDocument(null);
          }
        }}
        title={`Delete "${pendingDeleteDocument?.title ?? 'document'}"?`}
        description="This document will be permanently removed from the project wiki."
        confirmText="Delete"
        onConfirm={() => {
          void handleDeleteDocument();
        }}
      />
    </Card>
  );
};
