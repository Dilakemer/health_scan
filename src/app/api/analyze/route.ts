import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeIngredients, extractECodes, type IngredientRule } from "@/lib/ingredient-engine";
import { fallbackIngredientRules } from "@/lib/default-rules";
import { createClient } from "@/lib/supabase/server";

const analyzeSchema = z.object({
  ingredients: z.array(z.string().min(1)).min(1),
  productName: z.string().optional().default("Unknown product"),
});

const LIMIT_PER_MINUTE = 10;

function getMinuteWindow(date: Date) {
  const copy = new Date(date);
  copy.setSeconds(0, 0);
  return copy.toISOString();
}

async function enforceRateLimit(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const windowStart = getMinuteWindow(new Date());

  const { data: existing, error: readError } = await supabase
    .from("rate_limits")
    .select("id, request_count")
    .eq("user_id", userId)
    .eq("window_start", windowStart)
    .maybeSingle();

  if (readError) {
    throw new Error(readError.message);
  }

  if (!existing) {
    const { error: insertError } = await supabase.from("rate_limits").insert({
      user_id: userId,
      window_start: windowStart,
      request_count: 1,
    });
    if (insertError) {
      throw new Error(insertError.message);
    }
    return;
  }

  if (existing.request_count >= LIMIT_PER_MINUTE) {
    throw new Error("Rate limit exceeded. Try again in one minute.");
  }

  const { error: updateError } = await supabase
    .from("rate_limits")
    .update({ request_count: existing.request_count + 1 })
    .eq("id", existing.id);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

async function uploadImageIfProvided(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  imageFile: File | null,
): Promise<string | null> {
  if (!imageFile || imageFile.size === 0) {
    return null;
  }

  const path = `${userId}/${Date.now()}-${imageFile.name}`;
  const arrayBuffer = await imageFile.arrayBuffer();

  const { error } = await supabase.storage
    .from("scan-images")
    .upload(path, arrayBuffer, { contentType: imageFile.type, upsert: false });

  if (error) {
    return null;
  }

  const { data } = supabase.storage.from("scan-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await enforceRateLimit(supabase, userData.user.id);

    const formData = await request.formData();
    const ingredientsRaw = formData.get("ingredients");
    const productName = String(formData.get("productName") ?? "Unknown product");
    const image = formData.get("image") as File | null;

    const parsedInput = analyzeSchema.safeParse({
      ingredients: ingredientsRaw ? JSON.parse(String(ingredientsRaw)) : [],
      productName,
    });

    if (!parsedInput.success) {
      return NextResponse.json({ error: parsedInput.error.flatten() }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("diseases")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    const { data: rules, error: rulesError } = await supabase
      .from("ingredient_rules")
      .select("ingredient_name, aliases, harmful_for, severity, reason");

    if (rulesError) {
      return NextResponse.json({ error: rulesError.message }, { status: 400 });
    }

    const allIngredients = [
      ...parsedInput.data.ingredients,
      ...extractECodes(parsedInput.data.ingredients),
    ];

    const dbRules = (rules ?? []) as IngredientRule[];
    const activeRules = [...fallbackIngredientRules, ...dbRules];

    const result = analyzeIngredients(
      allIngredients,
      profile?.diseases ?? [],
      activeRules,
    );

    const imageUrl = await uploadImageIfProvided(supabase, userData.user.id, image);

    const { error: historyError } = await supabase.from("scan_history").insert({
      user_id: userData.user.id,
      product_name: parsedInput.data.productName,
      ingredients: allIngredients,
      verdict: result.verdict,
      warnings: result.warnings,
      image_url: imageUrl,
    });

    if (historyError) {
      return NextResponse.json({ error: historyError.message }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown analyze error";
    const status = message.includes("Rate limit") ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
