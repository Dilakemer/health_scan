import Tesseract from "tesseract.js";

let workerPromise: Promise<Tesseract.Worker> | null = null;

async function getWorker(
  onProgress?: (progress: number, status: string) => void,
): Promise<Tesseract.Worker> {
  if (!workerPromise) {
    workerPromise = Tesseract.createWorker("tur+eng", 1, {
      logger(message) {
        if (onProgress) {
          onProgress(message.progress ?? 0, message.status ?? "processing");
        }
      },
    });
  }

  return workerPromise;
}

export async function extractText(
  imageFile: File,
  onProgress?: (progress: number, status: string) => void,
): Promise<{ text: string; confidence: number }> {
  const worker = await getWorker(onProgress);
  const result = await worker.recognize(imageFile);
  return {
    text: result.data.text,
    confidence: result.data.confidence,
  };
}

export function normalizeImageText(rawText: string): string {
  return rawText
    .normalize("NFC")
    .replace(/\r/g, "\n")
    .replace(/[\t ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function foldForMatch(value: string): string {
  return value
    .replace(/[ıİ]/g, "i")
    .replace(/[şŞ]/g, "s")
    .replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u")
    .replace(/[öÖ]/g, "o")
    .replace(/[çÇ]/g, "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const ingredientSignalPatterns = [
  /\bicindekiler\b/i,
  /\bicerik\b/i,
  /\bingredients?\b/i,
  /\bcontains?\b/i,
  /\balerjen\b/i,
  /\ballergen\b/i,
  /\be\s?\d{3}\b/i,
  /[,;:\n]/,
];

// Helps detect whether OCR text likely comes from an ingredient label.
export function isLikelyIngredientText(text: string): boolean {
  const normalized = foldForMatch(normalizeImageText(text));
  if (normalized.length < 24) {
    return false;
  }

  const signalCount = ingredientSignalPatterns.reduce(
    (count, pattern) => (pattern.test(normalized) ? count + 1 : count),
    0,
  );

  const tokenCount = normalized
    .split(/[\n,;:.()\[\]-]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2).length;

  // Keep this permissive to avoid rejecting real ingredient photos.
  return (signalCount >= 1 && tokenCount >= 6) || (signalCount >= 2 && tokenCount >= 4);
}
