"use client";

import { useMemo, useState } from "react";
import { tr } from "@/i18n/tr";

const defaultDiseases = [
  { value: "diyabet", label: "Diyabet" },
  { value: "hipertansiyon", label: "Hipertansiyon" },
  { value: "reflu", label: "Reflü" },
  { value: "gastrit", label: "Gastrit / Mide hassasiyeti" },
  { value: "laktoz intoleransi", label: "Laktoz intoleransı" },
  { value: "colyak", label: "Çölyak" },
  { value: "alerji soya", label: "Alerji: Soya" },
  { value: "alerji fistik", label: "Alerji: Fıstık" },
  { value: "alerji yumurta", label: "Alerji: Yumurta" },
  { value: "alerji susam", label: "Alerji: Susam" },
];

type ProfileFormProps = {
  initialDiseases: string[];
  initialAllergies: string[];
};

export function ProfileForm({ initialDiseases, initialAllergies }: ProfileFormProps) {
  const [selectedDiseases, setSelectedDiseases] = useState<string[]>(initialDiseases);
  const [allergiesInput, setAllergiesInput] = useState(initialAllergies.join(", "));
  const [status, setStatus] = useState<string>("");

  const diseaseOptions = useMemo(() => defaultDiseases, []);

  const toggleDisease = (disease: string) => {
    setSelectedDiseases((prev) =>
      prev.includes(disease) ? prev.filter((item) => item !== disease) : [...prev, disease],
    );
  };

  const saveProfile = async () => {
    setStatus(tr.profile.saving);
    const allergies = allergiesInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ diseases: selectedDiseases, allergies }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: unknown };
      setStatus(`${tr.profile.errorPrefix} ${String(payload.error ?? "Bilinmeyen hata")}`);
      return;
    }

    setStatus(tr.profile.saved);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{tr.profile.title}</h2>
      <p className="mt-1 text-sm text-slate-600">{tr.profile.subtitle}</p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {diseaseOptions.map((disease) => (
          <label
            key={disease.value}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
          >
            <input
              type="checkbox"
              checked={selectedDiseases.includes(disease.value)}
              onChange={() => toggleDisease(disease.value)}
              className="h-4 w-4 accent-emerald-600"
            />
            <span>{disease.label}</span>
          </label>
        ))}
      </div>

      <label className="mt-4 block text-sm text-slate-700">
        {tr.profile.extraAllergies}
        <textarea
          value={allergiesInput}
          onChange={(event) => setAllergiesInput(event.target.value)}
          className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-emerald-200 focus:ring"
        />
      </label>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={saveProfile}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          {tr.profile.save}
        </button>
        <span className="text-sm text-slate-600">{status}</span>
      </div>
    </section>
  );
}
