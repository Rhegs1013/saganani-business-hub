import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { NavLinks } from "@/components/layout/NavLinks";
import { MobileNav } from "@/components/layout/MobileNav";
import { logoutAction } from "./logout-action";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const displayName = profile?.full_name ?? user.email ?? "";

  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden w-64 shrink-0 flex-col gap-6 bg-sibol-green px-4 py-6 md:flex">
        <Logo size={38} />
        <NavLinks />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-sibol-green/10 bg-bigas-cream/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <MobileNav />
            <div className="md:hidden">
              <Logo size={30} showWordmark={false} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-bold text-sibol-green/80 sm:inline">
              {displayName}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="tap-target rounded-xl border border-sibol-green/20 px-3.5 py-2 text-sm font-bold text-sibol-green hover:bg-sibol-green/5"
              >
                Log out
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
