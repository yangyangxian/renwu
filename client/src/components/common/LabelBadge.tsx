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

export function LabelBadge({ text, color, className, onClick, disabled, title }: LabelBadgeProps) {
  const style = color ? { background: color, color: pickTextColor(color) } : undefined;
  return (
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
  );
}

export default LabelBadge;
