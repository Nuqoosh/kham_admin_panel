import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SelectNative } from "@/components/ui/select-native";

function Field({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div data-slot="field" className={cn("space-y-2", className)} {...props}>
      {children}
    </div>
  );
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return <Label className={className} {...props} />;
}

function FieldDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

function FieldError({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-error"
      className={cn("text-xs text-destructive", className)}
      {...props}
    />
  );
}

function FormField({
  label,
  htmlFor,
  description,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  description?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Field className={className}>
      <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
      {children}
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FormField,
  Input,
  Textarea,
  SelectNative,
};
