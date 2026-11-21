import { expect, test, type Page } from "./fixtures";

// The file hand-over uses the phone's share sheet when it accepts files. A test browser has
// no share sheet, so these tests always take the ordinary download path.
async function noShareSheet(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "canShare", { value: undefined, configurable: true });
  });
}

async function waitForOfflineReady(page: Page) {
  await page.waitForFunction(async () => (await navigator.serviceWorker.ready).active?.state === "activated" && !!navigator.serviceWorker.controller, null, { timeout: 30_000 });
}

test("cook a dish end to end, offline, with nothing leaving the device", async ({ page, context }) => {
  const outside: string[] = [];
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (u.protocol.startsWith("http") && u.host !== "127.0.0.1:4173") outside.push(r.url());
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("hôm nay nấu gì");
  await waitForOfflineReady(page);

  // From here on there is no network at all, and nothing the app asks for may fail.
  const lost: string[] = [];
  // WebKit also reports a look-ahead it dropped because she moved to another page ("cancelled");
  // that is not a request the network failed to answer.
  page.on("requestfailed", (r) => {
    if (r.failure()?.errorText !== "cancelled") lost.push(`${r.method()} ${new URL(r.url()).pathname}`);
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("hôm nay nấu gì");

  // Find the dish without typing diacritics.
  await page.getByRole("link", { name: "Công thức" }).click();
  await expect(page.locator("main h3")).toHaveCount(10);
  await page.getByRole("searchbox").fill("ca kho");
  await expect(page.locator("main h3")).toHaveText(["Cá kho tộ"]);
  await page.getByRole("link", { name: /Cá kho tộ/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cá kho tộ");
  await expect(page.getByText("Mẫu – chưa kiểm chứng").first()).toBeVisible();

  // Servings: 4 → 8 doubles the fish, then back.
  await page.getByRole("button", { name: "Thêm số người ăn" }).click({ clickCount: 4 });
  await expect(page.getByText("1000 g")).toBeVisible();
  await page.getByRole("button", { name: "Bớt số người ăn" }).click({ clickCount: 4 });
  await expect(page.getByText("500 g")).toBeVisible();

  // Adjust to the family's taste: less fish sauce, with a reason.
  await page.getByRole("link", { name: "Chỉnh theo khẩu vị nhà mình" }).click();
  await expect(page.getByRole("button", { name: "Lưu bản nhà mình" })).toBeDisabled();
  await page.getByRole("button", { name: "Bớt nước mắm" }).click({ clickCount: 2 });
  await page.getByRole("button", { name: "Bớt mặn" }).click();
  await page.getByRole("button", { name: "Lưu bản nhà mình" }).click();
  await expect(page.getByRole("heading", { name: "Khác với bản gốc" })).toBeVisible();
  await expect(page.getByText("Nước mắm: 1½ muỗng canh (bản gốc: 2 muỗng canh)")).toBeVisible();
  await expect(page.getByText("Lý do chỉnh: Bớt mặn")).toBeVisible();

  // Cook it. The adjusted amount must be the one in the instructions.
  await page.getByRole("button", { name: "Bắt đầu nấu" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Chuẩn bị nguyên liệu");
  await page.getByRole("button", { name: "Bắt đầu bước 1" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Rửa cá cho hết tanh");
  await page.getByRole("button", { name: "Tiếp theo" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ướp cá");
  await expect(page.getByText("Thêm 1½ muỗng canh nước mắm, 1 muỗng canh đường")).toBeVisible();

  // A timer keeps running when she moves on, and the session survives a reload.
  await page.getByRole("button", { name: /Hẹn giờ 15 phút/ }).click();
  await expect(page.getByRole("timer")).toHaveText(/14:5\d/);
  await page.getByRole("button", { name: "Tiếp theo" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Thắng nước màu");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Thắng nước màu");
  await expect(page.getByRole("timer")).toHaveText(/14:\d\d/);
  await page.getByRole("button", { name: "Tắt" }).click();

  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Tiếp theo" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Nêm lại và hoàn tất");
  await page.getByRole("button", { name: "Nấu xong" }).click();
  await expect(page.getByRole("button", { name: "Lưu vào nhật ký" })).toBeDisabled();
  await page.getByRole("radio", { name: "Rất ngon" }).click();
  await page.getByRole("textbox").fill("Cả nhà khen");
  await page.getByRole("button", { name: "Lưu vào nhật ký" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Đã lưu vào nhật ký");

  // A sample only becomes "approved" when she says so after a good meal.
  await page.getByRole("button", { name: "Có, nhà mình duyệt món này" }).click();
  await expect(page.getByText("Đã ghi nhận: gia đình đã duyệt món này.")).toBeVisible();

  await page.getByRole("link", { name: "Xem nhật ký" }).click();
  const entry = page.locator("main li").first();
  await expect(entry).toContainText("Cá kho tộ");
  await expect(entry).toContainText("Bản nhà mình");
  await expect(entry).toContainText("Rất ngon");
  await expect(entry).toContainText("Cả nhà khen");

  expect(outside, "requests to other servers").toEqual([]);
  expect(lost, "requests that failed while offline").toEqual([]);
});

test("back up on one phone, restore on another", async ({ page, newPhone }, testInfo) => {
  await noShareSheet(page);
  await page.goto("/cong-thuc/");
  await page.getByRole("link", { name: /Thịt kho trứng/ }).click();
  await page.getByRole("link", { name: "Chỉnh theo khẩu vị nhà mình" }).click();
  await page.getByRole("button", { name: "Bớt đường" }).click();
  await page.getByRole("button", { name: "Lưu bản nhà mình" }).click();
  await page.getByRole("button", { name: "Thêm vào yêu thích" }).click();
  await page.getByRole("button", { name: "Bắt đầu nấu" }).click();
  await page.getByRole("button", { name: "Bắt đầu bước 1" }).click();
  for (let i = 0; i < 5; i++) await page.getByRole("button", { name: "Tiếp theo" }).click();
  await page.getByRole("button", { name: "Nấu xong" }).click();
  await page.getByRole("radio", { name: "Vừa miệng" }).click();
  await page.getByRole("button", { name: "Lưu vào nhật ký" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Đã lưu vào nhật ký");

  // Back up.
  await page.goto("/cai-dat/");
  await expect(page.getByText("Chưa sao lưu lần nào. Có thay đổi chưa được sao lưu.")).toBeVisible();
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Sao lưu ngay" }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toMatch(/^bep-nha-sao-luu-.*\.zip$/);
  const file = testInfo.outputPath(download.suggestedFilename());
  await download.saveAs(file);
  await expect(page.getByText(/Đã tạo tệp sao lưu/)).toBeVisible();
  await expect(page.getByText(/Lần sao lưu gần nhất: .* Mọi thứ đã được sao lưu\./)).toBeVisible();

  // "Another phone": a browser with empty storage.
  const other = await newPhone();
  const p2 = await other.newPage();
  await p2.goto("/nhat-ky/");
  await expect(p2.getByText("Chưa có lần nấu nào")).toBeVisible();

  // A file that is not a backup is refused and nothing changes.
  await p2.goto("/cai-dat/");
  await p2.getByLabel("Chọn tệp sao lưu").setInputFiles({ name: "anh.zip", mimeType: "application/zip", buffer: Buffer.from("không phải bản sao lưu") });
  await expect(p2.getByText("Tệp này không mở được")).toBeVisible();

  // The real backup: summary first, then restore.
  await p2.getByLabel("Chọn tệp sao lưu").setInputFiles(file);
  const dialog = p2.getByRole("dialog");
  await expect(dialog).toContainText("Gồm 10 món, 1 lần nấu, 0 ảnh.");
  await dialog.getByRole("button", { name: "Khôi phục", exact: true }).click();
  await expect(p2.getByText("Đã khôi phục: 10 món, 1 lần nấu, 0 ảnh.")).toBeVisible();

  await p2.goto("/nhat-ky/");
  await expect(p2.locator("main li").first()).toContainText("Thịt kho trứng");
  await expect(p2.locator("main li").first()).toContainText("Vừa miệng");
  await p2.goto("/yeu-thich/");
  await expect(p2.locator("main h3")).toHaveText(["Thịt kho trứng"]);
  await p2.getByRole("link", { name: /Thịt kho trứng/ }).click();
  await expect(p2.getByText("Đường: ¾ muỗng canh (bản gốc: 1 muỗng canh)")).toBeVisible();

  // The restore can be undone: the other phone goes back to its empty journal.
  await p2.goto("/cai-dat/");
  await p2.getByRole("button", { name: "Hoàn tác lần khôi phục gần nhất" }).click();
  await p2.getByRole("dialog").getByRole("button", { name: "Hoàn tác", exact: true }).click();
  await expect(p2.getByText("Đã trả lại dữ liệu như trước khi khôi phục.")).toBeVisible();
  await p2.goto("/nhat-ky/");
  await expect(p2.getByText("Chưa có lần nấu nào")).toBeVisible();
  await other.close();
});

test("deleting a dish is reversible, and text can be made very large", async ({ page }) => {
  await page.goto("/cong-thuc/");
  await page.getByRole("button", { name: "Món canh" }).click();
  await expect(page.locator("main h3")).toHaveText(["Canh bí nấu tôm", "Canh chua cá"]);
  await page.getByRole("link", { name: /Canh chua cá/ }).click();
  await page.getByRole("button", { name: "Xoá món này" }).click();
  const dialog = page.getByRole("dialog");
  // The big first button is the safe one.
  await expect(dialog.getByRole("button").first()).toHaveText("Không, giữ nguyên");
  await dialog.getByRole("button", { name: "Xoá món này" }).click();
  await expect(page.locator("main h3")).toHaveCount(9);

  await page.goto("/cai-dat/");
  await page.getByRole("button", { name: "Khôi phục món này" }).click();
  await expect(page.getByText("Không có món nào đã xoá")).toBeVisible();

  await page.getByRole("button", { name: "Cực lớn" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-text-scale", "cuc_lon");
  for (const path of ["/", "/cong-thuc/", "/cai-dat/"]) {
    await page.goto(path);
    await expect(page.locator("html")).toHaveAttribute("data-text-scale", "cuc_lon");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow, `horizontal scroll on ${path}`).toBe(false);
  }
});
