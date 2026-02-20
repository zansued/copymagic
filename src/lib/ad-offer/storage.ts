import type { ImportedAd, KeywordPackage, Modifier, NegativeWord } from "./types";
import { defaultKeywordPackages, defaultModifiers, defaultNegativeWords } from "./keywords-data";

const KEYS = {
  ads: "adoffer_ads",
  packages: "adoffer_packages",
  modifiers: "adoffer_modifiers",
  negatives: "adoffer_negatives",
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

export const storage = {
  getAds: (): ImportedAd[] => load(KEYS.ads, []),
  saveAds: (ads: ImportedAd[]) => save(KEYS.ads, ads),
  addAd: (ad: ImportedAd) => {
    const ads = storage.getAds();
    ads.push(ad);
    storage.saveAds(ads);
  },
  updateAd: (ad: ImportedAd) => {
    const ads = storage.getAds().map((a) => (a.id === ad.id ? ad : a));
    storage.saveAds(ads);
  },
  deleteAd: (id: string) => {
    storage.saveAds(storage.getAds().filter((a) => a.id !== id));
  },

  getPackages: (): KeywordPackage[] => load(KEYS.packages, defaultKeywordPackages),
  savePackages: (p: KeywordPackage[]) => save(KEYS.packages, p),

  getModifiers: (): Modifier[] => load(KEYS.modifiers, defaultModifiers),
  saveModifiers: (m: Modifier[]) => save(KEYS.modifiers, m),

  getNegatives: (): NegativeWord[] => load(KEYS.negatives, defaultNegativeWords),
  saveNegatives: (n: NegativeWord[]) => save(KEYS.negatives, n),
};
