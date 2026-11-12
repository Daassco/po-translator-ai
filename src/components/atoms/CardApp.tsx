import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardAppVariants = cva(
  "transition-all",
  {
    variants: {
      typeVariant: {
        outer: "bg-[#161F30] border border-[#26334D] rounded-[12px] p-6 shadow-sm",
        inner: "bg-[#1C273C] border border-[#26334D] rounded-[8px] p-4",
        subtle: "bg-[#161F30]/60 border border-[#26334D]/80 rounded-[12px] p-5",
      },
    },
    defaultVariants: {
      typeVariant: "outer",
    },
  }
);

export interface CardAppProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardAppVariants> {}

export const CardApp = React.forwardRef<HTMLDivElement, CardAppProps>(
  ({ className, typeVariant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardAppVariants({ typeVariant }), className)}
        {...props}
      />
    );
  }
);
CardApp.displayName = "CardApp";
