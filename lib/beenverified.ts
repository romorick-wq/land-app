export type BeenVerifiedPerson = {
  label: string;
  first: string;
  last: string;
};

const ENTITY = /\b(llc|lllc|inc|corp|company|trust|ranch|farms|properties|livestock|blm|state of nevada)\b/i;

function significantWords(value: string) {
  return value
    .replace(/\./g, " ")
    .replace(/[^a-zA-Z\s'-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !/^(jr|sr|ii|iii|iv)$/i.test(word));
}

export function beenVerifiedPeople(name: string): BeenVerifiedPerson[] {
  const parenthetical = [...name.matchAll(/\(([^)]+)\)/g)].map((match) => match[1]);
  const body = name.replace(/\([^)]*\)/g, " ").replace(/,?\s*et al\.?/gi, " ");
  const chunks = body
    .split(/\s+and\s+|\s*&\s+/i)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
  const people: BeenVerifiedPerson[] = [];
  const seen = new Set<string>();

  function add(first: string, last: string) {
    if (first.length < 2 || last.length < 2) return;
    const key = `${first} ${last}`.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    people.push({ label: `${first} ${last}`, first, last });
  }

  const named = chunks
    .map((chunk) => chunk.replace(/\b(revocable|irrevocable|living|family)\s+trust\b/gi, "").replace(/\btrust\b/gi, "").trim())
    .filter((chunk) => chunk && !ENTITY.test(chunk))
    .map(significantWords);
  const sharedLast = [...named].reverse().find((words) => words.length >= 2)?.at(-1) ?? null;
  for (const words of named) {
    if (words.length >= 2) add(words[0], words[words.length - 1]);
    else if (words.length === 1 && sharedLast) add(words[0], sharedLast);
  }
  for (const inside of parenthetical) {
    const words = significantWords(inside);
    if (words.length >= 2) add(words[0], words[words.length - 1]);
  }
  return people;
}

export function beenVerifiedSearchUrl(person: BeenVerifiedPerson) {
  const params = new URLSearchParams({
    fname: person.first,
    lname: person.last,
    state: "NV",
  });
  return `https://www.beenverified.com/people/?${params.toString()}`;
}

export const BEENVERIFIED_HOME = "https://www.beenverified.com/people/";
