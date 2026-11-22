import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-xl border border-[#dfe1eb] bg-white px-3.5 text-base text-[#20243a] outline-none placeholder:text-[#85899a] focus:border-[#6c63d8] focus:ring-4 focus:ring-[#6c63d8]/10",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
