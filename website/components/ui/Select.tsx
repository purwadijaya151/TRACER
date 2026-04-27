import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, children, ...props }, ref) => (
    <label className="block text-sm">
      {label ? (
        <span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-slate-700">
          {label}
        </span>
      ) : null}
      <select
        ref={ref}
        className={cn(
          "focus-ring h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-navy-light",
          error && "border-red-500 focus:border-red-500 focus-visible:ring-red-200",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error ? <span className="mt-1 block text-[13px] text-red-600">{error}</span> : null}
    </label>
  )
);

Select.displayName = "Select";
