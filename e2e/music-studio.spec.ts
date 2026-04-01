import { test, expect } from "@playwright/test";

const email = process.env.E2E_TEST_EMAIL?.trim();
const password = process.env.E2E_TEST_PASSWORD?.trim();

/** When not "0" or "false", stub POST /api/generate/music so Replicate is not required. */
const mockGenerateMusic =
  process.env.E2E_MOCK_GENERATE_MUSIC !== "0" &&
  process.env.E2E_MOCK_GENERATE_MUSIC !== "false";

/** Short public MP3 for WaveSurfer after mock (must allow cross-origin fetch). */
const MOCK_AUDIO_URL =
  process.env.E2E_MOCK_AUDIO_URL?.trim() ||
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

test.describe("Music studio", () => {
  test("redirects anonymous users to login", async ({ page }) => {
    await page.goto("/studio/music", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/login/, { timeout: 25_000 });
  });

  test("new project: generate updates URL and opens workspace; existing project URL loads", async ({
    page,
  }) => {
    test.skip(
      !email || !password,
      "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD in .env.local (see .env.example)."
    );

    const projectName = `E2E ${Date.now()}`;

    if (mockGenerateMusic) {
      await page.route("**/api/generate/music", async (route) => {
        if (route.request().method() !== "POST") {
          await route.continue();
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ url: MOCK_AUDIO_URL }),
        });
      });
    }

    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.fill("#identifier", email!);
    await page.fill("#password", password!);
    await Promise.all([
      page.waitForURL(/\/dashboard/, { timeout: 60_000 }),
      page.getByRole("button", { name: "Log in" }).click(),
    ]);

    await page.goto("/studio/music", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "New project" })).toBeVisible({
      timeout: 25_000,
    });

    await page.fill("#music-studio-project-name", projectName);
    await page.fill(
      "#music-studio-track-description",
      "E2E chill lo-fi beat with soft drums for automated testing, instrumental only, ninety BPM feel, no vocals."
    );

    await page.getByRole("button", { name: "Generate Beat" }).click();

    await expect(page).toHaveURL(/\/studio\/music\?project=[0-9a-f-]{10,}/i, {
      timeout: 90_000,
    });

    await expect(page.getByRole("heading", { name: projectName })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("Music Studio · generation")).toBeVisible();

    if (mockGenerateMusic) {
      await expect(
        page.getByRole("heading", { name: "Version history" })
      ).toBeVisible({ timeout: 120_000 });
    }

    const u = new URL(page.url());
    const projectId = u.searchParams.get("project");
    expect(projectId).toBeTruthy();

    await page.goto("/studio/music", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "New project" })).toBeVisible();

    await page.goto(`/studio/music?project=${projectId}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByRole("heading", { name: projectName })).toBeVisible({
      timeout: 25_000,
    });
    await expect(page.getByRole("button", { name: "Generate Beat" })).toBeVisible();
  });
});
