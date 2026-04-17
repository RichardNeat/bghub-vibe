"use client";

import { deleteAccount } from "@/lib/actions";

export function DeleteAccountButton() {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const confirmed = confirm(
      "Are you sure? This will permanently delete your account, remove you from all events, and delete any future events you created. This cannot be undone."
    );
    if (!confirmed) return;
    await deleteAccount();
  }

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="submit"
        className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
        style={{
          backgroundColor: "var(--danger-light)",
          color: "var(--danger)",
          border: "1px solid var(--danger)",
        }}
      >
        Delete my account
      </button>
    </form>
  );
}
