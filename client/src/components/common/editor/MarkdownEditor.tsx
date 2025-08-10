import { defaultValueCtx, Editor, rootCtx, editorViewOptionsCtx } from '@milkdown/kit/core';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { useEffect, useRef, useState } from 'react';
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

export interface MarkdownnEditorProps {
  value: string;
  onChange?: (markdown: string) => void;
  showSaveCancel?: boolean;
  onSave?: (markdown: string) => void;
  onCancel?: () => void;
}

export function MarkdownnEditor(props: MarkdownnEditorProps) {
  const { value, onChange, showSaveCancel, onSave, onCancel } = props;
  const pluginViewFactory = usePluginViewFactory();
  const nodeViewFactory = useNodeViewFactory();
  const [editorValue, setEditorValue] = useState(""); 
  const [dirty, setDirty] = useState(false);
  const originalValue = useRef<string | null>(null);

  useEditor((root: HTMLElement) => {
    return Editor
      .make()
      .config(ctx => {
        ctx.set(rootCtx, root)
        ctx.set(defaultValueCtx, value)
        ctx.set(tooltip.key, {
          view: pluginViewFactory({
            component: TooltipView,
          })
        })
        ctx.set(editorViewOptionsCtx, {
          nodeViews: {
            code_block: nodeViewFactory({ component: CodeBlockView }),
          },
        });
        ctx.set(historyKeymap.key, {
          // Remap to one shortcut.
          Undo: { shortcuts: 'Mod-z' },
          // Remap to multiple shortcuts.
          Redo: { shortcuts: 'Mod-y' },
        })
        // Add Milkdown listener plugin for real-time value tracking
        ctx.get(listenerCtx).markdownUpdated((_, md: string, preMd: string) => {
          if (originalValue.current === null) {
            logger.debug("originalValue:", preMd);
            originalValue.current = preMd;
          }
          setEditorValue(md);
        });
        ctx.set(slash.key, {
          view: pluginViewFactory({
            component: SlashView,
          })
        })
      })
      .use(commonmark)
      .use(tooltip)
      .use(listener)
      .use(slash)
      .use(history)
  }, [value, pluginViewFactory, nodeViewFactory])

  // Handler for save button
  const handleSave = () => {
    let currentMarkdown = editorValue;
    // Fallback to the value prop if still empty
    if (!currentMarkdown || currentMarkdown.trim() === '') {
      currentMarkdown = value;
    }
    logger.debug("Saving markdown content:", currentMarkdown);
    onSave?.(currentMarkdown);
    setDirty(false);
  };

  const handleCancel = () => {
    setEditorValue(originalValue.current || value);
    setDirty(false);
    onCancel?.();
  };

  useEffect(() => {
    if (originalValue.current !== null && editorValue !== originalValue.current) {
      setDirty(true);
    } else {
      setDirty(false);
    }
  }, [editorValue]);

  return (
    <div className="editor-scope">
      <style>{`
        .markdown-body .editor {
          outline: none !important;
        }
      `}</style>
      
      <div className="markdown-body break-all">
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
