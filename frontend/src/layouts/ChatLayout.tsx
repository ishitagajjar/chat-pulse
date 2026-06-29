import { useState, type ReactNode } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

interface ChatLayoutProps {
  sidebar: ReactNode;
  header: ReactNode;
  main: ReactNode;
  rightPanel?: ReactNode;
  showRightPanel?: boolean;
  onCloseRightPanel?: () => void;
}

export function ChatLayout({
  sidebar,
  header,
  main,
  rightPanel,
  showRightPanel = false,
  onCloseRightPanel,
}: ChatLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {showRightPanel && onCloseRightPanel && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onCloseRightPanel}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-gray-900 transition-transform duration-200 md:relative md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {sidebar}
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center border-b border-gray-200 bg-white px-4 py-2 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>

        {header}

        <div className="relative flex flex-1 overflow-hidden">
          <main className="flex flex-1 flex-col overflow-hidden">{main}</main>

          {showRightPanel && rightPanel && (
            <>
              <aside className="hidden w-64 overflow-y-auto border-l border-gray-200 bg-white lg:block">
                {rightPanel}
              </aside>
              <aside className="fixed inset-y-0 right-0 z-40 w-72 overflow-y-auto border-l border-gray-200 bg-white shadow-xl lg:hidden">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                  <span className="font-semibold text-gray-900">Members</span>
                  <button
                    onClick={onCloseRightPanel}
                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                {rightPanel}
              </aside>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
