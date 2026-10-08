import React from "react";
import sietEmblem from "@/assets/siet-emblem.png";
import sietFullLogo from "@/assets/siet-logo-full.png";

export { sietEmblem, sietFullLogo };

export interface SIETLogoProps {
  className?: string;
  size?: number;
  variant?: "icon" | "full" | "emblem";
  alt?: string;
}

export const SIETLogo: React.FC<SIETLogoProps> = ({
  className = "",
  size = 48,
  variant = "icon",
  alt = "Srinivasa Institute of Engineering & Technology",
}) => {
  if (variant === "full") {
    return (
      <img
        src={sietFullLogo}
        alt={alt}
        style={{ height: size, width: "auto" }}
        className={`object-contain select-none ${className}`}
      />
    );
  }

  return (
    <img
      src={sietEmblem}
      alt={alt}
      style={{ height: size, width: size }}
      className={`object-contain rounded-full select-none ${className}`}
    />
  );
};

export default SIETLogo;
