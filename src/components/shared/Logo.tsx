import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  className?: string;
  onClick?: () => void;
}

/** Plain text mark — product name shown as "Resume". */
const Logo: React.FC<LogoProps> = ({
  size = 100,
  className = "",
  onClick,
}) => {
  const fontSize = Math.max(14, Math.round(size * 0.42));

  return (
    <span
      role="img"
      aria-label="Resume"
      onClick={onClick}
      className={cn(
        "inline-flex items-center font-bold tracking-tight select-none",
        className
      )}
      style={{ fontSize, lineHeight: 1, height: size }}
    >
      Resume
    </span>
  );
};

export default Logo;
