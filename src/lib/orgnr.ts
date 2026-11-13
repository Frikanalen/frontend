// Norwegian organisasjonsnummer: nine digits, the last a modulus 11 check
// digit over the first eight. Django checks the same way before it asks
// Brønnøysundregistrene or saves the number.

const WEIGHTS = [3, 2, 7, 6, 5, 4, 3, 2];

/** The number without the spaces people write it with ("971 526 920"). */
export const normalizeOrgnr = (value: string) => value.replace(/\s+/g, "");

export const isValidOrgnr = (value: string) => {
  if (!/^\d{9}$/.test(value)) return false;
  const sum = WEIGHTS.reduce((acc, weight, i) => acc + weight * Number(value[i]), 0);
  const check = (11 - (sum % 11)) % 11;
  // A check digit of 10 is impossible, so such numbers are never issued.
  return check !== 10 && check === Number(value[8]);
};
