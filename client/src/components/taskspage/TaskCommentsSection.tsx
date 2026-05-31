import { useCallback, useEffect, useRef, useState } from 'react';

import { TaskCommentCreateReqDto, TaskCommentResDto, TaskCommentUpdateReqDto } from '@fullstack/common';
import { format } from 'date-fns';
import { MessageSquare, Pencil, Trash2 } from 'lucide-react';
import { marked } from 'marked';
import { toast } from 'sonner';

import { createTaskCommentByTaskId, deleteTaskCommentById, getTaskCommentsByTaskId, updateTaskCommentById } from '@/apiRequests/apiEndpoints';
import { ConfirmDeleteDialog } from '@/components/common/ConfirmDeleteDialog';
import { MarkdownEditorHandle, MarkdownnEditor } from '@/components/common/editor/MarkdownEditor';
import { UnsavedChangesIndicator } from '@/components/common/UnsavedChangesIndicator';
import { Avatar, AvatarFallback } from '@/components/ui-kit/Avatar';
import { Button } from '@/components/ui-kit/Button';
import { Label } from '@/components/ui-kit/Label';
import { Skeleton } from '@/components/ui-kit/Skeleton';
import { useAuth } from '@/providers/AuthProvider';
import { apiClient } from '@/utils/APIClient';

interface TaskCommentsSectionProps {
  taskId: string;
}

const sectionLabelClass = 'mb-0 flex items-center gap-2 font-medium text-muted-foreground dark:text-white';
const composerEditorShellClass = 'rounded-xl border border-border/70 bg-background/80 px-3 py-3 dark:bg-background/15';
const commentCardClass = 'rounded-xl border border-border/70 bg-background/90 shadow-none dark:bg-muted/30';
const commentReadSurfaceClass = 'markdown-body w-full';
const commentEditSurfaceClass = 'markdown-body w-full';
const commentContentClass = 'task-comment-content w-full';

function getAuthorInitial(name?: string): string {
  return (name || '?').charAt(0).toUpperCase();
}

function renderMarkdown(content: string): string {
  const result = marked.parse(content) as unknown;
  return typeof result === 'string' ? result : '';
}

function buildTimestamp(comment: TaskCommentResDto): string {
  return comment.createdAt ? format(new Date(comment.createdAt), 'yyyy-MM-dd HH:mm') : '--';
}

function isCommentEdited(comment: TaskCommentResDto): boolean {
  return Boolean(comment.updatedAt && comment.updatedAt !== comment.createdAt);
}

function TaskCommentsSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      {Array.from({ length: 2 }).map((_, index) => {
        const showThreadLine = index < 1;

        return (
          <div key={`comment-skeleton-${index}`} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
            <div className="relative flex justify-center">
              <Skeleton className="relative z-10 mt-2 size-9 rounded-full" />
              {showThreadLine && <div className="absolute top-10 -bottom-4 left-1/2 w-px -translate-x-1/2 bg-border/70" />}
            </div>

            <div className={`${commentCardClass} overflow-hidden`}>
              <div className="flex items-center gap-2 border-b border-border/60 bg-muted/30 px-3 py-2.5 dark:bg-muted/45">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3.5 w-28" />
              </div>

              <div className="space-y-2 px-4 py-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[92%]" />
                <Skeleton className="h-4 w-[68%]" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function hasMeaningfulCommentContent(content: string): boolean {
  return content.trim().length > 0;
}

export function shouldEnableCommentComposerSubmit({ dirty, content }: { dirty: boolean; content: string }): boolean {
  return dirty && hasMeaningfulCommentContent(content);
}

export default function TaskCommentsSection({ taskId }: TaskCommentsSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<TaskCommentResDto[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [showLoadingSkeleton, setShowLoadingSkeleton] = useState(false);
  const [composerDirty, setComposerDirty] = useState(false);
  const [composerContent, setComposerContent] = useState('');
  const [composerResetKey, setComposerResetKey] = useState(0);
  const composerEditorRef = useRef<MarkdownEditorHandle | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentDirty, setEditingCommentDirty] = useState(false);
  const editingEditorRef = useRef<MarkdownEditorHandle | null>(null);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const data = await apiClient.get<TaskCommentResDto[]>(getTaskCommentsByTaskId(taskId));
      setComments(data);
    } catch (error) {
      console.error('Failed to fetch task comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  }, [taskId]);

  useEffect(() => {
    void fetchComments();
    setEditingCommentId(null);
    setEditingCommentDirty(false);
    setComposerDirty(false);
    setComposerContent('');
    setComposerResetKey((current) => current + 1);
  }, [fetchComments]);

  useEffect(() => {
    if (!loadingComments || comments.length > 0) {
      setShowLoadingSkeleton(false);
      return;
    }

    const timerId = window.setTimeout(() => {
      setShowLoadingSkeleton(true);
    }, 200);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [comments.length, loadingComments]);

  const handleCreateComment = useCallback(async (content: string) => {
    const normalizedContent = content.trim();
    if (!hasMeaningfulCommentContent(normalizedContent)) {
      setComposerDirty(false);
      setComposerContent('');
      setComposerResetKey((current) => current + 1);
      return;
    }

    const payload: TaskCommentCreateReqDto = { content: normalizedContent };
    try {
      const created = await apiClient.post<TaskCommentCreateReqDto, TaskCommentResDto>(createTaskCommentByTaskId(taskId), payload);
      setComments((current) => [...current, created]);
      setComposerDirty(false);
      setComposerContent('');
      setComposerResetKey((current) => current + 1);
      toast.success('Comment added');
    } catch (error) {
      console.error('Failed to create comment:', error);
      toast.error('Failed to add comment');
      throw error;
    }
  }, [taskId]);

  const canSubmitComposerComment = shouldEnableCommentComposerSubmit({ dirty: composerDirty, content: composerContent });

  const handleUpdateComment = useCallback(async (commentId: string, content: string) => {
    const payload: TaskCommentUpdateReqDto = { content };
    try {
      const updated = await apiClient.put<TaskCommentUpdateReqDto, TaskCommentResDto>(updateTaskCommentById(commentId), payload);
      setComments((current) => current.map((comment) => (comment.id === commentId ? updated : comment)));
      setEditingCommentId(null);
      setEditingCommentDirty(false);
      toast.success('Comment updated');
    } catch (error) {
      console.error('Failed to update comment:', error);
      toast.error('Failed to update comment');
      throw error;
    }
  }, []);

  const handleDeleteComment = useCallback(async () => {
    if (!deleteCommentId) return;

    try {
      await apiClient.delete(deleteTaskCommentById(deleteCommentId));
      setComments((current) => current.filter((comment) => comment.id !== deleteCommentId));
      if (editingCommentId === deleteCommentId) {
        setEditingCommentId(null);
        setEditingCommentDirty(false);
      }
      setDeleteCommentId(null);
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('Failed to delete comment');
    }
  }, [deleteCommentId, editingCommentId]);

  return (
    <div className="flex min-h-12 flex-col gap-4 pb-6">
      <style>{`
        .task-comment-content :where(ul, ol) {
          padding-left: 1.5em;
          margin-top: 0;
          margin-bottom: 1rem;
        }

        .task-comment-content :where(ul ul, ul ol, ol ol, ol ul) {
          margin-top: 0;
          margin-bottom: 0;
        }

        .task-comment-content li > p {
          margin-top: 0;
          margin-bottom: 0;
        }

        .task-comment-content li + li {
          margin-top: .25em;
        }
      `}</style>

      <div className="flex items-center justify-between gap-3">
        <Label className={sectionLabelClass}>
          <MessageSquare className="size-4 text-muted-foreground dark:text-slate-200" />
          Comments{comments.length ? ` (${comments.length})` : ''}:
        </Label>
      </div>

      {showLoadingSkeleton && loadingComments && comments.length === 0 ? (
        <TaskCommentsSkeleton />
      ) : comments.length > 0 && (
        <div className="flex flex-col gap-4">
          {comments.map((comment, index) => {
            const isOwner = comment.createdBy?.id === user?.id;
            const isEditing = editingCommentId === comment.id;
            const showThreadLine = index < comments.length - 1;

            return (
              <div key={comment.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                <div className="relative flex justify-center">
                  <Avatar className="relative z-10 mt-2 size-9 ring-1 ring-border/70">
                    <AvatarFallback className="bg-muted text-sm font-medium text-primary">
                      {getAuthorInitial(comment.createdBy?.name)}
                    </AvatarFallback>
                  </Avatar>
                  {showThreadLine && <div className="absolute top-10 -bottom-4 left-1/2 w-px -translate-x-1/2 bg-border/70" />}
                </div>

                <div className={`${commentCardClass} group overflow-hidden`}>
                  <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-muted/30 px-3 py-2.5 dark:bg-muted/45">
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2 text-sm">
                        <span className="truncate text-foreground">
                          {comment.createdBy?.name || 'Unknown'}
                        </span>
                        <span className="text-xs text-muted-foreground">{buildTimestamp(comment)}</span>
                        {isCommentEdited(comment) && (
                          <span className="text-xs text-muted-foreground">(edited)</span>
                        )}
                      </div>
                    </div>

                    {isOwner && !isEditing && (
                      <div className="flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="size-8 text-muted-foreground hover:text-foreground"
                          onClick={() => setEditingCommentId(comment.id)}
                          title="Edit comment"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteCommentId(comment.id)}
                          title="Delete comment"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="px-4 py-3">
                    {isEditing ? (
                      <div className={commentContentClass}>
                        <div className={commentEditSurfaceClass}>
                          <MarkdownnEditor
                            key={comment.id}
                            ref={editingEditorRef}
                            value={comment.content}
                            showSaveCancel
                            onSave={(content) => handleUpdateComment(comment.id, content)}
                            onCancel={() => {
                              setEditingCommentId(null);
                              setEditingCommentDirty(false);
                            }}
                            onDirtyChange={setEditingCommentDirty}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className={`${commentReadSurfaceClass} ${commentContentClass}`} dangerouslySetInnerHTML={{ __html: renderMarkdown(comment.content) }} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
        <Avatar className="mt-0.5 size-9 ring-1 ring-border/70">
          <AvatarFallback className="bg-muted text-sm font-medium text-primary">
            {getAuthorInitial(user?.name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <div className={`${composerEditorShellClass} mb-3`}>
            <div className={commentContentClass}>
              <MarkdownnEditor
                key={composerResetKey}
                ref={composerEditorRef}
                value=""
                showSaveCancel={false}
                onSave={handleCreateComment}
                onCancel={() => {
                  setComposerDirty(false);
                  setComposerContent('');
                  setComposerResetKey((current) => current + 1);
                }}
                onDirtyChange={setComposerDirty}
                onValueChange={setComposerContent}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            {canSubmitComposerComment && <UnsavedChangesIndicator />}
            <Button type="button" size="sm" variant="default" disabled={!canSubmitComposerComment} onClick={() => composerEditorRef.current?.save()}>
              Comment
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDeleteDialog
        open={Boolean(deleteCommentId)}
        onOpenChange={(open) => {
          if (!open) setDeleteCommentId(null);
        }}
        title="Delete Comment?"
        description="Are you sure you want to delete this comment? This action cannot be undone."
        onConfirm={() => {
          void handleDeleteComment();
        }}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}