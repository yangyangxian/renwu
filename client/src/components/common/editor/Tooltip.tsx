import { Ctx } from "@milkdown/kit/ctx"
import { tooltipFactory, TooltipProvider } from "@milkdown/kit/plugin/tooltip"
import { toggleStrongCommand, toggleEmphasisCommand, toggleInlineCodeCommand, createCodeBlockCommand, wrapInBlockquoteCommand, wrapInHeadingCommand, wrapInBulletListCommand } from "@milkdown/kit/preset/commonmark"
import { useInstance } from '@milkdown/react'
import { usePluginViewContext } from "@prosemirror-adapter/react"
import { useCallback, useEffect, useRef } from "react"
import { callCommand } from "@milkdown/kit/utils"
import { Button } from "@/components/ui-kit/Button"
import { setBlockType, lift } from 'prosemirror-commands'
import { Code2, Quote, Code, Bold, Italic, List } from 'lucide-react';

export const tooltip = tooltipFactory('Text');

export const TooltipView = ({ refEl, onKeyDown, onMouseDown }: {
  refEl?: React.RefObject<HTMLDivElement>,
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>,
  onMouseDown?: React.MouseEventHandler<HTMLDivElement>
}) => {
    const ref = refEl ?? useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const tooltipProvider = useRef<TooltipProvider | null>(null)
    const updateTimerRef = useRef<number | null>(null)
    const DEBOUNCE_MS = 150

    const { view, prevState } = usePluginViewContext()
    const [loading, get] = useInstance()
    const action = useCallback((fn: (ctx: Ctx) => void) => {
        if (loading) return;
        get().action(fn)
    }, [loading])

    useEffect(() => {
        const div = ref.current
        if (loading || !div) {
            return;
        }
        tooltipProvider.current = new TooltipProvider({
            content: div,
        })

        return () => {
            tooltipProvider.current?.destroy()
        }
    }, [loading])

    // Debounced tooltip update for smoother selection changes
    useEffect(() => {
        if (!tooltipProvider.current) return
        if (updateTimerRef.current) {
            clearTimeout(updateTimerRef.current)
            updateTimerRef.current = null
        }
        updateTimerRef.current = window.setTimeout(() => {
            tooltipProvider.current?.update(view, prevState)
            // Mirror data-show to inner content for animations
            const show = ref.current?.getAttribute('data-show') ?? 'false'
            if (contentRef.current) contentRef.current.setAttribute('data-show', show)
            // Hide if editor is not focused
            if (!view.hasFocus()) {
                ref.current?.setAttribute('data-show', 'false')
                contentRef.current?.setAttribute('data-show', 'false')
            }
        }, DEBOUNCE_MS) as unknown as number

        return () => {
            if (updateTimerRef.current) {
                clearTimeout(updateTimerRef.current)
                updateTimerRef.current = null
            }
        }
    })

    // Hide on outside click or editor blur
    useEffect(() => {
        const tooltipEl = ref.current
        const editorEl = (view?.dom as HTMLElement) || null
        if (!tooltipEl || !editorEl) return

        const hide = () => {
            tooltipEl.setAttribute('data-show', 'false')
            contentRef.current?.setAttribute('data-show', 'false')
        }

        const onDocMouseDown = (e: MouseEvent) => {
            const target = e.target as Node
            if (tooltipEl.contains(target) || editorEl.contains(target)) return
            hide()
        }

        const onBlur = () => hide()

        document.addEventListener('mousedown', onDocMouseDown)
        editorEl.addEventListener('blur', onBlur, true)

        return () => {
            document.removeEventListener('mousedown', onDocMouseDown)
            editorEl.removeEventListener('blur', onBlur, true)
        }
    }, [view])

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        if (onMouseDown) onMouseDown(e as any)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    }

    // Helpers to detect active state and depth
    const findInNode = (...typeNames: string[]) => {
        const $from = view.state.selection.$from
        for (let d = $from.depth; d >= 0; d--) {
            const node = $from.node(d)
            if (node && typeNames.includes(node.type.name)) return { node, depth: d }
        }
        return null
    }

    const isMarkActive = (...markNames: string[]) => {
        const { state } = view
        const { from, to, empty } = state.selection
        for (const name of markNames) {
            const type = (state.schema.marks as any)[name]
            if (!type) continue
            if (empty) {
                const stored = state.storedMarks || state.selection.$from.marks()
                if (stored.some(m => m.type === type)) return true
            } else {
                if (state.doc.rangeHasMark(from, to, type)) return true
            }
        }
        return false
    }

    const inCodeBlockInfo = findInNode('code_block')
    const inBlockquoteInfo = findInNode('blockquote')
    const headingInfo = findInNode('heading') as any | null
    const headingLevel = headingInfo?.node?.attrs?.level as number | undefined

    const inlineCodeActive = isMarkActive('code_inline', 'code', 'inlineCode')
    const italicActive = isMarkActive('emphasis', 'em')
    const boldActive = isMarkActive('strong', 'bold')

    const toParagraph = () => {
        const { state, dispatch } = view
        const paragraph = state.schema.nodes.paragraph
        if (!paragraph) return
        setBlockType(paragraph)(state, dispatch)
    }

    const toggleCodeBlock = () => {
        if (inCodeBlockInfo) {
            toParagraph()
        } else {
            action(callCommand(createCodeBlockCommand.key))
        }
    }

    const toggleBlockquote = () => {
        const { state, dispatch } = view
        if (inBlockquoteInfo) {
            lift(state, dispatch)
        } else {
            action(callCommand(wrapInBlockquoteCommand.key))
        }
    }

    const toggleHeading = (level: number) => {
        if (headingLevel === level) {
            toParagraph()
        } else {
            action(callCommand(wrapInHeadingCommand.key, level))
        }
    }

    const activeCls = 'bg-muted text-foreground'
    // Centralized Tailwind CSS class for compact tooltip buttons
    const tooltipButtonClass = 'px-1 py-0.5 min-w-0 h-7 w-7 flex items-center justify-center text-xs';

    return (
        <div
            ref={refEl ?? ref}
            className="absolute data-[show=false]:hidden z-50 -translate-y-3"
        >
            <div
                ref={contentRef}
                className="bg-popover text-popover-foreground rounded-md shadow-md p-1 border-1 border-border
                 w-auto outline-hidden data-[show=true]:animate-in data-[show=true]:fade-in-0 
                 data-[show=true]:zoom-in-95 transition-[opacity,transform] duration-300 ease-out origin-center"
            >
                <div className="flex items-center gap-1">
                    {/* Bold */}
                    <div className="group relative">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={`${tooltipButtonClass} ${boldActive ? activeCls : ''}`}
                            onMouseDown={e => { handleMouseDown(e); setTimeout(() => action(callCommand(toggleStrongCommand.key)), 0); }}
                            onKeyDown={handleKeyDown}
                        >
                            <Bold className="size-3.5" />
                        </Button>
                        <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute left-1/2 -translate-x-1/2 top-full mt-1 px-1.5 py-0.5 rounded bg-black text-xs text-white whitespace-nowrap z-50">
                            Bold (** **)
                        </span>
                    </div>

                    {/* Italic */}
                    <div className="group relative">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={`${tooltipButtonClass} ${italicActive ? activeCls : ''}`}
                            onMouseDown={e => { handleMouseDown(e); setTimeout(() => action(callCommand(toggleEmphasisCommand.key)), 0); }}
                            onKeyDown={handleKeyDown}
                        >
                            <Italic className="size-3.5" />
                        </Button>
                        <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute left-1/2 -translate-x-1/2 top-full mt-1 px-1.5 py-0.5 rounded bg-black text-xs text-white whitespace-nowrap z-50">
                            Italic (* *)
                        </span>
                    </div>

                    {/* Blockquote */}
                    <div className="group relative">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={`${tooltipButtonClass} ${inBlockquoteInfo ? activeCls : ''}`}
                            onMouseDown={e => { handleMouseDown(e); setTimeout(() => toggleBlockquote(), 0); }}
                            onKeyDown={handleKeyDown}
                        >
                            <Quote className="size-3.5" />
                        </Button>
                        <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute left-1/2 -translate-x-1/2 top-full mt-1 px-1.5 py-0.5 rounded bg-black text-xs text-white whitespace-nowrap z-50">
                            Blockquote (&gt;)
                        </span>
                    </div>

                    {/* Unordered list */}
                    <div className="group relative">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={tooltipButtonClass}
                            onMouseDown={e => { handleMouseDown(e); setTimeout(() => action(callCommand(wrapInBulletListCommand.key)), 0); }}
                            onKeyDown={handleKeyDown}
                        >
                            <List className="size-3.5" />
                        </Button>
                        <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute left-1/2 -translate-x-1/2 top-full mt-1 px-1.5 py-0.5 rounded bg-black text-xs text-white whitespace-nowrap z-50">
                            Unordered list (-)
                        </span>
                    </div>

                    {/* Inline code */}
                    <div className="group relative">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={`${tooltipButtonClass} ${inlineCodeActive ? activeCls : ''}`}
                            onMouseDown={e => { handleMouseDown(e); setTimeout(() => action(callCommand(toggleInlineCodeCommand.key)), 0); }}
                            onKeyDown={handleKeyDown}
                        >
                            <Code className="size-3.5" />
                        </Button>
                        <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute left-1/2 -translate-x-1/2 top-full mt-1 px-1.5 py-0.5 rounded bg-black text-xs text-white whitespace-nowrap z-50">
                            Inline code (`)
                        </span>
                    </div>

                    {/* Code block */}
                    <div className="group relative">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={`${tooltipButtonClass} ${inCodeBlockInfo ? activeCls : ''}`}
                            onMouseDown={e => { handleMouseDown(e); setTimeout(() => toggleCodeBlock(), 0); }}
                            onKeyDown={handleKeyDown}
                        >
                            <Code2 className="size-3.5" />
                        </Button>
                        <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute left-1/2 -translate-x-1/2 top-full mt-1 px-1.5 py-0.5 rounded bg-black text-xs text-white whitespace-nowrap z-50">
                            Code block (```) 
                        </span>
                    </div>

                    {/* Headings */}
                    {[1, 2, 3, 4].map((level) => (
                        <div className="group relative" key={level}>
                                <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className={`${tooltipButtonClass} ${headingLevel === level ? activeCls : ''}`}
                                onMouseDown={e => { handleMouseDown(e); setTimeout(() => toggleHeading(level), 0); }}
                                onKeyDown={handleKeyDown}
                            >
                                {"H"}{level}
                            </Button>
                            <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute left-1/2 -translate-x-1/2 top-full mt-1 px-1.5 py-0.5 rounded bg-black text-xs text-white whitespace-nowrap z-50">
                                {`Heading ${level} (${"#".repeat(level)})`}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
