import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { workspaceService } from "@/services/workspaceService";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import type { Workspace } from "@/types";

export function WorkspaceSelect() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    workspaceService
      .getAll()
      .then(setWorkspaces)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const ws = await workspaceService.create(newName);
      navigate(`/w/${ws.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workspace");
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await workspaceService.invite(selectedWorkspaceId, inviteEmail);
      setInviteOpen(false);
      setInviteEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite member");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">ChatPulse</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.displayName}</span>
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">
          Your Workspaces
        </h2>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => navigate(`/w/${ws.slug}`)}
                className="rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md"
              >
                <h3 className="text-lg font-semibold text-gray-900">{ws.name}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {ws.memberCount ?? 0} members
                </p>
              </button>
            ))}
          </div>
        )}

        <div className="mt-8 flex gap-4">
          <Button onClick={() => setCreateOpen(true)}>Create Workspace</Button>
          <Button
            variant="secondary"
            onClick={() => {
              if (workspaces.length > 0) {
                setSelectedWorkspaceId(workspaces[0].id);
                setInviteOpen(true);
              }
            }}
          >
            Join Workspace
          </Button>
        </div>
      </main>

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Workspace"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Workspace name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full">
            Create
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite Member"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full">
            Send Invite
          </Button>
        </form>
      </Modal>
    </div>
  );
}
