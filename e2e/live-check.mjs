// One-off check of the DEPLOYED site (not part of `npm run test:e2e`):
//   node e2e/live-check.mjs https://<user>.github.io/<repo>/
import { chromium, devices } from "@playwright/test";

const base = process.argv[2];
if (!base) throw new Error("Give the site address, ending with /");
const origin = new URL(base).origin;
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? "chrome" });
const context = await browser.newContext({ ...devices["Pixel 7"], locale: "vi-VN" });
const page = await context.newPage();
// The two addresses a dish rewritten from a video may use: its cover picture and the player.
const VIDEO_HOSTS = ["i.ytimg.com", "www.youtube-nocookie.com"];
const outside = [];
const videoRequests = new Set();
const failed = [];
page.on("request", (r) => {
  if (!r.url().startsWith("http") || new URL(r.url()).origin === origin) return;
  if (VIDEO_HOSTS.includes(new URL(r.url()).host)) videoRequests.add(new URL(r.url()).host);
  else outside.push(r.url());
});
page.on("response", (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
const errors = [];
const lost = new Set();
// A cover picture this browser has never shown cannot be fetched with no network; that is expected.
page.on("requestfailed", (r) => { if (!VIDEO_HOSTS.includes(new URL(r.url()).host)) lost.add(`${r.method()} ${new URL(r.url()).pathname}`); });
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

const result = {};
await page.goto(base);
result.greeting = await page.locator("h1").innerText();
await page.waitForFunction(async () => (await navigator.serviceWorker.ready).active?.state === "activated" && !!navigator.serviceWorker.controller, null, { timeout: 60_000 });
result.offlineReady = true;
result.manifest = await page.evaluate(async () => (await (await fetch(document.querySelector("link[rel=manifest]").href)).json()).start_url);

await context.setOffline(true);
await page.reload();
result.offlineHome = await page.locator("h1").innerText();
await page.getByRole("link", { name: "Công thức" }).click();
await page.locator("main h3").first().waitFor();
result.offlineRecipes = await page.locator("main h3").count();
result.samplesShown = await page.getByText("Mẫu – chưa kiểm chứng").count();
await page.getByRole("searchbox").fill("canh he");
await page.getByRole("link", { name: /Canh hẹ đậu hũ non thịt bằm/ }).click();
await page.getByRole("button", { name: "Bắt đầu nấu" }).click();
result.ingredientsVideoButton = await page.getByRole("button", { name: /Xem đoạn kênh nói về nguyên liệu/ }).innerText();
await page.getByRole("button", { name: "Bắt đầu bước 1" }).click();
result.stepVideoButton = await page.getByRole("button", { name: /Xem đoạn video của bước này/ }).innerText();
result.offlineCookingStep = await page.locator("h1").innerText();
result.url = page.url();
result.requestsToOtherServers = outside;
result.requestsForVideos = [...videoRequests];
result.failedResponses = failed;
result.consoleErrors = errors.length;
result.requestsThatFailedOffline = [...lost];
console.log(JSON.stringify(result, null, 2));
await browser.close();
