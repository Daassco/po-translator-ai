import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputAppVariants = cva(
  "flex w-full bg-[#1C273C] text-[#F8FAFC] placeholder:text-[#94A3B8]/60 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      intent: {
        default:
          "border border-[#26334D] focus:border-[#E95420] focus:ring-1 focus:ring-[#E95420]",
        error:
          "border-[#EF4444] focus:border-[#EF4444] focus:ring-1 focus:ring-[#EF4444]",
      },
      sizeVariant: {
        sm: "h-8 px-2.5 py-1 text-xs rounded-[6px]",
        md: "h-10 px-3.5 py-2 text-sm rounded-[8px]",
        lg: "h-12 px-4 py-3 text-base rounded-[8px]",
      },
    },
    defaultVariants: {
      intent: "default",
      sizeVariant: "md",
    },
  }
);

export interface InputAppProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputAppVariants> {}

export const InputApp = React.forwardRef<HTMLInputElement, InputAppProps>(
  ({ className, type, intent, sizeVariant, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputAppVariants({ intent, sizeVariant }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
InputApp.displayName = "InputApp";
