import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { forwardRef } from "react";

interface FieldWrapperProps {
  label: string;
  error?: string;
  children: ReactNode;
}

function FieldWrapper({ label, error, children }: FieldWrapperProps) {
  return (
    <label className="flex flex-col gap-1 text-sm text-text-secondary">
      {label}
      {children}
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  );
}

const INPUT_CLASSES = "min-h-tap rounded-md border border-border bg-bg-canvas px-4 text-base text-text-primary";

export const TextField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }>(
  ({ label, error, className = "", ...rest }, ref) => (
    <FieldWrapper label={label} error={error}>
      <input ref={ref} className={`${INPUT_CLASSES} ${className}`} {...rest} />
    </FieldWrapper>
  ),
);
TextField.displayName = "TextField";

export const TextAreaField = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }
>(({ label, error, className = "", ...rest }, ref) => (
  <FieldWrapper label={label} error={error}>
    <textarea ref={ref} className={`${INPUT_CLASSES} min-h-24 py-2 ${className}`} {...rest} />
  </FieldWrapper>
));
TextAreaField.displayName = "TextAreaField";

export const SelectField = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; children: ReactNode }
>(({ label, error, className = "", children, ...rest }, ref) => (
  <FieldWrapper label={label} error={error}>
    <select ref={ref} className={`${INPUT_CLASSES} ${className}`} {...rest}>
      {children}
    </select>
  </FieldWrapper>
));
SelectField.displayName = "SelectField";
