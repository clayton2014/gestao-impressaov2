"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export type Option = { value: string; label: string; disabled?: boolean };

type Props = {
  value?: string;
  onChange?: (value: string) => void;
  options: Option[];
  placeholder?: string;
  name?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
};

const SafeSelect = React.forwardRef<HTMLSelectElement, Props>(
  ({ value = "", onChange, options, placeholder, name, id, className, disabled, required }, ref) => {
    return (
      <select
        ref={ref}
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        required={required}
        className={cn(
          "h-10 w-full rounded-md border border-input bg-background px-3 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
);
SafeSelect.displayName = "SafeSelect";

export { SafeSelect };