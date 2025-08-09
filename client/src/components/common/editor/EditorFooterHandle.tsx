import { editorViewCtx } from '@milkdown/kit/core';
import { Selection } from 'prosemirror-state';
import { useInstance } from '@milkdown/react';

  // Inline EditorFooterHandle component
  export const EditorFooterHandle: React.FC = () => {
    const [loading, get] = useInstance();
    const onClick = (e: React.MouseEvent) => {
      e.preventDefault();
      if (loading) return;
      get().action((ctx: any) => {
        const view = ctx.get(editorViewCtx);
        const { state, dispatch } = view;
        const endPos = state.doc.content.size;
        const lastIndex = state.doc.childCount - 1;
        const last = state.doc.child(lastIndex);
        let tr = state.tr;
        const isPara = last && last.type.name === 'paragraph';
        const isEmptyPara = isPara && last.content.size === 0;
        if (!isPara || !isEmptyPara) {
          const para = state.schema.nodes.paragraph.createAndFill();
          if (para)
            tr = tr.insert(endPos, para);
        }
        const newEnd = tr.doc.content.size;
        // @ts-ignore
        tr = tr.setSelection(Selection.near(tr.doc.resolve(newEnd)));
        dispatch(tr.scrollIntoView());
        view.focus();
      });
    };
    return (
      <div
        className="editor-footer-handle h-7 mt-1 cursor-text text-transparent select-none"
        onMouseDown={onClick}
        title="Click to add a new line"
      >
        .
      </div>
    );
  };