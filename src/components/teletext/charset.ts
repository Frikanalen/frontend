// Teletext character sets (ETS 300 706 §15): Latin G0 with its national options, and
// Latin G2.

// The 13 positions a national option replaces.
const NATIONAL_POSITIONS = [
  0x23, 0x24, 0x40, 0x5b, 0x5c, 0x5d, 0x5e, 0x5f, 0x60, 0x7b, 0x7c, 0x7d, 0x7e,
];

// Latin G0 national options, by C12-C14 (C12 = bit 0) within the default group.
const NATIONAL: string[] = [
  "£$@←½→↑#―¼‖¾÷", // 0 English
  "#$§ÄÖÜ^_°äöüß", // 1 German
  "#¤ÉÄÖÅÜ_éäöåü", // 2 Swedish/Finnish/Hungarian
  "£$é°ç→↑#ùàòèì", // 3 Italian
  "éïàëêùî#èâôûç", // 4 French
  "ç$¡áéíóú¿üñèà", // 5 Portuguese/Spanish
  "#ůčťžýířéáěúš", // 6 Czech/Slovak
  "£$@←½→↑#―¼‖¾÷", // 7 (unused)
];

/** A G0 code (0x20-0x7F) as Unicode, with national option `national` (-1 = none). */
export const g0 = (code: number, national: number): string => {
  if (code === 0x7f) return "■";
  if (national >= 0) {
    const i = NATIONAL_POSITIONS.indexOf(code);
    if (i >= 0) return NATIONAL[national & 7][i];
  }
  return String.fromCharCode(code);
};

// Latin G2, 0x20-0x7F. Column 4 holds the non-spacing diacritical marks (as combining
// characters); unassigned positions are spaces.
const G2 =
  " ¡¢£$¥#§¤‘“«←↑→↓" +
  "°±²³×µ¶·÷’”»¼½¾¿" +
  " ̧̨̣̲̀́̂̃̄̆̇̈̊̋̌" +
  "―¹®©™♪₠‰α   ⅛⅜⅝⅞" +
  "ΩÆĐªĦ ĲĿŁØŒºÞŦŊŉ" +
  "ĸæđðħıĳŀłøœßþŧŋ■";

export const g2 = (code: number): string => G2[(code & 0x7f) - 0x20] ?? " ";

/** A G0 character with the diacritical mark from G2 column 4 (1-15). */
export const withDiacritic = (code: number, mark: number): string => {
  const base = g0(code, -1);
  if (mark === 0) return base;
  return (base + G2[0x20 + mark]).normalize("NFC");
};
