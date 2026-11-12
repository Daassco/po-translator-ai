import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeAppVariants = cva(
  "inline-flex items-center font-medium transition-colors select-none",
  {
    variants: {
      intent: {
        default: "bg-[#1C273C] text-[#94A3B8] border border-[#26334D]",
        primary: "bg-[#E95420]/15 text-[#E95420] border border-[#E95420]/30",
        success: "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30",
        warning: "bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30",
        error: "bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30",
        info: "bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30",
        karma: "bg-[#A855F7]/15 text-[#A855F7] border border-[#A855F7]/30",
      },
      size: {
        xs: "text-[10px] px-1.5 py-0.5 rounded-[4px] gap-1",
        sm: "text-xs px-2 py-0.5 rounded-[4px] gap-1.5",
        md: "text-xs px-2.5 py-1 rounded-[6px] gap-1.5",
      },
    },
    defaultVariants: {
      intent: "default",
      size: "sm",
    },
  }
);

export interface BadgeAppProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeAppVariants> {}

export function BadgeApp({ className, intent, size, ...props }: BadgeAppProps) {
  return (
    <span
      className={cn(badgeAppVariants({ intent, size }), className)}
      {...props}
    />
  );
}
