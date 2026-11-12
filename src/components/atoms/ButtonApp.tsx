import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonAppVariants = cva(
  "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E95420] disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      intent: {
        primary:
          "bg-[#E95420] text-[#F8FAFC] hover:bg-[#D04616] active:bg-[#8C4630] shadow-sm",
        secondary:
          "bg-[#161F30] text-[#F8FAFC] border border-[#26334D] hover:bg-[#1C273C] hover:border-[#94A3B8]/30",
        ghost:
          "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#161F30]",
        subtle:
          "bg-[#E95420]/15 text-[#E95420] hover:bg-[#E95420]/25 border border-[#E95420]/30",
        destructive:
          "bg-[#EF4444] text-white hover:bg-[#EF4444]/90",
        outline:
          "border border-[#26334D] text-[#F8FAFC] hover:bg-[#161F30]",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-[6px] gap-1.5",
        md: "h-10 px-4 py-2 text-sm rounded-[8px] gap-2",
        lg: "h-12 px-6 text-base rounded-[8px] gap-2.5",
        icon: "h-9 w-9 rounded-[8px]",
      },
    },
    defaultVariants: {
      intent: "primary",
      size: "md",
    },
  }
);

export interface ButtonAppProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonAppVariants> {
  asChild?: boolean;
}

export const ButtonApp = React.forwardRef<HTMLButtonElement, ButtonAppProps>(
  ({ className, intent, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonAppVariants({ intent, size }), className)}
        {...props}
      />
    );
  }
);
ButtonApp.displayName = "ButtonApp";
