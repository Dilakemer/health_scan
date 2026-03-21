import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/(auth)/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ProfileForm } from "@/components/profile-form";
import { ScanHistoryList } from "@/components/scan-history-list";
import { tr } from "@/i18n/tr";
import { createClient } from "@/lib/supabase/server";
import { OnboardingTour } from "@/components/onboarding-tour";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: history }] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("diseases, allergies")
      .eq("user_id", userData.user.id)
      .maybeSingle(),
    supabase
      .from("scan_history")
      .select("id, product_name, verdict, created_at, image_url")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const safeCount = (history ?? []).filter((item) => item.verdict === "safe").length;
  const riskyCount = (history ?? []).filter((item) => item.verdict !== "safe").length;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-6 py-8">
      <OnboardingTour page="dashboard" />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">{tr.dashboard.title}</h1>
          <p className="text-sm text-slate-300">{tr.dashboard.sessionPrefix} {userData.user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            id="tour-dashboard-new-scan"
            href="/scan"
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
          >
            {tr.dashboard.newScan}
          </Link>
          <form action={logoutAction}>
            <FormSubmitButton
              idleLabel={tr.dashboard.signOut}
              pendingLabel={tr.dashboard.signingOut}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-100 hover:bg-white/10"
            />
          </form>
          <Link
            href="?tour=true"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-600 text-slate-100 hover:bg-white/10"
            title={tr.dashboard.help}
          >
            <HelpCircle size={18} />
          </Link>
        </div>
      </header>

      <section id="tour-dashboard-stats" className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">{tr.dashboard.totalScans}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{history?.length ?? 0}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">{tr.dashboard.safeResults}</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-700">{safeCount}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">{tr.dashboard.riskyResults}</p>
          <p className="mt-2 text-2xl font-semibold text-red-700">{riskyCount}</p>
        </article>
      </section>

      <div id="tour-dashboard-profile">
        <ProfileForm
          initialDiseases={profile?.diseases ?? []}
          initialAllergies={profile?.allergies ?? []}
        />
      </div>

      <section id="tour-dashboard-history" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{tr.dashboard.historyTitle}</h2>
        <ScanHistoryList initialItems={history ?? []} />
      </section>
    </main>
  );
}
