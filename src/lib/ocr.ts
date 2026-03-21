import Tesseract from "tesseract.js";

let workerInstance: Tesseract.Worker | null = null;
let workerInitializing: Promise<Tesseract.Worker> | null = null;

async function getWorker(): Promise<Tesseract.Worker> {
  if (workerInstance) {
    return workerInstance;
  }

  if (workerInitializing) {
    return workerInitializing;
  }

  workerInitializing = Tesseract.createWorker("tur+eng", 1).then((worker) => {
    workerInstance = worker;
    workerInitializing = null;
    return worker;
  });

  return workerInitializing;
}

export async function extractText(
  imageFile: File,
  onProgress?: (progress: number, status: string) => void,
): Promise<{ text: string; confidence: number }> {
  // Kamera görüntüleri (özellikle mobil) için görsel ön işleme:
  // - Yüksek çözünürlüklü kamera görüntülerini ölçekle (Tesseract performansı için)
  const processedBlob = await preprocessImage(imageFile);

  const worker = await getWorker();

  // Her çağrı için progress listener'ı güncellemek amacıyla tanımlama
  let progressInterval: ReturnType<typeof setInterval> | undefined;
  let isDone = false;

  if (onProgress) {
    let fakeProgress = 0;
    onProgress(0, "initializing");
    progressInterval = setInterval(() => {
      if (isDone) {
        clearInterval(progressInterval);
        return;
      }
      fakeProgress = Math.min(fakeProgress + 0.05, 0.85);
      onProgress(fakeProgress, "recognizing");
    }, 200);
  }

  try {
    const result = await worker.recognize(processedBlob);
    isDone = true;
    if (progressInterval !== undefined) clearInterval(progressInterval);
    onProgress?.(1, "done");
    return {
      text: result.data.text,
      confidence: result.data.confidence,
    };
  } catch (err) {
    isDone = true;
    if (progressInterval !== undefined) clearInterval(progressInterval);
    // Worker bozulmuş olabilir; sıfırla
    workerInstance = null;
    throw err;
  }
}

/**
 * Kamera görüntülerini Tesseract için optimize eder:
 * - Çok büyük görüntüleri yeniden boyutlandırır (büyük boyutlar yavaşlatır)
 * - HEIC / HEIF gibi desteklenmeyen formatları JPEG'e dönüştürür
 */
async function preprocessImage(file: File): Promise<Blob> {
  const MAX_SIDE = 2400;
  const supportedTypes = ["image/jpeg", "image/png", "image/webp"];

  const needsConvert = !supportedTypes.includes(file.type);

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      const { width, height } = img;
      let targetW = width;
      let targetH = height;

      if (width > MAX_SIDE || height > MAX_SIDE) {
        if (width >= height) {
          targetW = MAX_SIDE;
          targetH = Math.round((height / width) * MAX_SIDE);
        } else {
          targetH = MAX_SIDE;
          targetW = Math.round((width / height) * MAX_SIDE);
        }
      }

      // Yeniden boyutlandırma ya da format dönüşümü gerekmiyorsa orijinali kullan
      if (targetW === width && targetH === height && !needsConvert) {
        resolve(file);
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, targetW, targetH);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        0.92,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // hata durumunda orijinali kullan
    };

    img.src = url;
  });
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
  if (normalized.length < 20) {
    return false;
  }

  const signalCount = ingredientSignalPatterns.reduce(
    (count, pattern) => (pattern.test(normalized) ? count + 1 : count),
    0,
  );

  const tokenCount = normalized
    .split(/[\n,;:.()[\]-]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2).length;

  // Kamera görüntüleri için daha esnek eşik
  return (signalCount >= 1 && tokenCount >= 4) || (signalCount >= 2 && tokenCount >= 3);
}
