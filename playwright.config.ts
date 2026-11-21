import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run against the BUILT static site (out/), served the way GitHub Pages
// serves it, in two phone-sized browsers: Chrome, and WebKit at the size of mother's iPhone. Run with: npm run test:e2e
export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
    serviceWorkers: "allow",
  },
  projects: [
    {
      // Uses the Google Chrome already installed on this computer, so nothing has to be downloaded.
      // Set PW_CHANNEL=chromium to use Playwright's own browser instead (npx playwright install chromium).
      name: "chrome",
      use: { ...devices["Pixel 7"], channel: process.env.PW_CHANNEL ?? "chrome" },
    },
    {
      // Mother's phone: iPhone 14 Pro Max, 430 pt wide, on the engine Safari uses.
      // Needs Playwright's WebKit once: npx playwright install webkit
      name: "iphone",
      use: { ...devices["iPhone 14 Pro Max"] },
    },
  ],
  webServer: {
    command: "python3 -m http.server 4173 --bind 127.0.0.1 --directory out",
    url: "http://127.0.0.1:4173/",
    reuseExistingServer: false,
    stdout: "ignore",
    stderr: "ignore",
  },
});
