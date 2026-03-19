export type RuleSeverity = "critical" | "warning" | "info";

export type IngredientRule = {
  ingredient_name: string;
  aliases: string[];
  harmful_for: string[];
  severity: RuleSeverity;
  reason: string | null;
};

export type AnalysisResult = {
  verdict: "safe" | "caution" | "avoid";
  warnings: {
    ingredient: string;
    disease: string;
    severity: RuleSeverity;
    reason: string;
  }[];
  safeIngredients: string[];
  unknownIngredients: string[];
};

type HeuristicRule = {
  disease: string;
  severity: RuleSeverity;
  reason: string;
  keywords: string[];
};

const diseaseAliasMap: Record<string, string> = {
  "colyak": "colyak",
  "coliac": "colyak",
  "laktoz intoleransi": "laktoz intoleransi",
  "alerji fistik": "alerji fistik",
  "fistik alerjisi": "alerji fistik",
  "alerji soya": "alerji soya",
  "alerji yumurta": "alerji yumurta",
  "alerji susam": "alerji susam",
  "diyabet": "diyabet",
  "hipertansiyon": "hipertansiyon",
  "reflu": "reflu",
  "refluks": "reflu",
  "reflux": "reflu",
  "mide reflusu": "reflu",
  "gastrit": "gastrit",
  "mide hassasiyeti": "gastrit",
  "ulser": "gastrit",
};

const heuristicRules: HeuristicRule[] = [
  {
    disease: "alerji fistik",
    severity: "critical",
    reason: "Fistik/yer fistigi bazli alerjen tespit edildi.",
    keywords: [
      "yer fistigi",
      "fistik",
      "peanut",
      "groundnut",
      "arachis",
      "fistik ezmesi",
      "peanut butter",
      "peanut flour",
      "peanut protein",
      "fistik unu",
      "fistik proteini",
    ],
  },
  {
    disease: "alerji soya",
    severity: "critical",
    reason: "Soya bazli alerjen tespit edildi.",
    keywords: ["soya", "soy", "soybean", "soya unu", "soya proteini", "soya lesitini", "lecithin soy"],
  },
  {
    disease: "alerji yumurta",
    severity: "critical",
    reason: "Yumurta kaynakli alerjen tespit edildi.",
    keywords: ["yumurta", "egg", "albumin", "ovalbumin", "lizozim", "egg powder"],
  },
  {
    disease: "alerji susam",
    severity: "critical",
    reason: "Susam bazli alerjen tespit edildi.",
    keywords: ["susam", "sesame", "tahin", "sesamol", "sesame paste"],
  },
  {
    disease: "colyak",
    severity: "critical",
    reason: "Gluten kaynagi olabilecek bilesen tespit edildi.",
    keywords: ["gluten", "bugday", "arpa", "cavdar", "tritikale", "malt", "spelt", "farina", "bulgur", "seitan"],
  },
  {
    disease: "laktoz intoleransi",
    severity: "critical",
    reason: "Laktoz/sut kaynakli bilesen tespit edildi.",
    keywords: ["laktoz", "sut", "milk", "whey", "peynir alti suyu", "krema", "sutu tozu", "milk powder", "casein"],
  },
  {
    disease: "diyabet",
    severity: "warning",
    reason: "Kan sekerini etkileyebilecek tatlandirici/seker kaynagi tespit edildi.",
    keywords: [
      "seker",
      "sukroz",
      "glukoz",
      "glikoz",
      "fruktoz",
      "dekstroz",
      "maltoz",
      "surup",
      "bal",
      "maltodekstrin",
      "maltodextrin",
      "karamel",
      "aspartam",
      "sukraloz",
      "asesulfam k",
      "sorbitol",
      "xylitol",
      "ksilitol",
    ],
  },
  {
    disease: "hipertansiyon",
    severity: "warning",
    reason: "Sodyum/tuz yukunu artirabilecek bilesen tespit edildi.",
    keywords: [
      "sodyum",
      "tuz",
      "salt",
      "msg",
      "monosodyum",
      "sodium",
      "sodyum benzoat",
      "sodyum nitrit",
      "sodyum nitrat",
      "sodyum bikarbonat",
      "disodyum",
      "trisodyum",
    ],
  },
  {
    disease: "reflu",
    severity: "warning",
    reason: "Reflu semptomlarini tetikleyebilecek bilesen tespit edildi.",
    keywords: [
      "kafein",
      "caffeine",
      "kahve",
      "coffee",
      "kakao",
      "cocoa",
      "cikolata",
      "chocolate",
      "nane",
      "mint",
      "karbondioksit",
      "carbon dioxide",
      "asitlik duzenleyici",
      "sitrik asit",
      "limon",
      "portakal",
      "greyfurt",
      "acibiber",
      "chili",
      "biber",
      "sirke",
      "vinegar",
    ],
  },
  {
    disease: "gastrit",
    severity: "warning",
    reason: "Mide hassasiyetini tetikleyebilecek asidik veya irritan bilesen tespit edildi.",
    keywords: [
      "asitlik duzenleyici",
      "sitrik asit",
      "askorbik asit",
      "laktik asit",
      "fosforik asit",
      "asetik asit",
      "sirke",
      "vinegar",
      "karbondioksit",
      "gazli",
      "caffeine",
      "kafein",
      "acibiber",
      "chili",
      "baharat",
      "karabiber",
      "nane",
      "mint",
    ],
  },
];

const neutralIngredientKeywords = [
  "bitkisel yag",
  "palm",
  "aycicek",
  "pamuk",
  "kanola",
  "kabartici",
  "amonyum hidrojen karbonat",
  "sodyum hidrojen karbonat",
  "hidrojen karbonat",
  "maya",
  "yas maya",
  "un islem maddesi",
  "emulgator",
  "stabilizator",
  "kivam artirici",
  "aroma verici",
  "renklendirici",
  "su",
  "bugday unu",
  "misir unu",
  "pirinc unu",
  "yag",
  "tuz",
  "asitlik duzenleyici",
];

export function normalizeToken(value: string): string {
  return value
    .replace(/[ıİ]/g, "i")
    .replace(/[şŞ]/g, "s")
    .replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u")
    .replace(/[öÖ]/g, "o")
    .replace(/[çÇ]/g, "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalizeIngredientToken(token: string): string {
  const normalized = normalizeToken(token);

  const canonicalRules: Array<[RegExp, string]> = [
    [/\bbitkisel\s+yag\b.*\b(palm|aycicek|pamuk|kanola)\b/, "bitkisel yag"],
    [/\bpalm\s+yagi\b|\bpalm\s+oil\b/, "bitkisel yag"],
    [/\baycicek\s+yagi\b|\bsunflower\s+oil\b/, "bitkisel yag"],
    [/\bkanola\s+yagi\b|\bcanola\s+oil\b/, "bitkisel yag"],
    [/\bpamuk\s+yagi\b|\bcottonseed\s+oil\b/, "bitkisel yag"],
    [/\bkabarticilar\b|\bkabartici\b/, "kabartici"],
    [/\bamonyum\s+hidrojen\s+karbonat\b|\bammonium\s+bicarbonate\b/, "amonyum hidrojen karbonat"],
    [/\bsodyum\s+hidrojen\s+karbonat\b|\bsodium\s+bicarbonate\b|\bkarbonat\b/, "sodyum hidrojen karbonat"],
    [/\byas\s+maya\b|\bfresh\s+yeast\b/, "yas maya"],
    [/\bun\s+islem\s+maddesi\b|\bflour\s+treatment\s+agent\b/, "un islem maddesi"],
    [/(?:fruktoz\s+)?glukoz\s+surub|misir\s+surub|high\s+fructose\s+corn\s+syrup/, "fruktoz glukoz surubu"],
    [/\byer\s+fistigi\s+ezmesi\b|\bpeanut\s+butter\b/, "yer fistigi ezmesi"],
    [/\byer\s+fistigi\b|\bpeanut\b/, "yer fistigi"],
    [/\basesulfam\s*k\b|\basesulpham\s*k\b|\bacelsulfam\s*k\b|\bacesulfame\s*k\b/, "asesulfam k"],
    [/\bsukraloz\b|\bsucralose\b/, "sukraloz"],
    [/\baspartam\b|\baspartame\b/, "aspartam"],
    [/\bsitrik\s+asit\b|\bcitric\s+acid\b/, "sitrik asit"],
    [/\baskorbik\s+asit\b|\bascorbic\s+acid\b/, "askorbik asit"],
    [/\bpotasyum\s+sorbat\b|\bpotassium\s+sorbate\b/, "potasyum sorbat"],
    [/\bsodyum\s+sitrat\b|\bsodium\s+citrate\b/, "sodyum sitrat"],
    [/\btatlandirici\b|\btatlandiricilar\b/, "tatlandirici"],
    [/\bkarbondioksit\b|\bcarbon\s+dioxide\b/, "karbondioksit"],
    [/\bmonosodyum\s+glutamat\b|\bmsg\b/, "monosodyum glutamat"],
    [/\byer\s+fistigi\s+yagi\b|\bpeanut\s+oil\b/, "yer fistigi yagi"],
  ];

  for (const [pattern, replacement] of canonicalRules) {
    if (pattern.test(normalized)) {
      return replacement;
    }
  }

  return normalized;
}

function normalizeDisease(value: string): string {
  const normalized = normalizeToken(value);
  return diseaseAliasMap[normalized] ?? normalized;
}

export function parseIngredients(ocrText: string): string[] {
  const raw = ocrText.replace(/\r/g, "\n");
  const match = raw.match(/(?:i[\u0307]?[cç]indekiler|icerik|ingredients)\s*[:\-]\s*([\s\S]{0,3500})/i);

  const source = match?.[1] ?? raw;
  const stopMarker = source.search(/(?:saklama\s+ko[sş]ullar[ıi]|besin\s+degerleri|besin\s+değerleri|enerji|net\s+miktar)/i);
  const boundedSource = stopMarker > 0 ? source.slice(0, stopMarker) : source;

  const noiseWords = new Set([
    "anasayfa",
    "ulker",
    "eti",
    "www",
    "com",
    "astirmalik",
    "minikek",
    "kekstra",
    "urun",
    "icerik",
    "icindekiler",
    "içindekiler",
    "içerik",
  ]);

  const noisePatterns = [
    /icindekiler/,
    /paket\s+uzerine/,
    /kodlanmis/,
    /tuketim\s+tarihi/,
    /parti\s+no/,
    /seri\s+no/,
    /net\s+miktar/,
    /isletme\s+kayit/,
    /enerji\s+ve\s+besin/,
    /gunluk\s+karsilama/,
    /kullanilan\s+seker/,
    /veya\s+fruktoz\s+glukoz\s+surubu/,
    /seker\s+ve\s+tatland/,
    /^eb\s+/,
    /^e\s*b\s+/,
  ];

  const parsed = boundedSource
    .split(/[\n,;()|•·]/)
    .map((s) => canonicalizeIngredientToken(s))
    .map((s) => s.replace(/^\d+\s*/, "").trim())
    .map((s) => s.replace(/\b(ve|veya|ile|icin|kullanilan|kullanim)\b/g, " ").replace(/\s+/g, " ").trim())
    .filter((s) => s.length >= 2)
    .filter((s) => s.length <= 48)
    .filter((s) => !/^\d+$/.test(s))
    .filter((s) => !noiseWords.has(s))
    .filter((s) => !noisePatterns.some((pattern) => pattern.test(s)));

  return [...new Set(parsed)];
}

export function extractECodes(ingredients: string[]): string[] {
  return ingredients
    .flatMap((item) => item.match(/\bE\s?\d{3}[a-z]?\b/gi) ?? [])
    .map((item) => item.replace(/\s+/g, "").toUpperCase());
}

export function analyzeIngredients(
  ingredients: string[],
  diseases: string[],
  rules: IngredientRule[],
): AnalysisResult {
  const severityRank: Record<RuleSeverity, number> = {
    info: 1,
    warning: 2,
    critical: 3,
  };

  const getHeuristicMatches = (normalizedIngredient: string) => {
    return heuristicRules.filter((rule) => {
      if (!normalizedDiseases.includes(rule.disease)) {
        return false;
      }
      return rule.keywords.some((keyword) => normalizedIngredient.includes(normalizeToken(keyword)));
    });
  };

  const isNeutralIngredient = (normalizedIngredient: string) => {
    return neutralIngredientKeywords.some((keyword) => normalizedIngredient.includes(keyword));
  };

  const normalizedDiseases = diseases.map(normalizeDisease);
  const warnings: AnalysisResult["warnings"] = [];
  const safeIngredients: string[] = [];
  const unknownIngredients: string[] = [];

  for (const ingredient of ingredients) {
    const normalizedIngredient = normalizeToken(ingredient);
    const heuristicMatches = getHeuristicMatches(normalizedIngredient);
    const matchedRule = rules.find((rule) => {
      const options = [rule.ingredient_name, ...(rule.aliases ?? [])].map(normalizeToken);
      return options.some(
        (option) =>
          option === normalizedIngredient ||
          normalizedIngredient.includes(option) ||
          option.includes(normalizedIngredient),
      );
    });

    if (!matchedRule) {
      if (heuristicMatches.length > 0) {
        for (const heuristicMatch of heuristicMatches) {
          warnings.push({
            ingredient,
            disease: heuristicMatch.disease,
            severity: heuristicMatch.severity,
            reason: heuristicMatch.reason,
          });
        }
        continue;
      }

      if (isNeutralIngredient(normalizedIngredient)) {
        safeIngredients.push(ingredient);
        continue;
      }

      unknownIngredients.push(ingredient);
      continue;
    }

    const impactedDiseases = (matchedRule.harmful_for ?? []).map(normalizeDisease);
    const userMatches = impactedDiseases.filter((disease) =>
      normalizedDiseases.includes(disease),
    );

    const warningByDisease = new Map<string, AnalysisResult["warnings"][number]>();

    userMatches.forEach((disease) => {
      warningByDisease.set(disease, {
        ingredient,
        disease,
        severity: matchedRule.severity,
        reason: matchedRule.reason ?? "Potential conflict detected.",
      });
    });

    for (const heuristicMatch of heuristicMatches) {
      const existing = warningByDisease.get(heuristicMatch.disease);
      if (!existing || severityRank[heuristicMatch.severity] > severityRank[existing.severity]) {
        warningByDisease.set(heuristicMatch.disease, {
          ingredient,
          disease: heuristicMatch.disease,
          severity: heuristicMatch.severity,
          reason: heuristicMatch.reason,
        });
      }
    }

    if (warningByDisease.size === 0) {
      safeIngredients.push(ingredient);
      continue;
    }

    warnings.push(...warningByDisease.values());
  }

  const hasCritical = warnings.some((warning) => warning.severity === "critical");
  const hasWarning = warnings.some((warning) => warning.severity === "warning");

  return {
    verdict: hasCritical ? "avoid" : hasWarning ? "caution" : "safe",
    warnings,
    safeIngredients,
    unknownIngredients,
  };
}
