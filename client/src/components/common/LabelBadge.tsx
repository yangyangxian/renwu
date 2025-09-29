import React from 'react';
import { Badge } from '@/components/ui-kit/Badge';
import { cn } from '@/lib/utils';

export interface LabelBadgeProps {
  text: string;
  color?: string; // background color (hex or css color)
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}

export function LabelBadge({ text, color, className, onClick, disabled, title }: LabelBadgeProps) {
  // If a custom color is provided, force white text (can be improved with contrast calc later)
  const style = color ? { background: color, color: '#fff' } : undefined;
  return (
    <Badge
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : -1}
      aria-label={text}
      variant="outline"
      title={title || text}
      onClick={disabled ? undefined : onClick}
      className={cn(
        'px-2.5 pb-1 pt-[3px] text-xs shadow-none border-0 select-none flex items-center gap-1',
        disabled && 'opacity-60 cursor-not-allowed',
        onClick && !disabled && 'cursor-pointer hover:bg-accent/60 transition-colors',
        className,
      )}
      style={style}
    >
      {text}
    </Badge>
  );
}

export default LabelBadge;
