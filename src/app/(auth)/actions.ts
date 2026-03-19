"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function normalizeEmail(value: FormDataEntryValue | null): string {
  const raw = String(value ?? "").trim().toLowerCase();
  return raw.replace(/^['"]+|['"]+$/g, "");
}

function assertValidEmailOrRedirect(email: string, target: "/login" | "/register") {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    redirect(`${target}?error=${encodeURIComponent("Please enter a valid email address.")}`);
  }
}

function mapAuthError(message: string): string {
  if (message.includes("email rate limit exceeded")) {
    return "Cok fazla deneme yapildi. Lutfen birkac dakika bekleyip tekrar deneyin.";
  }
  if (message.includes("Anonymous sign-ins are disabled")) {
    return "Misafir girisi kapali. Supabase Auth ayarlarindan Anonymous provider'i etkinlestirin.";
  }
  if (message.includes("Email address") && message.includes("is invalid")) {
    return "E-posta formati gecersiz gorunuyor. Lutfen e-postayi tekrar kontrol edin.";
  }
  return message;
}

export async function loginAction(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  assertValidEmailOrRedirect(email, "/login");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(mapAuthError(error.message))}`);
  }

  redirect("/dashboard");
}

export async function registerAction(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  assertValidEmailOrRedirect(email, "/register");

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect(`/register?error=${encodeURIComponent(mapAuthError(error.message))}`);
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function continueAsGuestAction() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInAnonymously();

  if (error) {
    redirect(`/login?error=${encodeURIComponent(mapAuthError(error.message))}`);
  }

  redirect("/dashboard");
}
