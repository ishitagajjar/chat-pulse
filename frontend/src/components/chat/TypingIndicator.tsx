interface TypingIndicatorProps {
  users: string[];
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  let text = "";
  if (users.length === 1) {
    text = `${users[0]} is typing`;
  } else if (users.length === 2) {
    text = `${users[0]} and ${users[1]} are typing`;
  } else if (users.length > 2) {
    text = `${users.length} people are typing`;
  }

  return (
    <div
      className={`mb-1 flex h-5 items-center gap-1 text-xs text-gray-500 transition-opacity ${users.length > 0 ? "opacity-100" : "opacity-0"}`}
    >
      {users.length > 0 && (
        <>
          <span>{text}</span>
          <span className="flex gap-0.5">
            <span className="animate-bounce-dot h-1 w-1 rounded-full bg-gray-400" />
            <span className="animate-bounce-dot h-1 w-1 rounded-full bg-gray-400" />
            <span className="animate-bounce-dot h-1 w-1 rounded-full bg-gray-400" />
          </span>
        </>
      )}
    </div>
  );
}
