import { expect, test } from "./fixtures";

// The app is a present: the greeting carries the family's own picture (kept on the phone only),
// and a short guide walks her from "what shall I cook" to "done".
test("the guide is offered once, reads in six steps, and stays one tap away", async ({ page }) => {
  await page.goto("/");
  const invite = page.getByText("Bếp Nhà có thêm phần hướng dẫn");
  await expect(invite).toBeVisible();
  await page.getByRole("link", { name: "Xem cách dùng" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cách dùng Bếp Nhà");
  await expect(page.locator("main ol > li h2")).toHaveText(["1. Chọn món", "2. Soạn nguyên liệu", "3. Nấu theo từng bước", "4. Nghe đọc và hẹn giờ", "5. Xem video của kênh", "6. Nấu xong"]);
  // It speaks to her the way the rest of the app does, and names the buttons she will see.
  await expect(page.getByText("máy chọn giúp mẹ một món mặn và một món canh")).toBeVisible();
  await expect(page.getByText("Nếu hiện quảng cáo, mẹ chờ vài giây rồi bấm “Skip”.")).toBeVisible();
  let overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow, "horizontal scroll on the guide").toBe(false);

  await page.getByRole("link", { name: "Về trang chủ chọn món" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("hôm nay nấu gì");
  await expect(invite).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("hôm nay nấu gì");
  await expect(invite).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Cách dùng" })).toBeVisible();
  await page.goto("/cai-dat/");
  await expect(page.getByRole("link", { name: "Xem hướng dẫn sử dụng" })).toHaveAttribute("href", /\/huong-dan\/$/);

  // The largest text size still fits.
  await page.getByRole("button", { name: "Cực lớn" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-text-scale", "cuc_lon");
  for (const path of ["/", "/huong-dan/"]) {
    await page.goto(path);
    await expect(page.locator("html")).toHaveAttribute("data-text-scale", "cuc_lon");
    overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow, `horizontal scroll on ${path} at the largest text`).toBe(false);
  }
});

test("“Để sau” puts the invitation away for good", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Để sau" }).click();
  await expect(page.getByText("Bếp Nhà có thêm phần hướng dẫn")).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("hôm nay nấu gì");
  await expect(page.getByText("Bếp Nhà có thêm phần hướng dẫn")).toHaveCount(0);
});

test("the family's picture is chosen once in Cài đặt, shown by the greeting, and never leaves the phone", async ({ page }) => {
  const outside: string[] = [];
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (u.protocol.startsWith("http") && u.host !== "127.0.0.1:4173" && u.host !== "i.ytimg.com") outside.push(r.url());
  });
  await page.goto("/");
  // Until a picture is chosen the frame shows the app's own drawing.
  await expect(page.getByRole("img", { name: "Hình vẽ hai mẹ con" })).toHaveAttribute("src", /\/icon\.svg$/);

  await page.goto("/cai-dat/");
  const png = await page.evaluate(async () => {
    const c = document.createElement("canvas");
    c.width = 900;
    c.height = 1200;
    const g = c.getContext("2d")!;
    g.fillStyle = "#2A8577";
    g.fillRect(0, 0, 900, 1200);
    g.fillStyle = "#E2BE55";
    g.fillRect(200, 300, 500, 600);
    const blob: Blob = await new Promise((done) => c.toBlob((b) => done(b!), "image/png"));
    return [...new Uint8Array(await blob.arrayBuffer())];
  });
  await page.getByLabel("Chọn ảnh của nhà mình").setInputFiles({ name: "me-va-con.png", mimeType: "image/png", buffer: Buffer.from(png) });
  await expect(page.getByText("Ảnh này hiện ở trang chủ, cạnh lời chào.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Đổi ảnh khác" })).toBeVisible();

  await page.goto("/");
  const photo = page.getByRole("img", { name: "Ảnh của nhà mình" });
  await expect(photo).toHaveAttribute("src", /^blob:/);
  await expect.poll(() => photo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(900);
  const box = (await photo.boundingBox())!;
  expect(Math.round(box.width), "a round frame").toBe(Math.round(box.height));
  // Still there after the app is opened again.
  await page.reload();
  await expect(page.getByRole("img", { name: "Ảnh của nhà mình" })).toBeVisible();

  await page.goto("/cai-dat/");
  await page.getByRole("button", { name: "Bỏ ảnh" }).click();
  await expect(page.getByText("Chưa chọn ảnh: trang chủ đang hiện hình vẽ hai mẹ con.")).toBeVisible();
  expect(outside, "requests to other servers").toEqual([]);
});
