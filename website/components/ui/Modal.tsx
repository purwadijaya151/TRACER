"use client";

import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { Fragment } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalSize = "sm" | "md" | "lg" | "xl";

const sizes: Record<ModalSize, string> = {
  sm: "max-w-[400px]",
  md: "max-w-[560px]",
  lg: "max-w-[700px]",
  xl: "max-w-[900px]"
};

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md"
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
}) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[80]" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto p-4">
          <div className="flex min-h-full items-start justify-center py-4 sm:items-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-150"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel
                data-testid="modal-panel"
                className={cn(
                  "flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-lg bg-white shadow-overlay ring-1 ring-black/5 transition-all",
                  sizes[size]
                )}
              >
                <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
                  <DialogTitle className="font-heading text-xl font-semibold leading-7 text-slate-950">
                    {title}
                  </DialogTitle>
                  <button
                    type="button"
                    onClick={onClose}
                    className="focus-ring rounded-md p-2 text-slate-500 hover:bg-slate-100"
                    aria-label="Tutup modal"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="min-h-0 overflow-y-auto p-5">{children}</div>
                {footer ? <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-4">{footer}</div> : null}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
