import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c63d8]",
        variant === "primary" && "bg-[#6c63d8] text-white hover:bg-[#5c54c4]",
        variant === "secondary" && "border border-[#e8e9f1] bg-white text-[#4a4e63] hover:bg-[#f8f9fc]",
        variant === "ghost" && "text-[#6d7285] hover:bg-[#f0f1f7]",
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";
