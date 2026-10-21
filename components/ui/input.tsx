import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type InputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "className"
> & {
  label: string;
  /** Validation message rendered below the field and announced to the user. */
  error?: string;
  hint?: string;
  className?: string;
};

export function Input({
  label,
  error,
  hint,
  id,
  className,
  ...props
}: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const describedBy = error
    ? `${inputId}-error`
    : hint
      ? `${inputId}-hint`
      : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 shadow-xs transition-colors",
          "placeholder:text-slate-400",
          error
            ? "border-danger-600 focus:border-danger-600"
            : "focus:border-brand-600 border-slate-300 hover:border-slate-400",
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-danger-700 text-sm">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-sm text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
