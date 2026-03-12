export default function AdminSettingsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-2xl font-bold text-white">Settings / Controls</h1>
      <p className="mb-8 text-sm text-[var(--muted)]">
        Global platform controls. Destructive actions require confirmation elsewhere.
      </p>

      <div className="space-y-6 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
        <div>
          <h2 className="text-sm font-medium text-white">Admin access</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Only emails in NEXT_PUBLIC_ADMIN_EMAILS can access /admin. Replace with Supabase role in production.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-white">Action logging</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            All admin actions are structured for logging (see lib/adminActions.ts). Send to backend/audit table in production.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-white">Formulas</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Internal ranking and trust math are not exposed in the admin UI.
          </p>
        </div>
      </div>
    </div>
  );
}
