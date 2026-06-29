import { XMarkIcon } from "@heroicons/react/24/outline";
import type { ReactionNotification } from "@/hooks/useReactionNotifications";

interface ReactionNotificationToastsProps {
  notifications: ReactionNotification[];
  onDismiss: (id: string) => void;
  onNavigate: (channelId: string, messageId: string) => void;
}

export function ReactionNotificationToasts({
  notifications,
  onDismiss,
  onNavigate,
}: ReactionNotificationToastsProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map((n) => (
        <button
          key={n.id}
          type="button"
          onClick={() => {
            onNavigate(n.channelId, n.messageId);
            onDismiss(n.id);
          }}
          className="flex max-w-sm items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 text-left shadow-lg transition hover:bg-gray-50"
        >
          <span className="text-2xl">{n.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">
              {n.userDisplayName}{" "}
              {n.action === "add" ? "reacted" : "removed a reaction"}
            </p>
            <p className="truncate text-xs text-gray-500">
              in {n.channelName}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(n.id);
            }}
            className="shrink-0 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </button>
      ))}
    </div>
  );
}
