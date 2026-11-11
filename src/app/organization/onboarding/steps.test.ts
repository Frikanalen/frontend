import { describe, expect, it } from "vitest";
import { isOnboarded, nextStep, onboardingSteps, type OnboardingFacts } from "./steps";

const facts = (over: Partial<OnboardingFacts> = {}): OnboardingFacts => ({
  organizationId: 3,
  loggedIn: true,
  identityConfirmed: false,
  isStaff: false,
  isMember: false,
  ...over,
});

const states = (over?: Partial<OnboardingFacts>) =>
  Object.fromEntries(onboardingSteps(facts(over)).map(({ id, state }) => [id, state]));

describe("onboardingSteps", () => {
  it("asks a visitor for an account first and holds the rest back", () => {
    const steps = onboardingSteps(facts({ loggedIn: false, organizationId: null }));
    expect(nextStep(steps)?.id).toBe("account");
    expect(states({ loggedIn: false, organizationId: null })).toEqual({
      account: "todo",
      organization: "blocked",
      affidavit: "blocked",
      identity: "blocked",
      authority: "blocked",
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
      identity: "waiting",
      authority: "self",
    });
    expect(isOnboarded(steps)).toBe(false);
  });

  it("counts staff as identified", () => {
    expect(states({ isStaff: true }).identity).toBe("done");
  });

  it("is over once membership and identity are both approved", () => {
    expect(isOnboarded(onboardingSteps(facts({ isMember: true })))).toBe(false);
    expect(isOnboarded(onboardingSteps(facts({ identityConfirmed: true })))).toBe(false);
    expect(isOnboarded(onboardingSteps(facts({ isMember: true, identityConfirmed: true })))).toBe(
      true,
    );
  });
});
