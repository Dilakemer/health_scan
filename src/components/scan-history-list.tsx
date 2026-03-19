"use client";

import { useState } from "react";
import { tr } from "@/i18n/tr";

type ScanItem = {
  id: string;
  product_name: string | null;
  verdict: "safe" | "caution" | "avoid";
  created_at: string;
  image_url: string | null;
};

type ScanHistoryListProps = {
  initialItems: ScanItem[];
};

export function ScanHistoryList({ initialItems }: ScanHistoryListProps) {
  const [items, setItems] = useState(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const startEdit = (item: ScanItem) => {
    setError("");
    setEditingId(item.id);
    setEditingName(item.product_name ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEdit = async (id: string) => {
    setBusyId(id);
    setError("");

    const response = await fetch(`/api/history/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productName: editingName.trim() || tr.history.unknownProduct }),
    });

    setBusyId(null);
    if (!response.ok) {
      setError(tr.history.updateFailed);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, product_name: editingName.trim() || tr.history.unknownProduct } : item,
      ),
    );
    setEditingId(null);
    setEditingName("");
  };

  const removeItem = async (id: string) => {
    setBusyId(id);
    setError("");

    const response = await fetch(`/api/history/${id}`, { method: "DELETE" });

    setBusyId(null);
    if (!response.ok) {
      setError(tr.history.deleteFailed);
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const verdictClass: Record<ScanItem["verdict"], string> = {
    safe: "bg-emerald-100 text-emerald-800",
    caution: "bg-amber-100 text-amber-800",
    avoid: "bg-red-100 text-red-800",
  };

  const verdictLabel: Record<ScanItem["verdict"], string> = {
    safe: "GÜVENLİ",
    caution: "DİKKAT",
    avoid: "KAÇIN",
  };

  return (
    <div className="mt-4">
      {error ? <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">{new Date(item.created_at).toLocaleString("tr-TR")}</p>

            {editingId === item.id ? (
              <div className="mt-2 space-y-2">
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => saveEdit(item.id)}
                    disabled={busyId === item.id}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:bg-emerald-300"
                  >
                    {tr.history.save}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                  >
                    {tr.history.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-1 font-medium text-slate-900">{item.product_name ?? tr.history.unknownProduct}</p>
            )}

            <div className="mt-2 flex items-center gap-2">
              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${verdictClass[item.verdict]}`}>
                {verdictLabel[item.verdict]}
              </span>
              <span className="text-sm text-slate-700">{tr.history.result}</span>
            </div>

            {item.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image_url} alt="scan" className="mt-3 h-24 w-full rounded-lg object-cover" />
            ) : null}

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => startEdit(item)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50"
              >
                {tr.history.edit}
              </button>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                disabled={busyId === item.id}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700 disabled:bg-red-300"
              >
                {tr.history.delete}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
