import { Badge } from '@/components/ui-kit/Badge';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui-kit/Button';

export interface LabelBadgeProps {
  text: string;
  color?: string; // background color (hex or css color)
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  onDelete?: () => void;
}

function pickTextColor(bg?: string) {
  if (!bg) return undefined;
  // Support hex variants: #rgb, #rgba, #rrggbb, #rrggbbaa
  let hex = bg.trim();
  if (!hex.startsWith('#')) return '#fff';
  hex = hex.slice(1);
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  } else if (hex.length === 4) {
    hex = hex.slice(0,3).split('').map(c => c + c).join('');
  } else if (hex.length === 8) {
    hex = hex.slice(0,6);
  }
  if (hex.length !== 6) return '#fff';
  const r = parseInt(hex.slice(0,2),16);
  const g = parseInt(hex.slice(2,4),16);
  const b = parseInt(hex.slice(4,6),16);
  const luminance = (0.2126*r + 0.7152*g + 0.0722*b)/255;
  return luminance > 0.6 ? '#000' : '#fff';
}

export function LabelBadge({ text, color, className, onClick, disabled, title, onDelete }: LabelBadgeProps) {
  const style = color ? { background: color, color: pickTextColor(color) } : undefined;
  // wrapper allows us to show delete button only on hover (group)
  return (
    <div className={cn('inline-flex items-center px-1', onDelete ? 'group' : '')}>
      <div className="relative inline-block">
      <Badge
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : -1}
        aria-label={text}
        variant="outline"
        title={title || text}
        onClick={disabled ? undefined : onClick}
        className={cn(
          'px-2 py-[3px] text-xs shadow-none border-0 select-none flex items-center gap-1',
          disabled && 'opacity-60 cursor-not-allowed',
          onClick && !disabled && 'cursor-pointer hover:bg-accent/60 transition-colors',
          className,
        )}
        style={style}
      >
        {text}
      </Badge>
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Delete ${text}`}
          onClick={(e: any) => { e.stopPropagation(); e.preventDefault(); if (!disabled) onDelete(); }}
          // circular background; icon turns red on hover and background becomes subtly red to make it noticeable
          className={cn(
            'absolute -right-[6px] -top-[6px] opacity-0 group-hover:opacity-100 transition-opacity',
            'text-gray-500 hover:text-red-600',
            'bg-white/70 hover:bg-red-100 dark:bg-black/80 dark:hover:bg-red-900',
            'rounded-full w-5 h-5 flex items-center justify-center'
          )}
          title={`Delete ${text}`}
        >
          <Trash2 className="w-2 h-2" />
        </Button>
      )}
      </div>
    </div>
  );
}

export default LabelBadge;
