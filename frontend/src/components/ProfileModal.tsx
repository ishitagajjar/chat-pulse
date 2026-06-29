import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/userService";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) setDisplayName(user.displayName);
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      await userService.updateProfile({ displayName });
      onClose();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      await userService.uploadAvatar(file);
      onClose();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Your Profile">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Avatar name={user.displayName} src={user.avatarUrl} size="xl" />
          <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-indigo-500 px-2 py-1 text-xs text-white hover:bg-indigo-600">
            Edit
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </label>
        </div>
        <Input
          label="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <p className="w-full text-sm text-gray-500">{user.email}</p>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button onClick={handleSave} loading={loading} className="w-full">
          Save Changes
        </Button>
      </div>
    </Modal>
  );
}
