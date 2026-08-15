import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { useAuthStore } from "../stores/auth.store";
import { useUiStore } from "../stores/ui.store";
import { useUpdateProfile } from "../hooks/useAuth";
import { Avatar } from "../components/Avatar";

export function SettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState(user?.name ?? "");
  const [status, setStatus] = useState(user?.status ?? "");
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const handleSave = async () => {
    await updateProfile.mutateAsync({ name, status: status || null });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto h-full max-w-lg overflow-y-auto p-6">
      <button
        onClick={() => navigate("/app")}
        className="mb-4 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200"
      >
        <ArrowLeft size={15} /> Back
      </button>

      <h1 className="font-display text-2xl text-ink-900 dark:text-ink-50">Settings</h1>

      <div className="mt-6 flex items-center gap-4">
        <Avatar name={user.name} src={user.avatar} size="xl" />
        <div>
          <p className="text-sm font-medium text-ink-900 dark:text-ink-100">{user.email}</p>
          <p className="text-xs text-ink-400">Avatar comes from your name's initials for now</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-300">Name</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-300">Status</span>
          <input
            className="input"
            placeholder="What are you working on?"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
        </label>

        <button onClick={handleSave} disabled={updateProfile.isPending} className="btn-primary">
          {saved ? "Saved" : "Save changes"}
        </button>
      </div>

      <div className="mt-8 border-t border-ink-200 pt-6 dark:border-ink-800">
        <h2 className="text-sm font-semibold text-ink-900 dark:text-ink-50">Appearance</h2>
        <button onClick={toggleTheme} className="btn-secondary mt-3">
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          Switch to {theme === "dark" ? "light" : "dark"} mode
        </button>
      </div>
    </div>
  );
}
