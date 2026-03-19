"use client";

import { useMemo, useRef, useState } from "react";
import { extractText, normalizeImageText } from "@/lib/ocr";
import { parseIngredients } from "@/lib/ingredient-engine";
import { tr } from "@/i18n/tr";

type AnalysisResponse = {
  verdict: "safe" | "caution" | "avoid";
  warnings: {
    ingredient: string;
    disease: string;
    severity: "critical" | "warning" | "info";
    reason: string;
  }[];
  safeIngredients: string[];
  unknownIngredients: string[];
};

type Step = "upload" | "ocr" | "analyze" | "result";

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

const stepLabels: Record<Step, string> = {
  upload: tr.scan.steps.upload,
  ocr: tr.scan.steps.ocr,
  analyze: tr.scan.steps.analyze,
  result: tr.scan.steps.result,
};

function toTitleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function clamp(num: number, min: number, max: number) {
  return Math.min(Math.max(num, min), max);
}

function prettifyDisease(disease: string): string {
  const map: Record<string, string> = {
    "alerji fistik": "Alerji: Fıstık",
    "alerji soya": "Alerji: Soya",
    "alerji yumurta": "Alerji: Yumurta",
    "alerji susam": "Alerji: Susam",
    diyabet: "Diyabet",
    hipertansiyon: "Hipertansiyon",
    reflu: "Reflü",
    gastrit: "Gastrit / Mide hassasiyeti",
    colyak: "Çölyak",
    "laktoz intoleransi": "Laktoz intoleransı",
  };
  return map[disease] ?? toTitleCase(disease);
}

function suggestPortionByContext(
  score: number,
  warnings: AnalysisResponse["warnings"],
): string {
  const criticalAllergy = warnings.find(
    (w) => w.severity === "critical" && w.disease.startsWith("alerji "),
  );

  if (criticalAllergy) {
    return `Kesinlikle tüketmeyin. ${prettifyDisease(criticalAllergy.disease)} için kritik alerjen tespit edildi.`;
  }

  const criticalDisease = warnings.find((w) => w.severity === "critical");
  if (criticalDisease) {
    return `Tüketmeyin. ${prettifyDisease(criticalDisease.disease)} için kritik düzeyde çakışma var.`;
  }

  if (score >= 75) return "Kaçının. Bu ürün profiliniz için yüksek riskli.";
  if (score >= 45) return "Nadiren ve çok küçük porsiyon (örneğin 1-2 lokma) düşünülebilir.";
  if (score >= 20) return "Küçük porsiyonla ve toplam günlük tüketimi takip ederek tüketin.";
  return "Düşük risk görünüyor; yine de porsiyonu ölçülü tutun.";
}

function buildResultSummary(analysis: AnalysisResponse): string {
  const criticalAllergyDiseases = Array.from(
    new Set(
      analysis.warnings
        .filter((w) => w.severity === "critical" && w.disease.startsWith("alerji "))
        .map((w) => w.disease),
    ),
  );

  if (criticalAllergyDiseases.length > 0) {
    const labels = criticalAllergyDiseases.map(prettifyDisease).join(", ");
    return `Kritik alerjen eşleşmesi bulundu (${labels}). Bu ürün sizin için güvenli değildir.`;
  }

  if (analysis.verdict === "avoid") {
    return "Kritik seviyede profil çakışmaları tespit edildi.";
  }

  if (analysis.verdict === "caution") {
    return "Uyarı seviyesinde profil çakışmaları tespit edildi.";
  }

  return "Kritik veya uyarı seviyesinde profil çakışması bulunmadı.";
}

function classifyIngredient(token: string): "sweetener" | "sodium" | "gluten" | "dairy" | "additive" | "other" {
  const t = token.toLowerCase();
  if (/(seker|glukoz|glikoz|fruktoz|dekstroz|surup|nisasta)/.test(t)) return "sweetener";
  if (/(sodyum|tuz|salt|msg)/.test(t)) return "sodium";
  if (/(gluten|bugday|arpa|cavdar|tritikale)/.test(t)) return "gluten";
  if (/(sut|laktoz|peynir|krema|whey)/.test(t)) return "dairy";
  if (/(^e\d{3}|katki|koruyucu|emulgator)/.test(t)) return "additive";
  return "other";
}

export function ScanWorkflow() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [step, setStep] = useState<Step>("upload");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState("idle");
  const [ocrText, setOcrText] = useState("");
  const [productName, setProductName] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const ingredientList = useMemo(() => parseIngredients(ocrText), [ocrText]);
  const ingredientBuckets = useMemo(() => {
    const map: Record<string, string[]> = {
      sweetener: [],
      sodium: [],
      gluten: [],
      dairy: [],
      additive: [],
      other: [],
    };

    ingredientList.forEach((item) => {
      map[classifyIngredient(item)].push(item);
    });

    return map;
  }, [ingredientList]);

  const analysisInsights = useMemo(() => {
    if (!analysis) return null;

    const critical = analysis.warnings.filter((w) => w.severity === "critical").length;
    const warning = analysis.warnings.filter((w) => w.severity === "warning").length;
    const info = analysis.warnings.filter((w) => w.severity === "info").length;

    const riskScore = clamp(critical * 40 + warning * 20 + info * 8 + analysis.unknownIngredients.length * 2, 0, 100);

    const diseaseCounts: Record<string, number> = {};
    analysis.warnings.forEach((w) => {
      diseaseCounts[w.disease] = (diseaseCounts[w.disease] ?? 0) + 1;
    });

    const diseaseSummary = Object.entries(diseaseCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([disease, count]) => `${prettifyDisease(disease)}: ${count} eşleşme`);

    const total = Math.max(analysis.warnings.length, 1);
    const bars = {
      critical: Math.round((critical / total) * 100),
      warning: Math.round((warning / total) * 100),
      info: Math.round((info / total) * 100),
    };

    return {
      critical,
      warning,
      info,
      riskScore,
      bars,
      diseaseSummary,
      suggestion: suggestPortionByContext(riskScore, analysis.warnings),
      resultSummary: buildResultSummary(analysis),
    };
  }, [analysis]);

  const onImageChange = (file: File | null) => {
    setError("");
    if (!file) {
      setImageFile(null);
      return;
    }

    if (!allowedMimeTypes.includes(file.type)) {
      setError(tr.scan.allowedFormats);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(tr.scan.maxSize);
      return;
    }

    setImageFile(file);
  };

  const runOcr = async () => {
    if (!imageFile) {
      setError(tr.scan.uploadImageFirst);
      return;
    }

    setStep("ocr");
    setError("");

    try {
      const result = await extractText(imageFile, (progress, status) => {
        setOcrProgress(Math.round(progress * 100));
        setOcrStatus(status);
      });

      if (result.confidence < 60) {
        setError(tr.scan.lowConfidence);
        setStep("upload");
        return;
      }

      setOcrText(normalizeImageText(result.text));
      setStep("analyze");
    } catch (ocrError) {
      setError(ocrError instanceof Error ? ocrError.message : tr.scan.ocrFailed);
      setStep("upload");
    }
  };

  const selectImage = () => {
    fileInputRef.current?.click();
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  const runAnalyze = async () => {
    setError("");

    if (ingredientList.length === 0) {
      setError(tr.scan.parseFailed);
      return;
    }

    if (isAnalyzing) {
      return;
    }

    setStep("analyze");
    setIsAnalyzing(true);

    const formData = new FormData();
    formData.set("ingredients", JSON.stringify(ingredientList));
    formData.set("productName", productName || tr.history.unknownProduct);
    if (imageFile) {
      formData.set("image", imageFile);
    }

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as AnalysisResponse & { error?: string };
      if (!response.ok) {
        setError(payload.error ?? tr.scan.analyzeFailed);
        return;
      }

      setAnalysis(payload);
      setStep("result");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetWorkflow = () => {
    setStep("upload");
    setImageFile(null);
    setOcrProgress(0);
    setOcrStatus("idle");
    setOcrText("");
    setAnalysis(null);
    setIsAnalyzing(false);
    setError("");
  };

  const verdictClass =
    analysis?.verdict === "avoid"
      ? "border-red-400/40 bg-red-500/10 text-red-100"
      : analysis?.verdict === "caution"
        ? "border-amber-300/40 bg-amber-400/10 text-amber-100"
        : "border-emerald-300/40 bg-emerald-400/10 text-emerald-100";

  const severityLabel: Record<"critical" | "warning" | "info", string> = {
    critical: tr.scan.severity.critical,
    warning: tr.scan.severity.warning,
    info: tr.scan.severity.info,
  };

  return (
    <section className="space-y-6">
      <div className="surface-glass shine-border fade-slide-in stagger-1 relative overflow-hidden rounded-3xl p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-44 w-44 rounded-full bg-emerald-400/20 blur-3xl" />

        <h2 className="relative text-2xl font-semibold text-slate-50">{tr.scan.centerTitle}</h2>
        <p className="relative mt-2 text-sm text-slate-300">{tr.scan.stepPrefix}: {stepLabels[step]} | {tr.scan.ocrStatusPrefix}: {ocrStatus}</p>
        <p className="relative mt-2 text-xs text-cyan-100/90">{tr.scan.coverageHint}</p>

        <div className="relative mt-5 rounded-2xl border border-cyan-200/25 bg-slate-950/35 p-5">
          <p className="text-sm text-slate-300">{tr.scan.chooserHint}</p>
          <div className="mt-3 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={selectImage}
              className="rounded-xl border border-cyan-300/40 bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-50 transition hover:bg-cyan-500/35"
            >
              {tr.scan.chooseFile}
            </button>
            <button
              type="button"
              onClick={openCamera}
              className="rounded-xl border border-emerald-300/40 bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-50 transition hover:bg-emerald-500/35"
            >
              {tr.scan.openCamera}
            </button>
            <span className="rounded-full border border-slate-400/20 bg-slate-900/60 px-3 py-1 text-sm text-slate-200">
              {imageFile ? `${tr.scan.selectedFilePrefix} ${imageFile.name}` : tr.scan.noFile}
            </span>
          </div>
          <input
            ref={fileInputRef}
            className="hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => onImageChange(event.target.files?.[0] ?? null)}
          />
          <input
            ref={cameraInputRef}
            className="hidden"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => onImageChange(event.target.files?.[0] ?? null)}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={runOcr}
            className="rounded-xl border border-sky-300/40 bg-sky-500/20 px-4 py-2 text-sm font-medium text-sky-50 transition hover:bg-sky-500/35"
          >
            {tr.scan.readText}
          </button>
          <button
            type="button"
            onClick={runAnalyze}
            className="rounded-xl border border-emerald-300/40 bg-emerald-500/25 px-4 py-2 text-sm font-medium text-emerald-50 transition hover:bg-emerald-500/40 disabled:cursor-not-allowed disabled:border-emerald-900/50 disabled:bg-emerald-900/30 disabled:text-emerald-200/60"
            disabled={ingredientList.length === 0 || isAnalyzing}
          >
            {isAnalyzing ? tr.scan.analyzing : tr.scan.analyze}
          </button>
          <button
            type="button"
            onClick={resetWorkflow}
            className="rounded-xl border border-slate-300/30 bg-slate-900/40 px-4 py-2 text-sm text-slate-100 transition hover:bg-slate-800/55"
          >
            {tr.scan.reset}
          </button>
        </div>

        <label className="mt-4 block text-sm text-slate-200">
          {tr.scan.productName}
          <input
            value={productName}
            onChange={(event) => setProductName(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300/35 bg-slate-950/45 px-3 py-2 text-slate-100 outline-none ring-cyan-300/45 transition focus:ring-2"
          />
        </label>

        {step === "ocr" ? (
          <div className="mt-4 rounded-lg border border-cyan-300/30 bg-cyan-500/10 p-3 text-sm text-cyan-100">
            {tr.scan.ocrProgressPrefix}: {ocrProgress}%
          </div>
        ) : null}

        {isAnalyzing ? (
          <div className="mt-4 rounded-lg border border-emerald-300/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
            {tr.scan.analyzingHint}
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-lg border border-red-400/45 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</p>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-glass shine-border fade-slide-in stagger-2 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-slate-50">Algılanan metin önizlemesi</h3>
          <textarea
            value={ocrText}
            onChange={(event) => setOcrText(event.target.value)}
            className="mt-3 min-h-56 w-full rounded-lg border border-slate-300/35 bg-slate-950/45 px-3 py-2 text-sm text-slate-100 outline-none ring-cyan-300/45 transition focus:ring-2"
            placeholder={tr.scan.ocrPlaceholder}
          />
        </section>

        <section className="surface-glass shine-border fade-slide-in stagger-3 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-slate-50">{tr.scan.advancedIngredients}</h3>
          <div className="mt-3 max-h-56 space-y-3 overflow-auto">
            {(
              [
                [tr.scan.categories.sweetener, ingredientBuckets.sweetener],
                [tr.scan.categories.sodium, ingredientBuckets.sodium],
                [tr.scan.categories.gluten, ingredientBuckets.gluten],
                [tr.scan.categories.dairy, ingredientBuckets.dairy],
                [tr.scan.categories.additive, ingredientBuckets.additive],
                [tr.scan.categories.other, ingredientBuckets.other],
              ] as const
            ).map(([title, list]) => (
              <div key={title}>
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-200/95">{title}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {list.length > 0 ? (
                    list.map((item, index) => (
                      <span key={`${item}-${index}`} className="rounded-full border border-cyan-200/25 bg-slate-900/65 px-2 py-1 text-xs text-slate-100">
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">-</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {analysis ? (
        <section className={`surface-glass shine-border fade-slide-in rounded-2xl border p-6 ${verdictClass}`}>
          <h3 className="text-xl font-semibold">{tr.scan.resultTitle}: {analysis.verdict === "safe" ? "GÜVENLİ" : analysis.verdict === "caution" ? "DİKKAT" : "KAÇIN"}</h3>
          <p className="mt-1 text-sm opacity-90">
            {tr.scan.resultSummaryPrefix}: {analysisInsights?.resultSummary ?? (analysis.verdict === "safe" ? "Kritik veya uyarı seviyesinde profil çakışması bulunmadı." : analysis.verdict === "caution" ? "Uyarı seviyesinde profil çakışmaları tespit edildi." : "Kritik seviyede profil çakışmaları tespit edildi.")}
          </p>
          <p className="mt-2 text-sm">{tr.scan.warningCountPrefix}: {analysis.warnings.length}</p>

          {analysisInsights ? (
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <article className="rounded-xl border border-current/25 bg-slate-950/35 p-4 text-sm">
                <p className="text-xs uppercase tracking-wide opacity-80">{tr.scan.riskScore}</p>
                <p className="mt-1 text-xs text-slate-200/80">{tr.scan.riskScoreHelp}</p>
                <div className="mt-2 flex items-center gap-4">
                  <div
                    className="grid h-20 w-20 place-items-center rounded-full border border-current/20"
                    style={{
                      background: `conic-gradient(currentColor ${analysisInsights.riskScore * 3.6}deg, transparent 0deg)`,
                    }}
                  >
                    <div className="grid h-14 w-14 place-items-center rounded-full bg-slate-950 text-sm font-semibold text-slate-100">
                      {analysisInsights.riskScore}
                    </div>
                  </div>
                  <div>
                    <p>Kritik: {analysisInsights.critical}</p>
                    <p>Uyarı: {analysisInsights.warning}</p>
                    <p>Bilgi: {analysisInsights.info}</p>
                  </div>
                </div>
              </article>

              <article className="rounded-xl border border-current/25 bg-slate-950/35 p-4 text-sm">
                <p className="text-xs uppercase tracking-wide opacity-80">{tr.scan.riskDistribution}</p>
                <div className="mt-3 space-y-3">
                  <div>
                    <div className="mb-1 flex justify-between text-xs"><span>{tr.scan.critical}</span><span>{analysisInsights.bars.critical}%</span></div>
                    <div className="h-2 rounded-full bg-slate-700/60"><div className="h-2 rounded-full bg-red-400" style={{ width: `${analysisInsights.bars.critical}%` }} /></div>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs"><span>{tr.scan.warning}</span><span>{analysisInsights.bars.warning}%</span></div>
                    <div className="h-2 rounded-full bg-slate-700/60"><div className="h-2 rounded-full bg-amber-400" style={{ width: `${analysisInsights.bars.warning}%` }} /></div>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs"><span>{tr.scan.info}</span><span>{analysisInsights.bars.info}%</span></div>
                    <div className="h-2 rounded-full bg-slate-700/60"><div className="h-2 rounded-full bg-sky-400" style={{ width: `${analysisInsights.bars.info}%` }} /></div>
                  </div>
                </div>
              </article>

              <article className="rounded-xl border border-current/25 bg-slate-950/35 p-4 text-sm">
                <p className="text-xs uppercase tracking-wide opacity-80">{tr.scan.dosageSuggestion}</p>
                <p className="mt-2 leading-6">{analysisInsights.suggestion}</p>
                <div className="mt-3 space-y-1 text-xs">
                  {analysisInsights.diseaseSummary.length > 0 ? (
                    analysisInsights.diseaseSummary.map((line) => <p key={line}>{line}</p>)
                  ) : (
                    <p>{tr.scan.noConflict}</p>
                  )}
                </div>
              </article>
            </div>
          ) : null}

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <article className="rounded-lg border border-current/25 bg-slate-950/35 p-3 text-sm">
              <h4 className="font-semibold">{tr.scan.warnings}</h4>
              <p className="mt-1 text-xs text-slate-200/80">{tr.scan.warningsHelp}</p>
              <ul className="mt-2 space-y-2">
                {analysis.warnings.map((warning, index) => (
                  <li key={`${warning.ingredient}-${warning.disease}-${index}`}>
                    <span className="font-medium">{warning.ingredient}</span>{" -> "}{warning.disease} ({severityLabel[warning.severity]})
                    <p className="text-xs text-slate-200/85">{warning.reason}</p>
                  </li>
                ))}
              </ul>
            </article>
            <article className="rounded-lg border border-current/25 bg-slate-950/35 p-3 text-sm">
              <h4 className="font-semibold">{tr.scan.safeIngredients}</h4>
              <ul className="mt-2 space-y-1">
                {analysis.safeIngredients.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="rounded-lg border border-current/25 bg-slate-950/35 p-3 text-sm">
              <h4 className="font-semibold">{tr.scan.unknownIngredients}</h4>
              <p className="mt-1 text-xs text-slate-200/80">{tr.scan.unknownHelp}</p>
              <ul className="mt-2 space-y-1">
                {analysis.unknownIngredients.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>
      ) : null}
    </section>
  );
}
