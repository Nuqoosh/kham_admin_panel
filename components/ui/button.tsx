import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap transition-[background-color,border-color,transform,opacity] duration-150 ease-out outline-none select-none active:not-disabled:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "border border-olive bg-olive text-cream hover:bg-olive-soft",
        primary: "border border-olive bg-olive text-cream hover:bg-olive-soft",
        outline:
          "border border-olive/25 bg-transparent text-ink hover:bg-sand",
        secondary: "border border-cream bg-cream text-olive hover:bg-paper",
        cream: "border border-cream bg-cream text-olive hover:bg-paper",
        ghost: "border border-transparent text-ink hover:bg-sand/80",
        invert:
          "border border-cream/35 bg-cream/10 text-cream hover:bg-cream/20",
        destructive:
          "border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20",
        link: "h-auto rounded-none border-transparent px-0 text-ink underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 text-xs uppercase tracking-[0.16em]",
        sm: "h-9 px-4 text-xs uppercase tracking-[0.14em]",
        lg: "h-12 px-8 text-xs uppercase tracking-[0.18em]",
        icon: "size-11 p-0",
        "icon-sm": "size-9 p-0",
        "icon-lg": "size-12 p-0",
      },
      pill: {
        true: "rounded-full",
        false: "rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      pill: true,
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  pill = true,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, pill, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
