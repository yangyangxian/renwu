import React, { useCallback } from 'react';
import { useNodeViewContext } from '@prosemirror-adapter/react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui-kit/Select';
import { CODE_BLOCK_LANGS } from '@/consts/codeBlockLangs';

export const CodeBlockView: React.FC = () => {
  const { contentRef, node, setAttrs } = useNodeViewContext();
  const currentLang = (node.attrs as any)?.language ?? '';

  // Only update language if changed, to avoid unnecessary re-renders
  const handleLangChange = useCallback((v: string) => {
    const newLang = v === 'auto' ? null : v;
    if (newLang !== (node.attrs as any)?.language) {
      setAttrs({ language: newLang });
    }
  }, [node.attrs, setAttrs]);

  return (
    <div className="relative">
      {/* Language selector pinned top-right, always visible, compact */}
      <div
        className="absolute right-2 top-2 z-10 rounded shadow-sm"
        style={{ minWidth: 0 }}
      >
        <Select
          value={currentLang || 'auto'}
          onValueChange={handleLangChange}
        >
          <SelectTrigger className="text-xs !h-[28px] px-2 cursor-pointer bg-transparent border-none">
            <SelectValue placeholder="auto" />
          </SelectTrigger>
          <SelectContent className="overflow-auto text-xs min-w-0">
            <SelectItem value="auto">auto</SelectItem>
            {CODE_BLOCK_LANGS.map((l) => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Code content */}
      <pre className="m-0">
        <code ref={contentRef as unknown as React.RefObject<HTMLElement>} />
      </pre>
    </div>
  );
};

export default CodeBlockView;
