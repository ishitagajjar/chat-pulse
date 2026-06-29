interface PresenceDotProps {
  status: "online" | "offline" | "away";
  size?: "sm" | "md";
}

const colorClasses = {
  online: "bg-green-500",
  offline: "bg-gray-400",
  away: "bg-yellow-400",
};

const sizeClasses = {
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3",
};

export function PresenceDot({ status, size = "sm" }: PresenceDotProps) {
  return (
    <span
      className={`absolute bottom-0 right-0 rounded-full border-2 border-gray-900 ${colorClasses[status]} ${sizeClasses[size]} ${status === "online" ? "presence-pulse" : ""}`}
    />
  );
}
