import { defaultValueCtx, Editor, rootCtx, editorViewOptionsCtx } from '@milkdown/kit/core';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { useEffect, useRef, useState, useCallback, useImperativeHandle } from 'react';
import { commonmark } from '@milkdown/kit/preset/commonmark';
import { Milkdown, useEditor } from '@milkdown/react';
import { usePluginViewFactory, useNodeViewFactory } from '@prosemirror-adapter/react';
import { tooltip, TooltipView } from './Tooltip';
import { CodeBlockView } from './CodeBlockView';
import { EditorFooterHandle } from './EditorFooterHandle';
import { UnsavedChangesIndicator } from '../UnsavedChangesIndicator';
import { Button } from '@/components/ui-kit/Button';
import logger from '@/utils/logger';
import { slash, SlashView } from './Slash';
import { history, historyKeymap } from '@milkdown/plugin-history'
import { getMarkdown, callCommand } from '@milkdown/kit/utils';
import { insertImageCommand } from '@milkdown/kit/preset/commonmark';
import { apiFile } from '@/apiRequests/apiEndpoints';
import { toast } from 'sonner';
import {
  dataUrlToBlob,
  isTooLargeBytes,
  replaceDataUrlsWithUploads,
  rewriteLegacyUploads,
  stripImageTitles,
  computeRemovedFilenames,
} from '@/utils/imageUtils';
import { editorViewCtx } from '@milkdown/core';

export interface MarkdownnEditorProps {
  value: string;
  showSaveCancel?: boolean;
  onSave?: (markdown: string) => void;
  onCancel?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  ref: React.Ref<MarkdownEditorHandle> | null;
}

export interface MarkdownEditorHandle {
  save: () => void;
  cancel: () => void;
}

export function MarkdownnEditor(props: MarkdownnEditorProps) {
  const { value, ref, showSaveCancel, onSave, onCancel, onDirtyChange } = props;
  const pluginViewFactory = usePluginViewFactory();
  const nodeViewFactory = useNodeViewFactory();
  const [dirty, setDirty] = useState(false);
  const originalValue = useRef<string | null>(null);
  const editorRef = useRef<Editor | null>(null);

  useEditor((root: HTMLElement) => {
    const editor = Editor
      .make()
      .config(ctx => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, value);
        ctx.set(tooltip.key, {
          view: pluginViewFactory({
            component: TooltipView,
          })
        });
        ctx.set(editorViewOptionsCtx, {
          nodeViews: {
            code_block: nodeViewFactory({ component: CodeBlockView }),
          },
        });
        ctx.set(historyKeymap.key, {
          Undo: { shortcuts: 'Mod-z' },
          Redo: { shortcuts: 'Mod-y' },
        });
        // Add Milkdown listener plugin for real-time value tracking
        ctx.get(listenerCtx).markdownUpdated((_, md: string, preMd: string) => {
          if (originalValue.current === null) {
            originalValue.current = preMd;
          }
          const nowDirty = md !== originalValue.current;
          setDirty(nowDirty);
          onDirtyChange?.(nowDirty);
          logger.debug("Markdown updated:", md);
        });
        ctx.set(slash.key, {
          view: pluginViewFactory({
            component: SlashView,
          })
        });
      })
      .use(commonmark)
      .use(tooltip)
      .use(listener)
      .use(slash)
      .use(history)

    editorRef.current = editor;
    return editor;
  }, [value, pluginViewFactory, nodeViewFactory])

  // Attach paste event after editor is mounted
  useEffect(() => {
    const root = editorRef.current?.ctx.get(rootCtx);
    if (!root || !(root instanceof HTMLElement)) return;
    
    const handlePaste = (event: ClipboardEvent) => {
      if (!event.clipboardData) return;
      const item = Array.from(event.clipboardData.items).find(i => i.type.startsWith('image/'));
      if (!item) return;
      event.preventDefault();
      const file = item.getAsFile();
      if (!file) return;

      if (typeof file.size === 'number' && isTooLargeBytes(file.size)) {
        toast.warning('Image exceeds 5MB limit. Please use a smaller image.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        try {
          const blob = dataUrlToBlob(dataUrl);
          if (isTooLargeBytes(blob.size)) {
            toast.warning('Image exceeds 5MB limit. Please use a smaller image.');
            return;
          }
        } catch {}
        if (editorRef.current) {
          const fileName = file.name || 'image.png';
          editorRef.current.action(callCommand(insertImageCommand.key, { src: dataUrl, alt: fileName }));
          // Insert a new line after the image
          editorRef.current.action(ctx => {
            const view = ctx.get(editorViewCtx);
            if (view) {
              view.dispatch(view.state.tr.insertText('\n'));
            }
          });
        }
      };
      reader.readAsDataURL(file);
    };
  // Listen in capture phase and stop propagation after handling to avoid Milkdown
  // also processing the same paste event which would insert the image twice.
  root.addEventListener('paste', handlePaste, true);
  return () => root.removeEventListener('paste', handlePaste, true);
  }, [editorRef.current?.ctx]);

  // Helper: upload image data URL
  const uploadImage = async (dataUrl: string): Promise<string> => {
    const blob = dataUrlToBlob(dataUrl);
    if (isTooLargeBytes(blob.size)) {
      toast.warning('Image exceeds 5MB limit. Please use a smaller image.');
      throw new Error('Image too large');
    }
    const formData = new FormData();
    formData.append('file', blob, 'image.png');
    const res = await fetch(apiFile(), { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Image upload failed');
    const json = await res.json();
    const url = json?.data?.url ?? json?.url;
    if (!url) throw new Error('Invalid upload response');
    return url;
  };

  const handleSave = useCallback(async () => {
    let currentMarkdown = value;
    if (editorRef.current) {
      try {
        const md = editorRef.current.action(getMarkdown());
        if (md && typeof md === 'string') {
          let updated = await replaceDataUrlsWithUploads(md, uploadImage);
          updated = rewriteLegacyUploads(updated);
          updated = stripImageTitles(updated);

          // Cleanup removed files
          try {
            const toDelete = computeRemovedFilenames(value, updated);
            if (toDelete.length) {
              await Promise.all(toDelete.map((name) => fetch(`${apiFile()}/${name}`, { method: 'DELETE' }).catch(() => {})));
            }
          } catch {}

          currentMarkdown = updated;
        }
      } catch (e) {
        logger.error('Failed to get raw markdown from Milkdown:', e);
      }
    }
    logger.debug('Saving markdown content:', currentMarkdown);
    if (onSave) {
      // Ensure we await the consumer's onSave so callers relying on the promise
      // returned by the imperative save() observe the real completion.
      await Promise.resolve(onSave(currentMarkdown));
    }
    setDirty(false);
    onDirtyChange?.(false);
  }, [value, onSave, onDirtyChange]);

  const handleCancel = useCallback(() => {
    setDirty(false);
    onDirtyChange?.(false);
    onCancel?.();
  }, [onCancel, onDirtyChange]);

  useImperativeHandle(ref, () => ({
    save: handleSave,
    cancel: handleCancel,
    // no extra helpers exposed; external callers should use save/cancel
  } as MarkdownEditorHandle), [handleSave, handleCancel]);

  return (
    <div className="editor-scope w-full">
      <style>{`
        .markdown-body .editor {
          outline: none !important;
        }
      `}</style>
      
      <div className="markdown-body break-all w-full">
        <Milkdown />
      </div>
      <EditorFooterHandle />

      {showSaveCancel && (
        <div className="flex justify-end items-center gap-2 mb-2">
          {dirty && (
            <div className='mr-3'>
              <UnsavedChangesIndicator />
            </div>
          )}
          <Button size="sm" disabled={!dirty} variant="default" onClick={handleSave}>
            Save
          </Button>
          <Button size="sm" variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
