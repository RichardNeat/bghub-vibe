import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { ThemeToggle } from "./ThemeToggle";
import Link from "next/link";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-page)" }}>
      <header className="sticky top-0 z-10 shadow-md" style={{ backgroundColor: "var(--bg-nav)" }}>
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <a
            href="/events"
            className="font-bold text-lg tracking-tight text-white flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            🎲 BGHub
          </a>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="w-px h-5 bg-white/20 mx-1" />
            {session.user.image && (
              <Image
                src={session.user.image}
                alt={session.user.name ?? ""}
                width={30}
                height={30}
                className="rounded-full ring-2 ring-white/20"
              />
            )}
            <span className="text-sm text-white/70 hidden sm:block">{session.user.name}</span>
            <Link
              href="/account"
              className="text-xs font-medium px-3 py-1.5 rounded-md transition-colors text-white/70 hover:text-white hover:bg-white/10"
            >
              Account
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="text-xs font-medium px-3 py-1.5 rounded-md transition-colors text-white/70 hover:text-white hover:bg-white/10 border border-white/20 cursor-pointer"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full px-5 py-8">{children}</main>
    </div>
  );
}
