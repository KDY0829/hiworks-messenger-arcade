export function initials(syllable: string): string[] {
  const code = syllable.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return [syllable];
  const consonant = Math.floor(code / 588), vowel = Math.floor((code % 588) / 28), tail = code % 28;
  const result = [syllable];
  if (consonant === 5) result.push(String.fromCharCode(0xac00 + ([2,6,7,12,17,20].includes(vowel) ? 11 : 2) * 588 + vowel * 28 + tail));
  if (consonant === 2 && [6,12,17,20].includes(vowel)) result.push(String.fromCharCode(0xac00 + 11 * 588 + vowel * 28 + tail));
  return result;
}
