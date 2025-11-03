import { SettingsContent } from "@/components/settings/settings-content";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure preferences, notifications, and upcoming integrations.
        </p>
      </div>
      <SettingsContent />
    </div>
  );
}
