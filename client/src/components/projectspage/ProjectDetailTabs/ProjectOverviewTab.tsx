import { Card } from '@/components/ui-kit/Card';
import { Textarea } from '@/components/ui-kit/Textarea';
import { Label } from '@/components/ui-kit/Label';
import { Info } from 'lucide-react';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui-kit/Hover-card';
import { marked } from 'marked';
import React from 'react';

interface ProjectOverviewTabProps {
  project: any;
  editingDesc: boolean;
  descInput: string;
  descInputRef: React.RefObject<HTMLTextAreaElement | null>;
  handleDescClick: () => void;
  handleDescBlur: () => void;
  setEditingDesc: (v: boolean) => void;
  setDescInput: (v: string) => void;
}

export function ProjectOverviewTab({
  project,
  editingDesc,
  descInput,
  descInputRef,
  handleDescClick,
  handleDescBlur,
  setEditingDesc,
  setDescInput,
}: ProjectOverviewTabProps) {
  const html = marked.parse(project?.description?.toString() || '');
  return (
    <Card className="flex flex-col h-full w-full p-3 overflow-y-auto shadow-none">
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-md font-semibold">Project Description:</h2>
          <HoverCard openDelay={0}>
            <HoverCardTrigger asChild>
              <Info className="w-4 h-4" />
            </HoverCardTrigger>
            <HoverCardContent className="w-80 text-xs leading-relaxed">
              <div className="font-semibold text-sm mb-2">Markdown Syntax</div>
              <ul className="list-disc pl-5">
                <li><b>Bold:</b> <code>**bold**</code> or <code>__bold__</code></li>
                <li><b>Italic:</b> <code>*italic*</code> or <code>_italic_</code></li>
                <li><b>Link:</b> <code>[title](url)</code></li>
                <li><b>List:</b> <code>* item</code></li>
                <li><b>Number List:</b> <code> 1. item</code></li>
                <li><b>Heading:</b> <code># H1</code>, <code>## H2</code>, ...</li>
                <li><b>Code:</b> <code>`inline code`</code> or <code>```block```</code></li>
              </ul>
            </HoverCardContent>
          </HoverCard>
        </div>
        {editingDesc ? (
          <Textarea
            ref={descInputRef}
            value={descInput}
            onChange={e => setDescInput(e.target.value)}
            onBlur={handleDescBlur}
            onCancel={() => {
              setEditingDesc(false);
            }}
            placeholder="Enter a project description…(Markdown supported!)"
            className="bg-secondary !text-[0.95rem] min-h-[15rem] leading-relaxed px-4 mt-3"
            autoSize={true}
            maxLength={10000}
          />
        ) : (
          <>
            {project?.description ? (
              <div
                className="markdown-body !text-[0.95rem] !bg-card p-3 h-full cursor-pointer"
                onClick={handleDescClick}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <div
                className="markdown-body !text-[0.95rem] !bg-card p-3 cursor-pointer text-muted-foreground italic"
                onClick={handleDescClick}
              >
                Enter a project description… (Markdown supported!)
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
