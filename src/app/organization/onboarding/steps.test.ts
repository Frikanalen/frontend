import { describe, expect, it } from "vitest";
import { isOnboarded, nextStep, onboardingSteps, type OnboardingFacts } from "./steps";

const facts = (over: Partial<OnboardingFacts> = {}): OnboardingFacts => ({
  organizationId: 3,
  loggedIn: true,
  isMember: false,
  ...over,
});

const states = (over?: Partial<OnboardingFacts>) =>
  Object.fromEntries(onboardingSteps(facts(over)).map(({ id, state }) => [id, state]));

const affidavit = (over?: Partial<OnboardingFacts>) =>
  onboardingSteps(facts(over)).find(({ id }) => id === "affidavit")!;

describe("onboardingSteps", () => {
  it("asks a visitor for an account first and holds the rest back", () => {
    const steps = onboardingSteps(facts({ loggedIn: false, organizationId: null }));
    expect(nextStep(steps)?.id).toBe("account");
    expect(states({ loggedIn: false, organizationId: null })).toEqual({
      account: "todo",
      organization: "blocked",
      affidavit: "blocked",
    });
  });

  it("asks someone with an account to register the organization", () => {
    expect(nextStep(onboardingSteps(facts({ organizationId: null })))?.id).toBe("organization");
  });

  it("leaves a new organization waiting on Frikanalen, not on itself", () => {
    const steps = onboardingSteps(facts());
    expect(nextStep(steps)).toBeUndefined();
    expect(states()).toEqual({
      account: "done",
      organization: "done",
      affidavit: "waiting",
    });
    expect(isOnboarded(steps)).toBe(false);
  });

  it("offers a registered organization its own declaration to print", () => {
    expect(affidavit().actions[0]).toEqual({
      href: "/organization/3/affidavit",
      label: "Skriv ut erklæringen",
    });
    expect(affidavit({ organizationId: null }).actions[0].href).toBe("/about/join/affidavit");
  });

  it("has no separate identity step: the received declaration confirms the editor", () => {
    expect(onboardingSteps(facts()).map(({ id }) => id)).not.toContain("identity");
  });

  it("is over once membership is approved", () => {
    expect(isOnboarded(onboardingSteps(facts({ isMember: true })))).toBe(true);
  });
});
