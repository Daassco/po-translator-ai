import * as React from "react";
import { cn } from "@/lib/utils";

export interface KpiDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string | number;
  label: string;
  sublabel?: string;
  trend?: string;
  icon?: React.ReactNode;
}

export function KpiDisplay({
  value,
  label,
  sublabel,
  icon,
  className,
  ...props
}: KpiDisplayProps) {
  return (
    <div
      className={cn(
        "bg-[#161F30] border border-[#26334D] rounded-[12px] p-5 flex flex-col justify-between",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between text-[#94A3B8] mb-2">
        <span className="text-[11px] font-semibold tracking-wider uppercase">{label}</span>
        {icon && <div className="text-[#E95420]">{icon}</div>}
      </div>
      <div className="text-2xl font-bold font-sans tabular-nums text-[#F8FAFC] tracking-tight">
        {value}
      </div>
      {sublabel && (
        <div className="mt-2 text-xs text-[#94A3B8] flex items-center gap-1.5">
          {sublabel}
        </div>
      )}
    </div>
  );
}
