type AvatarSize = "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: AvatarSize;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-10 w-10 text-base",
  xl: "h-12 w-12 text-lg",
};

export function Avatar({ name, src, size = "md" }: AvatarProps) {
  const initial = name.charAt(0).toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover ${sizeClasses[size]}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-indigo-500 font-medium text-white ${sizeClasses[size]}`}
    >
      {initial}
    </div>
  );
}
