import { expect, test, type Page } from "@playwright/test";

// G4: the recipe editor, dish photos and recipe packs — against the built site, phone size.

async function noShareSheet(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "canShare", { value: undefined, configurable: true });
  });
}

/** A large picture such as a phone camera makes (3000 × 2000), drawn in the browser. */
async function bigPhoto(page: Page): Promise<Buffer> {
  const base64 = await page.evaluate(async () => {
    const c = document.createElement("canvas");
    c.width = 3000;
    c.height = 2000;
    const ctx = c.getContext("2d")!;
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = `hsl(${(i * 37) % 360} 70% ${30 + (i % 5) * 10}%)`;
      ctx.fillRect((i * 173) % 3000, (i * 97) % 2000, 400, 300);
    }
    const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), "image/png"));
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let s = "";
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(s);
  });
  return Buffer.from(base64, "base64");
}

const field = (page: Page, label: string | RegExp) => page.getByLabel(label, { exact: typeof label === "string" });

test("write a new dish with a photo, cook from it, send it to another phone", async ({ page, browser }, testInfo) => {
  const outside: string[] = [];
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (u.protocol.startsWith("http") && u.host !== "127.0.0.1:4173") outside.push(r.url());
  });
  await noShareSheet(page);
  await page.goto("/cong-thuc/");
  await page.getByRole("link", { name: "Thêm món mới" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Thêm món mới");

  // 1. Name, category, photo.
  await field(page, "Tên món").fill("Vịt kho gừng");
  await page.getByRole("button", { name: "Món kho" }).click();
  const original = await bigPhoto(page);
  expect(original.length).toBeGreaterThan(100_000);
  await page.getByLabel("Chọn ảnh món").setInputFiles({ name: "IMG_0001.png", mimeType: "image/png", buffer: original });
  const photo = page.getByRole("img", { name: "Vịt kho gừng" });
  await expect(photo).toBeVisible();
  // Made small before it is stored: long edge 1600, and far lighter than the camera file.
  const stored = await photo.evaluate(async (img: HTMLImageElement) => {
    await img.decode();
    // Read what is really in the device's database (the page itself may not fetch blob: addresses).
    const db = await new Promise<IDBDatabase>((ok, no) => {
      const open = indexedDB.open("bep-nha");
      open.onsuccess = () => ok(open.result);
      open.onerror = () => no(open.error);
    });
    const rows = await new Promise<Array<{ blob: Blob }>>((ok) => {
      const all = db.transaction("images").objectStore("images").getAll();
      all.onsuccess = () => ok(all.result);
    });
    db.close();
    return { w: img.naturalWidth, h: img.naturalHeight, count: rows.length, type: rows[0].blob.type, size: rows[0].blob.size };
  });
  expect(stored).toMatchObject({ w: 1600, h: 1067, count: 1, type: "image/jpeg" });
  expect(stored.size).toBeLessThan(600_001);

  // 2. Ingredients: typed amount, and the + button.
  await page.getByRole("button", { name: "Tiếp: Nguyên liệu" }).click();
  await page.getByRole("button", { name: "Thêm nguyên liệu" }).click();
  await field(page, "Tên nguyên liệu").fill("Thịt vịt");
  await field(page, "Lượng").fill("600");
  await expect(page.getByText("Đọc là: 600 g")).toBeVisible();
  await page.getByRole("button", { name: "Thêm gia vị" }).click();
  await field(page, "Tên gia vị").fill("Nước mắm");
  await page.getByRole("button", { name: "Thêm nước mắm", exact: true }).click({ clickCount: 2 });
  await expect(page.getByText("Đọc là: 1½ muỗng canh")).toBeVisible();
  // A unit is chosen from large buttons, never typed.
  await page.getByRole("button", { name: "Đổi đơn vị của nước mắm" }).click();
  await page.getByRole("group", { name: "Chọn đơn vị cho nước mắm" }).getByRole("button", { name: "muỗng cà phê" }).click();
  await expect(page.getByText("Đọc là: 1½ muỗng cà phê")).toBeVisible();
  await page.getByRole("button", { name: "Đổi đơn vị của nước mắm" }).click();
  await page.getByRole("group", { name: "Chọn đơn vị cho nước mắm" }).getByRole("button", { name: "muỗng canh" }).click();

  // 3. Equipment.
  await page.getByRole("button", { name: "Tiếp: Dụng cụ" }).click();
  await page.getByRole("button", { name: "Nồi", exact: true }).click();

  // 4. Steps: the amount is inserted, not typed.
  await page.getByRole("button", { name: "Tiếp: Các bước" }).click();
  await page.getByRole("button", { name: "Thêm bước" }).click();
  await field(page, "Tên bước 1").fill("Ướp vịt");
  await field(page, "Cách làm bước 1").fill("Ướp vịt với 2 muỗng canh nước mắm");
  await expect(page.getByRole("alert").filter({ hasText: "ghi cứng “2 muỗng canh nước mắm”" })).toBeVisible();
  await field(page, "Cách làm bước 1").fill("Cho");
  await page.getByRole("button", { name: "Chèn nguyên liệu" }).click();
  await page.getByRole("group", { name: "Chọn nguyên liệu để chèn vào bước 1" }).getByRole("button", { name: "thịt vịt" }).click();
  await page.keyboard.type(" vào tô, thêm");
  await page.getByRole("button", { name: "Chèn nguyên liệu" }).click();
  await page.getByRole("group", { name: "Chọn nguyên liệu để chèn vào bước 1" }).getByRole("button", { name: "nước mắm" }).click();
  await expect(field(page, "Cách làm bước 1")).toHaveValue("Cho [thịt vịt] vào tô, thêm [nước mắm]");
  await expect(page.getByTestId("xem-truoc-1")).toHaveText("Cho 600 g thịt vịt vào tô, thêm 1½ muỗng canh nước mắm");
  await field(page, /^Được khi/).fill("vịt ngấm gia vị, sau khoảng 15 phút.");
  await page.getByRole("button", { name: "Bước này cần hẹn giờ" }).click();
  await page.getByRole("button", { name: "Thêm phút hẹn giờ bước 1" }).click({ clickCount: 10 });

  // The app was closed mid-way (a moment after the last tap): everything written so far is still there.
  await page.waitForTimeout(300);
  await page.reload();
  await expect(page.getByText("Đây là phần mẹ đang viết dở lần trước.")).toBeVisible();
  await expect(field(page, "Tên món")).toHaveValue("Vịt kho gừng");
  await expect(page.getByRole("img", { name: "Vịt kho gừng" })).toBeVisible();

  // "Tránh…" is missing, so it cannot be saved yet, and the review says exactly what is missing.
  await page.getByRole("button", { name: "Xem lại và lưu" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("Bước 1 chưa ghi “Tránh…”.");
  await expect(page.getByRole("button", { name: "Lưu món mới" })).toBeDisabled();
  await page.getByRole("button", { name: "Sửa phần 4: Các bước" }).click();
  await field(page, /^Tránh/).fill("ướp quá lâu ngoài tủ lạnh.");

  // 5. Source: a recipe written from a video must carry the link.
  await page.getByRole("button", { name: "Tiếp: Nguồn" }).click();
  await page.getByRole("button", { name: "Viết lại theo video YouTube" }).click();
  await field(page, "Link video YouTube").fill("https://example.com/khong-phai-youtube");
  await page.getByRole("button", { name: "Xem lại và lưu" }).last().click();
  await expect(page.locator("main").getByRole("alert")).toContainText("Chưa có link YouTube đúng");
  await page.getByRole("button", { name: "Sửa phần 5: Nguồn" }).click();
  await field(page, "Link video YouTube").fill("https://youtu.be/dQw4w9WgXcQ?si=abc");
  await expect(page.getByText("Đã nhận ra video.")).toBeVisible();
  await page.getByRole("button", { name: "Xem lại và lưu" }).last().click();
  await page.getByRole("button", { name: "Lưu món mới" }).click();

  // The dish page: honest labels, the photo, and amounts that follow the servings.
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Vịt kho gừng");
  await expect(page.getByText("Mới nhập – chưa nấu thử")).toBeVisible();
  await expect(page.getByText("Viết lại theo video", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Xem video gốc/ })).toHaveAttribute("href", "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  await expect(page.getByRole("img", { name: "Vịt kho gừng" })).toBeVisible();
  await expect(page.getByText("Cho 600 g thịt vịt vào tô, thêm 1½ muỗng canh nước mắm")).toBeVisible();
  await page.getByRole("button", { name: "Thêm số người ăn" }).click({ clickCount: 4 });
  await expect(page.getByText("Cho 1200 g thịt vịt vào tô, thêm 3 muỗng canh nước mắm")).toBeVisible();
  await page.getByRole("button", { name: "Bớt số người ăn" }).click({ clickCount: 4 });

  // Never cooked: a correction goes straight into the recipe, no new version.
  await page.getByRole("link", { name: /Sửa món/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sửa món: Vịt kho gừng");
  await page.getByRole("button", { name: "2. Nguyên liệu" }).click();
  await page.getByRole("button", { name: "Bớt nước mắm", exact: true }).click({ clickCount: 2 });
  await page.getByRole("button", { name: "Xem lại và lưu" }).first().click();
  await expect(page.getByText("Món này chưa nấu lần nào nên máy sửa thẳng vào công thức.")).toBeVisible();
  await page.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect(page.getByText("Cho 600 g thịt vịt vào tô, thêm 1 muỗng canh nước mắm")).toBeVisible();
  await expect(page.locator("main ol").last().locator("li")).toHaveCount(1); // version history: one entry

  // Cook it: the timer and the instruction come from what was typed.
  await page.getByRole("button", { name: "Bắt đầu nấu" }).click();
  await page.getByRole("button", { name: "Bắt đầu bước 1" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ướp vịt");
  await expect(page.getByText("Cho 600 g thịt vịt vào tô, thêm 1 muỗng canh nước mắm")).toBeVisible();
  await expect(page.getByRole("button", { name: /Hẹn giờ 15 phút/ })).toBeVisible();
  await page.getByRole("button", { name: "Nấu xong" }).click();
  await page.getByRole("radio", { name: "Rất ngon" }).click();
  await page.getByRole("button", { name: "Lưu vào nhật ký" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Đã lưu vào nhật ký");

  // Cooked now: the same kind of edit becomes a new "Bản nhà mình", and the cooked one stays.
  await page.goto("/cong-thuc/");
  await page.getByRole("link", { name: /Vịt kho gừng/ }).click();
  await page.getByRole("link", { name: /Sửa món/ }).click();
  await page.getByRole("button", { name: "2. Nguyên liệu" }).click();
  await page.getByRole("button", { name: "Thêm nước mắm", exact: true }).click({ clickCount: 4 });
  await page.getByRole("button", { name: "Xem lại và lưu" }).first().click();
  await expect(page.getByText(/Máy sẽ lưu thành “Bản nhà mình” mới/)).toBeVisible();
  await field(page, "Vì sao sửa? (không bắt buộc)").fill("Nhà thích đậm hơn");
  await page.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect(page.getByText("Nước mắm: 2 muỗng canh (bản gốc: 1 muỗng canh)")).toBeVisible();
  await expect(page.getByText("Lý do chỉnh: Nhà thích đậm hơn")).toBeVisible();

  // Send the dish as a file.
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Gửi món này cho máy khác" }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toMatch(/^bep-nha-mon-vit-kho-gung-.*\.zip$/);
  const file = testInfo.outputPath(download.suggestedFilename());
  await download.saveAs(file);

  // The pack is not a backup: "Khôi phục" refuses it, so it can never replace a phone's data.
  await page.goto("/cai-dat/");
  await page.getByLabel("Chọn tệp sao lưu").setInputFiles(file);
  await expect(page.getByText(/Đây là tệp gửi món, không phải bản sao lưu/)).toBeVisible();

  // "Another phone", which has cooked one of its own dishes.
  const other = await browser.newContext({ locale: "vi-VN" });
  const p2 = await other.newPage();
  await p2.goto("/cong-thuc/");
  await expect(p2.locator("main h3")).toHaveCount(10);
  await p2.goto("/cai-dat/mon/");
  await p2.getByLabel("Chọn tệp gửi món").setInputFiles({ name: "la.zip", mimeType: "application/zip", buffer: Buffer.from("không phải tệp gửi món") });
  await expect(p2.getByText("Tệp này không mở được")).toBeVisible();
  await p2.getByLabel("Chọn tệp gửi món").setInputFiles(file);
  const dialog = p2.getByRole("dialog");
  await expect(dialog).toContainText("Vịt kho gừng — món mới");
  await dialog.getByRole("button", { name: "Nhận món", exact: true }).click();
  await expect(p2.getByText(/Đã nhận xong: thêm 1 món mới/)).toBeVisible();

  // Receiving it again adds nothing.
  await p2.getByLabel("Chọn tệp gửi món").setInputFiles(file);
  await expect(p2.getByText(/Máy đã có đủ các món trong tệp này \(Vịt kho gừng\)/)).toBeVisible();

  // It arrived whole — photo, both versions, the labels — and without the sender's journal.
  await p2.goto("/cong-thuc/");
  await expect(p2.locator("main h3")).toHaveCount(11);
  await p2.getByRole("link", { name: /Vịt kho gừng/ }).click();
  await expect(p2.getByRole("img", { name: "Vịt kho gừng" })).toBeVisible();
  await expect(p2.getByText("Mới nhập – chưa nấu thử")).toBeVisible();
  await expect(p2.getByText("Nước mắm: 2 muỗng canh (bản gốc: 1 muỗng canh)")).toBeVisible();
  await expect(p2.getByText("Đã nấu 0 lần.")).toBeVisible();
  await p2.goto("/nhat-ky/");
  await expect(p2.getByText("Chưa có lần nấu nào")).toBeVisible();

  // Receiving can be undone.
  await p2.goto("/cai-dat/");
  await p2.getByRole("button", { name: "Hoàn tác lần nhận món gần nhất" }).click();
  await p2.getByRole("dialog").getByRole("button", { name: "Hoàn tác", exact: true }).click();
  await expect(p2.getByText("Đã trả lại dữ liệu như trước khi nhận món.")).toBeVisible();
  await p2.goto("/cong-thuc/");
  await expect(p2.locator("main h3")).toHaveCount(10);
  await other.close();

  // A full backup of the first phone carries the photo.
  await page.goto("/cai-dat/");
  const backingUp = page.waitForEvent("download");
  await page.getByRole("button", { name: "Sao lưu ngay" }).click();
  await (await backingUp).saveAs(testInfo.outputPath("sao-luu.zip"));
  await page.getByLabel("Chọn tệp sao lưu").setInputFiles(testInfo.outputPath("sao-luu.zip"));
  await expect(page.getByRole("dialog")).toContainText("Gồm 11 món, 1 lần nấu, 1 ảnh.");

  expect(outside, "requests to other servers").toEqual([]);
});

test("the editor fits a phone at the largest text size, and a sample is never overwritten", async ({ page }) => {
  await page.goto("/cai-dat/");
  await page.getByRole("button", { name: "Cực lớn" }).click();
  await page.goto("/cong-thuc/");
  await page.getByRole("link", { name: /Cá kho tộ/ }).click();
  await page.getByRole("link", { name: /Sửa món/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sửa món: Cá kho tộ");
  const noSideScroll = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  for (const name of ["2. Nguyên liệu", "3. Dụng cụ", "4. Các bước", "5. Nguồn"]) {
    await page.getByRole("button", { name }).click();
    expect(await noSideScroll(), `${name} has no horizontal scroll`).toBe(true);
  }
  // Opening a sample and saving without touching anything changes nothing.
  await page.getByRole("button", { name: "Xem lại và lưu" }).first().click();
  await expect(page.getByText("Mẹ chưa sửa gì.")).toBeVisible();

  // A real change to a sample becomes "Bản nhà mình"; the sample itself stays as it was.
  await page.getByRole("button", { name: "4. Các bước" }).click();
  await page.getByLabel("Tên bước 1", { exact: true }).fill("Rửa cá thật sạch");
  await page.getByRole("button", { name: "Xem lại và lưu" }).first().click();
  await expect(page.getByText(/Máy sẽ lưu thành “Bản nhà mình” mới/)).toBeVisible();
  await page.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect(page.getByText("1. Rửa cá thật sạch")).toBeVisible();
  await expect(page.getByText("Mẫu – chưa kiểm chứng").first()).toBeVisible();
  await page.getByRole("radio", { name: "Bản gốc" }).click();
  await expect(page.getByText("1. Rửa cá cho hết tanh")).toBeVisible();
});
