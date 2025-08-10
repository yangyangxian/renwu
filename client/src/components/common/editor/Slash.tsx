import { editorViewCtx } from "@milkdown/kit/core"
import { Ctx } from "@milkdown/kit/ctx"
import { slashFactory, SlashProvider } from "@milkdown/kit/plugin/slash"
import { useInstance } from '@milkdown/react'
import { usePluginViewContext } from "@prosemirror-adapter/react"
import React, { useCallback, useEffect, useRef } from "react"
import { TooltipView } from "./Tooltip"

export const slash = slashFactory('Commands');

export const SlashView = () => {
    const ref = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>
    const slashProvider = useRef<SlashProvider | null>(null)

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
        slashProvider.current = new SlashProvider({
            content: div,
        })

        return () => {
            slashProvider.current?.destroy()
        }
    }, [loading])

    useEffect(() => {
        slashProvider.current?.update(view, prevState)
    })

    const command = (e: React.KeyboardEvent | React.MouseEvent) => {
        action((ctx) => {
            const view = ctx.get(editorViewCtx);
            const { dispatch, state } = view;
            const { tr, selection } = state;
            const { from } = selection;
            dispatch(tr.deleteRange(from - 1, from));
            view.focus();
        });
        if (ref.current) {
            ref.current.setAttribute('data-show', 'false');
        }
    }

    return (     
        <TooltipView refEl={ref}  onMouseDown={command} />
    )
}
