import { describe, expect, it } from "vitest";
import { studioHref } from "./studio";

const org = (id: number) => ({ id, name: `Org ${id}` });

describe("studioHref", () => {
  it("has nowhere to go for someone in no organization", () => {
    expect(studioHref({ memberOf: [], editorOf: [] })).toBeNull();
  });

  it("goes straight to the tools of an only organization", () => {
    // Editor and member of the same one is still one organization.
    expect(studioHref({ memberOf: [org(7)], editorOf: [org(7)] })).toBe("/organization/7/admin");
  });

  it("leaves the choice to Min side when there are several", () => {
    expect(studioHref({ memberOf: [org(7)], editorOf: [org(9)] })).toBe(
      "/profile#organizations-heading",
    );
  });
});
