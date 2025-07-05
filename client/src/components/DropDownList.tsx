import React from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui-kit/Select";

interface DropDownListProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string; icon?: React.ReactNode }[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export const DropDownList: React.FC<DropDownListProps> = ({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  disabled = false,
  id,
  className
}) => (
  <Select value={value} onValueChange={onValueChange} disabled={disabled}>
    <SelectTrigger id={id} className={className ? `${className} text-secondary-foreground` : 'text-secondary-foreground'}>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {options.map(opt => (
        <SelectItem key={opt.value} value={opt.value} className="p-1">
          <span className="flex flex-row items-center justify-between w-full text-secondary-foreground">           
            {opt.icon && <span className="ml-[-4px] translate-y-[-1px]">{opt.icon}</span>}
            <span className={opt.icon ? "ml-2" : "ml-1"}>{opt.label}</span>
          </span>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);