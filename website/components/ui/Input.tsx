import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <label className="block text-sm">
        {label ? (
          <span className="mb-2 block text-sm font-medium leading-5 text-slate-700">
            {label}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "focus-ring h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-[15px] leading-6 text-slate-900 placeholder:text-slate-500 focus:border-navy-light",
            error && "border-red-500 focus:border-red-500 focus-visible:ring-red-200",
            className
          )}
          {...props}
        />
        {error ? <span className="mt-1 block text-sm leading-5 text-red-600">{error}</span> : null}
      </label>
    );
  }
);

Input.displayName = "Input";
