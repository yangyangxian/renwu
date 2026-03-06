import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface GradientScrollAreaProps {
  children: ReactNode;
  className?: string;
  scrollAreaClassName?: string;
  topOverlayHeight?: number;
  bottomOverlayHeight?: number;
  disableTop?: boolean;
  disableBottom?: boolean;
  mildBlur?: number;
  strongBlur?: number;
  onScroll?: (el: HTMLDivElement) => void;
}

export interface GradientScrollAreaHandle {
  scrollElement: HTMLDivElement | null;
  scrollToTop: () => void;
  scrollToBottom: () => void;
}

// Reusable scroll container with gradient + blur overlays at top & bottom
const GradientScrollArea = forwardRef<GradientScrollAreaHandle, GradientScrollAreaProps>(function GradientScrollArea(
  {
    children,
    className,
    scrollAreaClassName,
    topOverlayHeight = 40,
    bottomOverlayHeight = 60,
    disableTop = false,
    disableBottom = false,
    mildBlur = 1,
    strongBlur = 1,
    onScroll,
  },
  ref
) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(true);

  const recompute = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const noOverflow = scrollHeight <= clientHeight + 1;
    if (noOverflow) {
      setAtTop(true);
      setAtBottom(true);
    } else {
      setAtTop(scrollTop <= 0);
      setAtBottom(scrollTop + clientHeight >= scrollHeight - 1);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let ticking = false;
    const handle = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          recompute();
          if (el && onScroll) onScroll(el);
          ticking = false;
        });
        ticking = true;
      }
    };
    recompute();
    el.addEventListener('scroll', handle, { passive: true });
    window.addEventListener('resize', recompute);
    return () => {
      el.removeEventListener('scroll', handle);
      window.removeEventListener('resize', recompute);
    };
  }, [children, onScroll]);

  useImperativeHandle(ref, () => ({
    scrollElement: scrollRef.current,
    scrollToTop: () => {
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    },
    scrollToBottom: () => {
      const el = scrollRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }), []);

  const mildMaskTop = 'linear-gradient(to bottom, rgba(0,0,0,0.85), rgba(0,0,0,0.35) 55%, rgba(0,0,0,0) 85%)';
  const strongMaskTop = 'linear-gradient(to bottom, rgba(0,0,0,0.95), rgba(0,0,0,0.4) 40%, rgba(0,0,0,0) 70%)';
  const mildMaskBottom = 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.35) 55%, rgba(0,0,0,0) 85%)';
  const strongMaskBottom = 'linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.4) 40%, rgba(0,0,0,0) 70%)';

  return (
    <div className={cn('relative flex flex-col min-h-0', className)}>
      <div
        ref={scrollRef}
        className={cn('overflow-auto min-h-0 scroll-smooth gradient-scroll-area-scrollbar', scrollAreaClassName)}
      >
        {children}
      </div>
      {!disableTop && (
        <div
          aria-hidden
          className={cn('pointer-events-none absolute left-0 right-0 top-0 z-10 transition-opacity duration-300', atTop ? 'opacity-0' : 'opacity-100')}
          style={{ height: topOverlayHeight }}
        >
          <div className=" rounded-none absolute inset-0 bg-gradient-to-b from-background/98 via-background/70 to-transparent dark:from-neutral-900/98 dark:via-neutral-900/60" />
          <div
            className="absolute inset-0"
            style={{ backdropFilter: `blur(${mildBlur}px)`, WebkitBackdropFilter: `blur(${mildBlur}px)`, WebkitMaskImage: mildMaskTop, maskImage: mildMaskTop }}
          />
          <div
            className="absolute inset-0"
            style={{ backdropFilter: `blur(${strongBlur}px)`, WebkitBackdropFilter: `blur(${strongBlur}px)`, WebkitMaskImage: strongMaskTop, maskImage: strongMaskTop }}
          />
        </div>
      )}
      {!disableBottom && (
        <div
          aria-hidden
          className={cn('pointer-events-none overflow-hidden absolute left-0 right-0 bottom-0 z-10 transition-opacity duration-300', atBottom ? 'opacity-0' : 'opacity-100')}
          style={{ height: bottomOverlayHeight }}
        >
          <div className="absolute inset-0 rounded-b-lg bg-gradient-to-t from-background/90 via-background/60 to-transparent dark:from-neutral-900/90 dark:via-neutral-900/50" />
          <div
            className="absolute inset-1"
            style={{ backdropFilter: `blur(${mildBlur}px)`, WebkitBackdropFilter: `blur(${mildBlur}px)`, WebkitMaskImage: mildMaskBottom, maskImage: mildMaskBottom }}
          />
          <div
            className="absolute inset-1"
            style={{ backdropFilter: `blur(${strongBlur}px)`, WebkitBackdropFilter: `blur(${strongBlur}px)`, WebkitMaskImage: strongMaskBottom, maskImage: strongMaskBottom }}
          />
        </div>
      )}
    </div>
  );
});

export default GradientScrollArea;
