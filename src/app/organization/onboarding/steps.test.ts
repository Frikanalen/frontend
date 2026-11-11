import { describe, expect, it } from "vitest";
import { isOnboarded, nextStep, onboardingSteps, type OnboardingFacts } from "./steps";

const facts = (over: Partial<OnboardingFacts> = {}): OnboardingFacts => ({
  organizationId: 3,
  loggedIn: true,
  identityConfirmed: false,
  isStaff: false,
  isMember: false,
  videoCount: 0,
  grantCount: 0,
  ...over,
});

const states = (over?: Partial<OnboardingFacts>) =>
  Object.fromEntries(onboardingSteps(facts(over)).map(({ id, state }) => [id, state]));

describe("onboardingSteps", () => {
  it("asks a visitor for an account first and holds the rest back", () => {
    expect(states({ loggedIn: false, organizationId: null })).toEqual({
      account: "todo",
      organization: "blocked",
      video: "blocked",
      affidavit: "blocked",
      identity: "blocked",
      authority: "blocked",
      airtime: "blocked",
    });
  });

  it("sends a new organization straight to its first upload", () => {
    const steps = onboardingSteps(facts());
    expect(nextStep(steps)?.id).toBe("video");
    expect(states()).toMatchObject({
      organization: "done",
      affidavit: "waiting",
      identity: "waiting",
      authority: "self",
      airtime: "blocked",
    });
  });

  it("keeps airtime closed until both membership and identity are in place", () => {
    expect(states({ isMember: true }).airtime).toBe("blocked");
    expect(states({ identityConfirmed: true }).airtime).toBe("blocked");
    expect(states({ isMember: true, identityConfirmed: true }).airtime).toBe("waiting");
  });

  it("counts staff as identified", () => {
    expect(states({ isStaff: true }).identity).toBe("done");
  });

  it("points at the schedule once airtime has been granted", () => {
    const steps = onboardingSteps(
      facts({ isMember: true, identityConfirmed: true, videoCount: 2, grantCount: 1 }),
    );
    expect(nextStep(steps)?.id).toBe("airtime");
    expect(steps.at(-1)?.actions[0].href).toBe("/organization/3/schedule");
    expect(isOnboarded(steps)).toBe(true);
  });

  it("is not over while Frikanalen still has to approve something", () => {
    expect(isOnboarded(onboardingSteps(facts({ videoCount: 1 })))).toBe(false);
  });
});
