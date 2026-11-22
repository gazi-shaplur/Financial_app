import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#e7e8f1] bg-white p-5 shadow-[0_10px_30px_rgba(38,42,72,0.055)] sm:p-6",
        className,
      )}
      {...props}
    />
  );
}
