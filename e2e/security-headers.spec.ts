import { expect, test } from "@playwright/test";
import { stubApi } from "./support/api";

/**
 * The Content-Security-Policy keeps the site to its own origin. Whether it is
 * enforced or report-only, the browser fires `securitypolicyviolation` for
 * anything it would block, so these pages must load without a single one.
 */
const PAGES = ["/", "/login", "/register", "/schedule", "/about"];

test.describe("content security policy", () => {
  test.beforeEach(async ({ page }) => {
    await stubApi(page);
    await page.addInitScript(() => {
      const violations: string[] = [];
      (window as unknown as { cspViolations: string[] }).cspViolations = violations;
      document.addEventListener("securitypolicyviolation", (event) => {
        violations.push(
          `${event.effectiveDirective} ${event.blockedURI} ${event.sourceFile}:${event.lineNumber}:${event.columnNumber}`,
        );
      });
    });
  });

  test("is sent with every page", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response?.headers() ?? {};
    const policy =
      headers["content-security-policy"] ?? headers["content-security-policy-report-only"];

    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("frame-ancestors 'none'");
  });

  for (const path of PAGES) {
    test(`allows everything ${path} loads`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");

      const violations = await page.evaluate(
        () => (window as unknown as { cspViolations: string[] }).cspViolations,
      );
      expect(violations).toEqual([]);
    });
  }
});
