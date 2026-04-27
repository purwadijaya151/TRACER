import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => (
    <label className="block text-sm">
      {label ? (
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
          {label}
        </span>
      ) : null}
      <textarea
        ref={ref}
        className={cn(
          "focus-ring min-h-24 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy-light",
          error && "border-red-500 focus:border-red-500 focus-visible:ring-red-200",
          className
        )}
        {...props}
      />
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  )
);

Textarea.displayName = "Textarea";
