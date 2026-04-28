"use client";

import { Switch } from "@headlessui/react";
import { cn } from "@/lib/utils";

export function Toggle({
  checked,
  onChange,
  label,
  description
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <Switch.Group as="div" className="flex items-center justify-between gap-4 rounded-lg border border-slate-100 p-4">
      <div>
        <Switch.Label className="text-[15px] font-semibold leading-6 text-slate-900">{label}</Switch.Label>
        {description ? <Switch.Description className="mt-1 text-sm leading-6 text-slate-600">{description}</Switch.Description> : null}
      </div>
      <Switch
        checked={checked}
        onChange={onChange}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition",
          checked ? "bg-navy" : "bg-slate-300"
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </Switch>
    </Switch.Group>
  );
}
