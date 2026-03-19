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
