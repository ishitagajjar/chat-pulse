import { DocumentIcon } from "@heroicons/react/24/outline";
import type { Message } from "@/types";

interface FilePreviewProps {
  message: Message;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilePreview({ message }: FilePreviewProps) {
  if (message.type === "IMAGE" && message.fileUrl) {
    return (
      <a href={message.fileUrl} target="_blank" rel="noopener noreferrer">
        <img
          src={message.fileUrl}
          alt={message.fileName ?? "Image"}
          className="max-w-[300px] rounded-lg"
        />
      </a>
    );
  }

  if (message.type === "FILE" && message.fileUrl) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <DocumentIcon className="h-8 w-8 text-gray-400" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">
            {message.fileName}
          </p>
          <p className="text-xs text-gray-500">
            {formatFileSize(message.fileSize)}
          </p>
        </div>
        <a
          href={message.fileUrl}
          download
          className="text-sm text-indigo-600 hover:underline"
        >
          Download
        </a>
      </div>
    );
  }

  return null;
}
