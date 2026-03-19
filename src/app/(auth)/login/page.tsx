import Link from "next/link";
import { continueAsGuestAction, loginAction } from "../actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { tr } from "@/i18n/tr";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">{tr.auth.loginTitle}</h1>
        <p className="mt-2 text-sm text-slate-600">{tr.auth.loginSubtitle}</p>

        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
          <h2 className="text-sm font-semibold text-emerald-900">{tr.auth.onboardingTitle}</h2>
          <p className="mt-1 text-sm text-emerald-800">{tr.auth.onboardingSummary}</p>
          <p className="mt-2 text-xs text-emerald-900">{tr.auth.onboardingStep1}</p>
          <p className="text-xs text-emerald-900">{tr.auth.onboardingStep2}</p>
          <p className="text-xs text-emerald-900">{tr.auth.onboardingStep3}</p>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <form action={loginAction} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-700">{tr.auth.email}</span>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-emerald-200 focus:ring"
              type="email"
              name="email"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-700">{tr.auth.password}</span>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-emerald-200 focus:ring"
              type="password"
              name="password"
              minLength={6}
              required
            />
          </label>
          <FormSubmitButton
            idleLabel={tr.auth.signIn}
            pendingLabel={tr.auth.signingIn}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700"
          />
        </form>

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-700">
            {tr.auth.guestHint}
          </p>
          <form action={continueAsGuestAction} className="mt-3">
            <FormSubmitButton
              idleLabel={tr.auth.guestContinue}
              pendingLabel={tr.auth.guestContinuing}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
            />
          </form>
        </div>

        <p className="mt-4 text-sm text-slate-600">
          {tr.auth.noAccount}{" "}
          <Link className="text-emerald-700 hover:underline" href="/register">
            {tr.auth.register}
          </Link>
        </p>
      </section>
    </main>
  );
}
