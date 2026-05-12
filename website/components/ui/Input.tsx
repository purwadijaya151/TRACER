import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  allowPasswordToggle?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, allowPasswordToggle = false, type, ...props }, ref) => {
    const inputId = id ?? props.name;
    const [passwordVisible, setPasswordVisible] = React.useState(false);
    const showPasswordToggle = allowPasswordToggle && type === "password";
    const resolvedType = showPasswordToggle && passwordVisible ? "text" : type;

    return (
      <label className="block text-sm">
        {label ? (
          <span className="mb-2 block text-sm font-medium leading-5 text-slate-700">
            {label}
          </span>
        ) : null}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={resolvedType}
            className={cn(
              "focus-ring h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-[15px] leading-6 text-slate-900 placeholder:text-slate-500 focus:border-navy-light",
              showPasswordToggle && "pr-11",
              error && "border-red-500 focus:border-red-500 focus-visible:ring-red-200",
              className
            )}
            {...props}
          />
          {showPasswordToggle ? (
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 transition hover:text-slate-700"
              aria-label={passwordVisible ? "Sembunyikan password" : "Tampilkan password"}
              onClick={() => setPasswordVisible((current) => !current)}
            >
              {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          ) : null}
        </div>
        {error ? <span className="mt-1 block text-sm leading-5 text-red-600">{error}</span> : null}
      </label>
    );
  }
);

Input.displayName = "Input";
