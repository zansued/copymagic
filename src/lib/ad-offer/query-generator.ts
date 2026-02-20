import type { KeywordPackage, Modifier, GeneratedQuery } from "./types";

export function generateQueries(
  pkg: KeywordPackage,
  modifiers: Modifier[],
  maxQueries: number = 50
): GeneratedQuery[] {
  const queries: GeneratedQuery[] = [];
  const activeModifiers = modifiers.filter((m) => m.enabled).map((m) => m.word);

  for (const kw of pkg.keywordsBase) {
    if (queries.length >= maxQueries) break;
    queries.push({ text: `"${kw}"`, copied: false });
  }

  for (const kw of pkg.keywordsBase.slice(0, 8)) {
    for (const mod of activeModifiers.slice(0, 3)) {
      if (queries.length >= maxQueries) break;
      if (!kw.toLowerCase().includes(mod.toLowerCase())) {
        queries.push({ text: `"${kw}" ${mod}`, copied: false });
      }
    }
  }

  const groups: string[][] = [];
  for (let i = 0; i < pkg.keywordsBase.length; i += 3) {
    groups.push(pkg.keywordsBase.slice(i, i + 3));
  }
  for (const group of groups.slice(0, 5)) {
    if (queries.length >= maxQueries) break;
    const orQuery = group.map((k) => `"${k}"`).join(" OR ");
    queries.push({ text: `(${orQuery})`, copied: false });
  }

  for (const tc of pkg.termosComplementares) {
    if (queries.length >= maxQueries) break;
    queries.push({ text: `"${tc}"`, copied: false });
  }

  return queries.slice(0, maxQueries);
}
