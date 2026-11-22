import { ALLOWED_OUTSIDE, expect, test } from "./fixtures";
import { SEED_RECIPES } from "../data/seed";

// How many dishes a new phone starts with.
const DISHES = SEED_RECIPES.length;

// A dish rewritten from one of mother's YouTube channels: it says where it comes from, it is
// not presented as checked, each step can show its own part of the video, and she can cook
// from it like any other dish.
test("a dish rewritten from a video names its channel, shows each step's part of the video, and can be cooked", async ({ page }) => {
  const outside: string[] = [];
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (u.protocol.startsWith("http") && u.host !== "127.0.0.1:4173") outside.push(r.url());
  });
  await page.goto("/cong-thuc/");
  await page.getByRole("searchbox").fill("thit kho tieu");
  // With no photo of its own, the card shows the video's cover picture.
  const card = page.getByRole("link", { name: /Thịt kho tiêu \(Cô Ba\)/ });
  await expect(card.getByRole("img", { name: "Thịt kho tiêu (Cô Ba)" })).toHaveAttribute("src", /^https:\/\/i\.ytimg\.com\/vi\/CHhWIhh2_OM\//);
  await card.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Thịt kho tiêu (Cô Ba)");
  await expect(page.getByText("Mới nhập – chưa nấu thử")).toBeVisible();
  await expect(page.getByText("Mẫu – chưa kiểm chứng")).toHaveCount(0);
  await expect(page.getByText("Gia đình đã duyệt")).toHaveCount(0);
  await expect(page.getByText("Ảnh bìa video của kênh Cô Ba Bình Dương. Chưa có ảnh nhà mình chụp.")).toBeVisible();
  await expect(page.getByText(/— Cô Ba Bình Dương/)).toBeVisible();
  await expect(page.getByText(/Kênh không ghi lượng/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Xem video gốc (cần có mạng)" })).toHaveAttribute("href", "https://www.youtube.com/watch?v=CHhWIhh2_OM");

  await page.getByRole("button", { name: "Bắt đầu nấu" }).click();
  await page.getByRole("button", { name: "Bắt đầu bước 1" }).click();
  // Nothing is loaded from YouTube until she asks for the video.
  await expect(page.locator("iframe")).toHaveCount(0);
  expect(outside.filter((u) => u.includes("youtube")), "the player before she asks").toEqual([]);
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "Tiếp theo" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Phi hành tỏi, pha nước kho");
  await expect(page.getByText(/1½ muỗng canh nước mắm/)).toBeVisible();

  // The step's own part of the video: from 2:32 to 3:05, in the no-cookie player.
  await page.getByRole("button", { name: "Xem đoạn video của bước này (33 giây)" }).click();
  const player = page.locator("iframe");
  await expect(player).toHaveAttribute("src", /^https:\/\/www\.youtube-nocookie\.com\/embed\/CHhWIhh2_OM\?/);
  await expect(player).toHaveAttribute("src", /[?&]start=152(&|$)/);
  await expect(player).toHaveAttribute("src", /[?&]end=185(&|$)/);
  const box = (await player.boundingBox())!;
  expect(box.width, "video is as wide as the phone allows").toBeGreaterThan(300);
  let overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow, "horizontal scroll with the video open").toBe(false);
  await page.getByRole("button", { name: "Đóng video" }).click();
  await expect(page.locator("iframe")).toHaveCount(0);

  // The next step starts closed again, with its own part.
  await page.getByRole("button", { name: "Tiếp theo" }).click();
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Xem đoạn video của bước này (31 giây)" })).toBeVisible();

  // With no network the button says so, and the written step is still there.
  await page.context().setOffline(true);
  await page.getByRole("button", { name: /Xem đoạn video của bước này/ }).click();
  await expect(page.getByText("Cần có mạng để xem video. Phần chữ ở trên vẫn đủ để nấu.")).toBeVisible();
  await expect(page.locator("iframe")).toHaveCount(0);
  await page.context().setOffline(false);

  for (let i = 0; i < 2; i++) await page.getByRole("button", { name: "Tiếp theo" }).click();
  await page.getByRole("button", { name: "Nấu xong" }).click();
  await page.getByRole("button", { name: "Xong, không ghi nhận xét" }).click();
  await expect(page.getByText("Thịt kho tiêu (Cô Ba): đã nấu xong.")).toBeVisible();
  overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow, "horizontal scroll").toBe(false);
  // Only the cover picture and the player she asked for; nothing else leaves the device.
  expect(outside.filter((u) => !ALLOWED_OUTSIDE.includes(new URL(u).host)), "requests to other servers").toEqual([]);
});

// The channel lists the ingredients and their amounts before it starts working, so that part of
// the video is offered on the "Chuẩn bị nguyên liệu" screen; a step's own part then opens on the
// sentence that gives the amount the step uses.
test("the part of the video that lists the ingredients is offered before step 1", async ({ page }) => {
  await page.goto("/cong-thuc/");
  await page.getByRole("searchbox").fill("canh he");
  await page.getByRole("link", { name: /Canh hẹ đậu hũ non thịt bằm \(Tú Lê\)/ }).click();
  await page.getByRole("button", { name: "Bắt đầu nấu" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Chuẩn bị nguyên liệu");
  await expect(page.locator("iframe")).toHaveCount(0);
  await page.getByRole("button", { name: "Xem đoạn kênh nói về nguyên liệu (1 phút 36 giây)" }).click();
  const player = page.locator("iframe");
  await expect(player).toHaveAttribute("src", /^https:\/\/www\.youtube-nocookie\.com\/embed\/99upl7mvsSU\?/);
  await expect(player).toHaveAttribute("src", /[?&]start=31(&|$)/);
  await expect(player).toHaveAttribute("src", /[?&]end=127(&|$)/);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow, "horizontal scroll with the video open").toBe(false);
  await page.getByRole("button", { name: "Đóng video" }).click();

  // Step 1 uses the minced meat: its part starts at 0:55, where the channel says "200 g thịt bằm".
  await page.getByRole("button", { name: "Bắt đầu bước 1" }).click();
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.getByLabel("Cần dùng ở bước này").getByText("Thịt bằm")).toBeVisible();
  await page.getByRole("button", { name: "Xem đoạn video của bước này (1 phút 3 giây)" }).click();
  await expect(player).toHaveAttribute("src", /[?&]start=55(&|$)/);
  await expect(player).toHaveAttribute("src", /[?&]end=118(&|$)/);
  const silent = page.getByText("Trong đoạn này kênh không nhắc lại lượng. Lượng ở mục “Cần dùng” phía trên.");
  await expect(silent).toHaveCount(0);
  // Step 3 adds the soup seasonings, which the channel only measures at the start of the video.
  for (let i = 0; i < 2; i++) await page.getByRole("button", { name: "Tiếp theo" }).click();
  await expect(page.getByLabel("Cần dùng ở bước này").getByText("Muối nêm canh")).toBeVisible();
  await expect(silent).toBeVisible();
});

// A cover picture she has seen once is kept on the phone, so the dish keeps its picture with no
// network. Chrome only: WebKit does not let a test answer what the service worker fetches.
test("a video's cover picture seen once is still shown with no network", async ({ page, context, browserName }) => {
  test.skip(browserName === "webkit", "the service worker's own requests cannot be answered by the test in WebKit");
  await page.goto("/");
  await page.waitForFunction(async () => (await navigator.serviceWorker.ready).active?.state === "activated" && !!navigator.serviceWorker.controller, null, { timeout: 30_000 });
  await page.goto("/cong-thuc/");
  const cover = page.getByRole("img", { name: "Thịt kho tiêu (Cô Ba)" });
  await expect.poll(() => cover.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(320);

  await context.unroute("https://i.ytimg.com/**");
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("main h3")).toHaveCount(DISHES);
  await expect.poll(() => cover.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(320);
});
