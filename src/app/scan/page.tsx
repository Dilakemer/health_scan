import Link from "next/link";
import { redirect } from "next/navigation";
import { ScanWorkflow } from "@/components/scan-workflow";
import { tr } from "@/i18n/tr";
import { createClient } from "@/lib/supabase/server";

export default async function ScanPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-7 px-4 py-6 sm:px-6 sm:py-8">
      <header className="surface-glass shine-border fade-slide-in relative overflow-hidden rounded-3xl px-5 py-6 sm:px-7">
        <div className="pointer-events-none absolute -right-14 -top-10 h-36 w-36 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-14 left-1/3 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/90">Health Scan</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-50 sm:text-3xl">{tr.scan.pageTitle}</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-200/90 sm:text-base">{tr.scan.pageSubtitle}</p>
          </div>
          <Link
            className="inline-flex items-center justify-center rounded-xl border border-cyan-300/50 bg-cyan-500/15 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/25"
            href="/dashboard"
          >
            {tr.scan.backToDashboard}
          </Link>
        </div>
      </header>

      <ScanWorkflow />
    </main>
  );
}
