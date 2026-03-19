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
  "genel saglik": "genel saglik",
  "general health": "genel saglik",
};

type UniversalHazardRule = {
  severity: RuleSeverity;
  reason: string;
  keywords: string[];
};

type ApproximateRuleMatch = {
  rule: IngredientRule;
  matchedOption: string;
};

const universalHazardRules: UniversalHazardRule[] = [
  {
    severity: "critical",
    reason: "Trans yag veya kismen hidrojenize yag ifadesi genel saglik icin yuksek risk tasir.",
    keywords: [
      "trans yag",
      "trans fat",
      "kismen hidrojenize",
      "partially hydrogenated",
      "hidrojenize bitkisel yag",
    ],
  },
  {
    severity: "warning",
    reason: "Nitrit/nitrat turu koruyucularin sik tuketimi genel saglik riski tasiyabilir.",
    keywords: ["sodyum nitrit", "sodyum nitrat", "nitrit", "nitrat", "e250", "e251", "e252"],
  },
  {
    severity: "warning",
    reason: "Yuksek fruktozlu veya rafine seker bazli suruplarin sik tuketimi genel saglik riski olusturabilir.",
    keywords: ["fruktoz glukoz surubu", "high fructose corn syrup", "misir surubu", "invert seker surubu"],
  },
  {
    severity: "warning",
    reason: "Yapay tatlandiricilarin sik tuketimi genel saglik icin onerilmez.",
    keywords: ["aspartam", "sukraloz", "asesulfam k", "sakkarin", "acesulfame k", "sucralose"],
  },
];

const ultraProcessedInfoRules = [
  {
    reason: "Ultra-islenmis urun gostergesi olarak tatlandirici ifadesi bulundu.",
    keywords: ["tatlandirici", "sukraloz", "aspartam", "asesulfam k", "sakkarin"],
  },
  {
    reason: "Ultra-islenmis urun gostergesi olarak koruyucu ifadesi bulundu.",
    keywords: ["koruyucu", "sodyum benzoat", "potasyum sorbat", "nitrit", "nitrat"],
  },
  {
    reason: "Ultra-islenmis urun gostergesi olarak renklendirici ifadesi bulundu.",
    keywords: ["renklendirici", "karamel", "beta karoten", "e1", "e12"],
  },
  {
    reason: "Ultra-islenmis urun gostergesi olarak aroma verici ifadesi bulundu.",
    keywords: ["aroma", "aroma verici", "flavouring"],
  },
  {
    reason: "Ultra-islenmis urun gostergesi olarak kivam arttirici ifadesi bulundu.",
    keywords: ["kivam arttirici", "gum", "akasya gami", "emulgator", "stabilizator"],
  },
] as const;

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
  "antioksidan",
  "renk sabitleyici",
  "nem verici",
  "dolgu maddesi",
  "islem yardimcisi",
  "beta karoten",
  "karoten",
  "akasya gami",
  "gum arabic",
  "aroma",
  "dogal aroma",
  "meyve suyu konsantresi",
  "potasyum sorbat",
  "sodyum sitrat",
  "izobutirat",
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

function toWords(value: string): string[] {
  return normalizeToken(value)
    .split(" ")
    .filter((part) => part.length >= 2);
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const dp: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
      prev = temp;
    }
  }

  return dp[b.length];
}

function similarityScore(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;

  if ((a.includes(b) || b.includes(a)) && Math.min(a.length, b.length) >= 5) {
    return 0.9;
  }

  const aWords = toWords(a);
  const bWords = toWords(b);

  if (aWords.length > 0 && bWords.length > 0) {
    const aSet = new Set(aWords);
    const bSet = new Set(bWords);
    let overlap = 0;
    aSet.forEach((word) => {
      if (bSet.has(word)) overlap += 1;
    });

    if (overlap > 0) {
      const denom = Math.max(aSet.size, bSet.size);
      return overlap / denom;
    }
  }

  const dist = levenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length);
  return maxLen === 0 ? 0 : 1 - dist / maxLen;
}

function findApproximateRuleMatch(normalizedIngredient: string, rules: IngredientRule[]): ApproximateRuleMatch | null {
  let best: ApproximateRuleMatch | null = null;
  let bestScore = 0;

  for (const rule of rules) {
    const options = [rule.ingredient_name, ...(rule.aliases ?? [])].map(normalizeToken);
    for (const option of options) {
      const score = similarityScore(normalizedIngredient, option);
      if (score > bestScore) {
        bestScore = score;
        best = { rule, matchedOption: option };
      }
    }
  }

  return bestScore >= 0.84 ? best : null;
}

function isApproxNeutralIngredient(normalizedIngredient: string): boolean {
  return neutralIngredientKeywords.some((keyword) =>
    similarityScore(normalizedIngredient, normalizeToken(keyword)) >= 0.86,
  );
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
    [/\bkoruyucu\b|\bkoruyucular\b|\bpreservative\b/, "koruyucu"],
    [/\bantioksidan\b|\bantioksidanlar\b|\bantioxidant\b/, "antioksidan"],
    [/\bkivam\s+arttirici\b|\bkivam\s+artirici\b|\bthickener\b/, "kivam arttirici"],
    [/\baroma\s+verici\b|\baroma\s+vericiler\b|\bflavouring\b/, "aroma verici"],
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
    /meyve\s+orani\s+en\s+az/,
    /meyve\s+orani/,
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

  const getUniversalHazardMatches = (normalizedIngredient: string) => {
    return universalHazardRules.filter((rule) =>
      rule.keywords.some((keyword) => normalizedIngredient.includes(normalizeToken(keyword))),
    );
  };

  const getUltraProcessedInfoMatches = (normalizedIngredient: string) => {
    return ultraProcessedInfoRules.filter((rule) =>
      rule.keywords.some((keyword) => normalizedIngredient.includes(normalizeToken(keyword))),
    );
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
    const universalHazards = getUniversalHazardMatches(normalizedIngredient);
    const ultraProcessedInfoMatches = getUltraProcessedInfoMatches(normalizedIngredient);

    let matchedRule = rules.find((rule) => {
      const options = [rule.ingredient_name, ...(rule.aliases ?? [])].map(normalizeToken);
      return options.some(
        (option) => {
          if (option === normalizedIngredient) {
            return true;
          }

          if (option.length < 4 || normalizedIngredient.length < 4) {
            return false;
          }

          return (
            normalizedIngredient.includes(option) ||
            option.includes(normalizedIngredient)
          );
        },
      );
    });

    let approximateMatch: ApproximateRuleMatch | null = null;
    if (!matchedRule) {
      approximateMatch = findApproximateRuleMatch(normalizedIngredient, rules);
      if (approximateMatch) {
        matchedRule = approximateMatch.rule;
      }
    }

    if (!matchedRule) {
      if (universalHazards.length > 0) {
        for (const hazard of universalHazards) {
          warnings.push({
            ingredient,
            disease: "genel saglik",
            severity: hazard.severity,
            reason: hazard.reason,
          });
        }
        continue;
      }

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

      if (ultraProcessedInfoMatches.length > 0) {
        for (const infoMatch of ultraProcessedInfoMatches) {
          warnings.push({
            ingredient,
            disease: "genel saglik",
            severity: "info",
            reason: infoMatch.reason,
          });
        }
        continue;
      }

      if (isNeutralIngredient(normalizedIngredient) || isApproxNeutralIngredient(normalizedIngredient)) {
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
        reason: matchedRule.reason ?? "Olası içerik çakışması tespit edildi.",
      });
    });

    if (impactedDiseases.includes("genel saglik")) {
      warningByDisease.set("genel saglik", {
        ingredient,
        disease: "genel saglik",
        severity: matchedRule.severity,
        reason: matchedRule.reason ?? "Genel saglik acisindan dikkat gerektiren bilesen.",
      });
    }

    for (const hazard of universalHazards) {
      const existing = warningByDisease.get("genel saglik");
      if (!existing || severityRank[hazard.severity] > severityRank[existing.severity]) {
        warningByDisease.set("genel saglik", {
          ingredient,
          disease: "genel saglik",
          severity: hazard.severity,
          reason: hazard.reason,
        });
      }
    }

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
      if (ultraProcessedInfoMatches.length > 0) {
        for (const infoMatch of ultraProcessedInfoMatches) {
          warningByDisease.set(`genel saglik:${infoMatch.reason}`, {
            ingredient,
            disease: "genel saglik",
            severity: "info",
            reason: infoMatch.reason,
          });
        }
      }
    }

    if (warningByDisease.size === 0) {
      safeIngredients.push(ingredient);
      continue;
    }

    if (approximateMatch) {
      for (const [key, warning] of warningByDisease.entries()) {
        warningByDisease.set(key, {
          ...warning,
          reason: `${warning.reason} (Yakin eslesme: ${approximateMatch.matchedOption})`,
        });
      }
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
