import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const loadingSpinnerVariants = cva(
  "inline-flex items-center justify-center gap-2 bg-[#10000] border-t-primary ease-linear rounded-full animate-spin",
  {
    variants: {
      size: {
        default: "w-8 h-8 border-6",
        sm: "w-6 h-6 border-4",
        lg: "w-15 h-15 border-10",
        xl: "w-20 h-20 border-15",
        xxl: "w-50 h-50 border-30",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

function LoadingSpinner({
  className,
  size,
}: React.ComponentProps<"div"> & VariantProps<typeof loadingSpinnerVariants>) {
  return (
    <div
      data-slo="loading-spinner"
      className={cn(loadingSpinnerVariants({ size }), className)}
    />
  );
}

export { LoadingSpinner };
