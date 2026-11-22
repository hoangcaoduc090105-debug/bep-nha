import { expect, test } from "./fixtures";

// Finishing a meal asks nothing of her: she can end it without saying how it was.
test("a meal can end without a rating", async ({ page }) => {
  await page.goto("/cong-thuc/");
  await page.getByRole("link", { name: /Tôm rim mặn ngọt/ }).click();
  await page.getByRole("button", { name: "Bắt đầu nấu" }).click();
  await page.getByRole("button", { name: "Bắt đầu bước 1" }).click();
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "Tiếp theo" }).click();
  await page.getByRole("button", { name: "Nấu xong" }).click();
  await expect(page.getByRole("button", { name: "Lưu vào nhật ký" })).toBeDisabled();
  await page.getByRole("button", { name: "Xong, không ghi nhận xét" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Đã lưu vào nhật ký");
  await expect(page.getByText("Tôm rim mặn ngọt (Cô Ba): đã nấu xong.")).toBeVisible();
  // No rating, so nothing is asked: neither approving the dish nor adjusting it.
  await expect(page.getByRole("button", { name: "Có, nhà mình duyệt món này" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Chỉnh cho lần sau" })).toHaveCount(0);

  // Nothing is left half-cooked, and the meal is in the journal.
  await page.getByRole("link", { name: "Về trang chủ" }).click();
  await expect(page.getByRole("heading", { name: "Mới nấu gần đây" })).toBeVisible();
  await expect(page.getByText("Đang nấu dở")).toHaveCount(0);
  await page.getByRole("link", { name: "Nhật ký", exact: true }).click();
  await expect(page.locator("main li").first()).toContainText("Tôm rim mặn ngọt (Cô Ba)");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow, "horizontal scroll on the journal").toBe(false);
});
