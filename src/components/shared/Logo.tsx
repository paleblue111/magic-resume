import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** Optional font size in px. Prefer className for layout. */
  size?: number;
  className?: string;
  onClick?: () => void;
}

/** Wordmark. The product name is the word Resume — no boxed graphic. */
const Logo: React.FC<LogoProps> = ({
  size,
  className = "",
  onClick,
}) => {
  return (
    <span
      role="img"
      aria-label="Resume"
      onClick={onClick}
      className={cn(
        "inline-flex items-center select-none leading-none",
        "text-[15px] font-semibold tracking-[-0.03em] text-sidebar-foreground",
        className
      )}
      style={size ? { fontSize: size } : undefined}
    >
      Resume
    </span>
  );
};

export default Logo;
