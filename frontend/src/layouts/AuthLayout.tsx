import { type ReactNode } from "react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">ChatPulse</h1>
          <p className="mt-1 text-sm text-gray-500">Team messaging, reimagined</p>
        </div>
        {children}
      </div>
    </div>
  );
}
