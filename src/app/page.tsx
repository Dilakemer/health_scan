import Link from "next/link";
import { redirect } from "next/navigation";
import { continueAsGuestAction } from "@/app/(auth)/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { tr } from "@/i18n/tr";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-6 py-10">
      <section className="surface-glass shine-border fade-slide-in relative overflow-hidden rounded-3xl p-7 sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />

        <div className="relative max-w-3xl">
          <p className="text-xs uppercase tracking-[0.26em] text-cyan-200/90">{tr.home.badge}</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-50 sm:text-5xl">{tr.home.title}</h1>
          <p className="mt-4 text-sm text-slate-200 sm:text-base">{tr.home.subtitle}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <form action={continueAsGuestAction}>
              <FormSubmitButton
                idleLabel={tr.home.primaryCta}
                pendingLabel={tr.home.primaryCtaPending}
                className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              />
            </form>
            <Link
              href="/login"
              className="rounded-xl border border-cyan-300/50 bg-cyan-500/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
            >
              {tr.home.secondaryCta}
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="surface-glass fade-slide-in stagger-1 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">1</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-50">{tr.home.steps.scan.title}</h2>
          <p className="mt-2 text-sm text-slate-300">{tr.home.steps.scan.description}</p>
        </article>
        <article className="surface-glass fade-slide-in stagger-2 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">2</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-50">{tr.home.steps.profile.title}</h2>
          <p className="mt-2 text-sm text-slate-300">{tr.home.steps.profile.description}</p>
        </article>
        <article className="surface-glass fade-slide-in stagger-3 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">3</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-50">{tr.home.steps.result.title}</h2>
          <p className="mt-2 text-sm text-slate-300">{tr.home.steps.result.description}</p>
        </article>
      </section>

      <section className="surface-glass rounded-2xl p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-50">{tr.home.trustTitle}</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          {tr.home.trustBullets.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
