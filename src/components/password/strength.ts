"use client";
import { useEffect, useState } from "react";

export type Score = 0 | 1 | 2 | 3 | 4;

/** Below this, a form refuses the password before it reaches the API. */
export const MIN_SCORE: Score = 2;
export const TOO_WEAK = "Passordet er for lett å gjette. Prøv flere ord, gjerne en hel setning.";

type Checker = (_password: string, _userInputs: string[]) => Score;

let checker: Promise<Checker> | null = null;

/**
 * zxcvbn with its common-password and keyboard-pattern dictionaries is about
 * a megabyte, so it is only fetched once a password field is in use, and
 * only once per page load.
 */
const loadChecker = () => {
  checker ??= Promise.all([import("@zxcvbn-ts/core"), import("@zxcvbn-ts/language-common")]).then(
    ([{ ZxcvbnFactory }, common]) => {
      const zxcvbn = new ZxcvbnFactory({
        dictionary: { ...common.dictionary },
        graphs: common.adjacencyGraphs,
      });
      return (password, userInputs) => zxcvbn.check(password, userInputs).score as Score;
    },
  );
  return checker;
};

/**
 * An estimate of how guessable a password is, from 0 to 4, or null while the
 * field is empty or the estimator is still loading.
 *
 * Advice for the person typing, not the rule: the API decides, and it also
 * refuses passwords found in known breaches, which this cannot know.
 * `userInputs` (email, names) count as guessable words.
 */
export const usePasswordStrength = (password: string, userInputs: string[] = []) => {
  const [result, setResult] = useState<{ password: string; score: Score } | null>(null);
  const inputs = userInputs.join("\u0000");

  useEffect(() => {
    if (!password) return;
    let current = true;
    void loadChecker().then((check) => {
      if (current)
        setResult({ password, score: check(password, inputs ? inputs.split("\u0000") : []) });
    });
    return () => {
      current = false;
    };
  }, [password, inputs]);

  // A verdict on what was typed before is no verdict on what is there now.
  return result && result.password === password ? result.score : null;
};
