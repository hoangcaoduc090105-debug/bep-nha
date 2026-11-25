import { expect, test } from "./fixtures";
import { SEED_RECIPES } from "../data/seed";

const SOUPS = SEED_RECIPES.filter((s) => s.categories.includes("Món canh")).map((s) => s.name);
const count = (group: string) => SEED_RECIPES.filter((s) => s.categories.includes(group)).length;

// She often does not know what to cook: one press suggests a meal, and asks nothing of her.
test("“Hôm nay nấu gì?” suggests a dish and a soup; either can be changed; the dish opens from there", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Chưa biết nấu gì?")).toBeVisible();
  await page.getByRole("button", { name: "Hôm nay nấu gì?" }).click();

  const box = page.getByRole("region", { name: "Gợi ý hôm nay nấu gì" });
  const main = box.getByRole("link").first();
  const soup = box.getByRole("link").nth(1);
  await expect(box.getByRole("link")).toHaveCount(2);
  const soupName = (await soup.innerText()).split("\n")[0];
  const mainName = (await main.innerText()).split("\n")[0];
  expect(SOUPS, "the second dish is a soup").toContain(soupName);
  expect(SOUPS, "the first dish is not a soup").not.toContain(mainName);

  // Another soup: the dish to eat with rice stays, the soup is a different one.
  await box.getByRole("button", { name: "Đổi món canh khác" }).click();
  await expect(box.getByRole("button", { name: "Chọn mâm khác" })).toBeEnabled();
  await expect(main).toContainText(mainName);
  const otherSoup = (await soup.innerText()).split("\n")[0];
  expect(otherSoup).not.toBe(soupName);
  expect(SOUPS).toContain(otherSoup);

  // A whole other meal: both change.
  await box.getByRole("button", { name: "Chọn mâm khác" }).click();
  await expect(box.getByRole("button", { name: "Chọn mâm khác" })).toBeEnabled();
  expect((await main.innerText()).split("\n")[0]).not.toBe(mainName);
  expect((await soup.innerText()).split("\n")[0]).not.toBe(otherSoup);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow, "horizontal scroll on the home page").toBe(false);

  const chosen = (await main.innerText()).split("\n")[0];
  await main.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(chosen);
  await expect(page.getByRole("button", { name: "Bắt đầu nấu" })).toBeVisible();
});

test("the list is sorted by kind of dish, and can be narrowed by what the dish is made of", async ({ page }) => {
  await page.goto("/cong-thuc/");
  await expect(page.locator("main h3")).toHaveCount(SEED_RECIPES.length);
  // Headings in a fixed order, each with its number of dishes.
  await expect(page.locator("main h2")).toHaveText([`Món mặn${count("Món mặn")} món`, `Món canh${count("Món canh")} món`, `Món xào${count("Món xào")} món`, `Món chiên${count("Món chiên")} món`, `Món bánh${count("Món bánh")} món`]);
  await expect(page.getByRole("region", { name: "Món canh" }).locator("h3")).toHaveCount(count("Món canh"));
  await expect(page.getByRole("button", { name: "Món ăn gia đình" })).toHaveCount(0);

  await page.getByRole("group", { name: "Nguyên liệu chính" }).getByRole("button", { name: "Thịt bò" }).click();
  await expect(page.locator("main h3")).toHaveText(["Cà ri bò (Tú Lê)", "Thịt bò xào bông cải (Tú Lê)", "Thịt bò xào đậu que (Tú Lê)", "Thịt bò xào măng tây (Tú Lê)"]);
  // Both at once: beef, and only the stir-fries.
  await page.getByRole("group", { name: "Loại món" }).getByRole("button", { name: "Món xào" }).click();
  await expect(page.locator("main h3")).toHaveText(["Thịt bò xào bông cải (Tú Lê)", "Thịt bò xào đậu que (Tú Lê)", "Thịt bò xào măng tây (Tú Lê)"]);
  await page.getByRole("group", { name: "Nguyên liệu chính" }).getByRole("button", { name: "Thịt bò" }).click();
  await expect(page.locator("main h3")).toHaveCount(count("Món xào"));
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow, "horizontal scroll on the list").toBe(false);
});
