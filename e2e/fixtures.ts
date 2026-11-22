import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test as base, type BrowserContext } from "@playwright/test";

// Every test starts on a "phone" with empty storage, and may ask for a second one.
//
// In Chrome a phone is an ordinary throw-away browser context. WebKit cannot do that: in a
// throw-away context it behaves like Safari's Private Browsing and refuses to store photos in
// IndexedDB ("Error preparing Blob/File data to be stored in object store"). An app on the Home
// Screen is not private, so on WebKit each phone gets its own profile folder on disk instead.

type Fixtures = { newPhone: () => Promise<BrowserContext> };

// The two outside addresses the app may use, both for a dish rewritten from a video: the video's
// cover picture and the YouTube player. The tests answer them here, so no test depends on YouTube.
// (WebKit does not let a test answer what the service worker fetches; there the cover picture
// may really be fetched.)
export const ALLOWED_OUTSIDE = ["i.ytimg.com", "www.youtube-nocookie.com"];
// A 320 × 180 picture, the size of YouTube's small cover.
const PIXEL = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAUAAAAC0CAIAAABqhmJGAAABk0lEQVR42u3TAQkAAAzDsIm9pmu6rOsYBKKg0NwOUCoSgIEBAwMGBgMDBgYMDBgYDAwYGDAwGBgwMGBgwMBgYMDAgIEBA4OBAQMDBgYDAwYGDAwYGAwMGBgwMGBgMDBgYMDAYGDAwICBAQODgQEDAwYGA6sABgYMDBgYDAwYGDAwYGAwMGBgwMBgYMDAgIEBA4OBAQMDBgYMDAYGDAwYGAwMGBgwMGBgMDBgYMDAgIHBwICBAQODgQEDAwYGDAwGBgwMGBgMDBgYMDBgYDAwYGDAwICBwcCAgQEDg4EBAwMGBgwMBgYMDBgYMDAYGDAwYGAwMGBgwMCAgcHAgIEBAwMGBgMDBgYMDAYGDAwYGDAwGBgwMGBgMDBgYMDAgIHBwICBAQMDBgYDAwYGDAwGBgwMGBgwMBgYMDBgYMDAYGDAwICBwcCAgQEDAwYGAwMGBgwMBlYBDAwYGDAwGBgwMGBgwMBgYMDAgIHBwICBAQMDBgYDAwYGDAwYGAwMGBgwMBgYMDBgYMDAYGDAwICBAQNDtweD1Jkmt0dyXQAAAABJRU5ErkJggg==", "base64");
async function answerOutside(context: BrowserContext) {
  await context.route("https://i.ytimg.com/**", (route) => route.fulfill({ status: 200, contentType: "image/png", headers: { "access-control-allow-origin": "*" }, body: PIXEL }));
  await context.route("https://www.youtube-nocookie.com/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>video</title><p>video</p>" }));
}

export const test = base.extend<Fixtures>({
  newPhone: async ({ browser, browserName, playwright }, provide, testInfo) => {
    const opened: BrowserContext[] = [];
    const folders: string[] = [];
    await provide(async () => {
      const u = testInfo.project.use;
      let context: BrowserContext;
      if (browserName === "webkit") {
        const dir = mkdtempSync(join(tmpdir(), "bep-nha-may-"));
        folders.push(dir);
        context = await playwright.webkit.launchPersistentContext(dir, {
          viewport: u.viewport,
          userAgent: u.userAgent,
          deviceScaleFactor: u.deviceScaleFactor,
          isMobile: u.isMobile,
          hasTouch: u.hasTouch,
          baseURL: u.baseURL,
          locale: u.locale,
          timezoneId: u.timezoneId,
          serviceWorkers: u.serviceWorkers,
        });
      } else {
        context = await browser.newContext({ locale: "vi-VN" });
      }
      await answerOutside(context);
      opened.push(context);
      return context;
    });
    for (const c of opened) await c.close().catch(() => {});
    for (const dir of folders) rmSync(dir, { recursive: true, force: true });
  },
  // The first phone.
  context: async ({ context, browserName, newPhone }, provide) => {
    if (browserName !== "webkit") {
      await answerOutside(context);
      return provide(context);
    }
    await provide(await newPhone());
  },
  page: async ({ context, page, browserName }, provide) => {
    if (browserName !== "webkit") return provide(page);
    await provide(context.pages()[0] ?? (await context.newPage()));
  },
});

export { expect, type Page } from "@playwright/test";
