import type { Equipment, Ingredient, RecipeSource, Step } from "../types";

// SAMPLE RECIPE — written by the app's author as a starting point, in the common Southern
// home style. It has NOT been cooked and checked by the family. It is stored with
// verification = "sample" and shown as "Mẫu – chưa kiểm chứng" until the family approves it.

export const name = "Cá kho tộ";
export const description = "Cá kho đậm đà, nước kho sánh, ăn với cơm nóng. Món mặn quen thuộc của bữa cơm miền Nam.";
export const categories = ["Món kho", "Món ăn gia đình"];
export const servings = 4;
export const prepMinutes = 20;
export const cookMinutes = 35;

export const source: RecipeSource = {
  kind: "sample",
  title: "Công thức mẫu của ứng dụng",
  fidelity: "own",
  note: "Chưa nấu thử. Mẹ nấu rồi chỉnh lại cho đúng khẩu vị nhà mình.",
};

export const ingredients: Ingredient[] = [
  { slot: "ca", name: "Cá (cá basa, cá lóc hoặc cá trê)", kind: "food", group: "Nguyên liệu", quantity: 500, unit: "g", metricQuantity: null, metricUnit: null, prepNote: "cắt khúc dày khoảng 3 cm" },
  { slot: "thit_ba_chi", name: "Thịt ba chỉ", kind: "food", group: "Nguyên liệu", quantity: 100, unit: "g", metricQuantity: null, metricUnit: null, optional: true, prepNote: "cắt miếng mỏng" },
  { slot: "hanh_tim", name: "Hành tím", kind: "food", group: "Nguyên liệu", quantity: 3, unit: "cu", metricQuantity: null, metricUnit: null, prepNote: "băm nhỏ" },
  { slot: "toi", name: "Tỏi", kind: "food", group: "Nguyên liệu", quantity: 3, unit: "tep", metricQuantity: null, metricUnit: null, prepNote: "băm nhỏ" },
  { slot: "ot", name: "Ớt", kind: "food", group: "Nguyên liệu", quantity: 1, unit: "trai", metricQuantity: null, metricUnit: null, optional: true, tasteRole: "spicy" },
  { slot: "hanh_la", name: "Hành lá", kind: "food", group: "Nguyên liệu", quantity: 2, unit: "nhanh", metricQuantity: null, metricUnit: null, prepNote: "cắt nhỏ" },
  { slot: "nuoc_mam", name: "Nước mắm", kind: "seasoning", group: "Gia vị", quantity: 2, unit: "muong_canh", metricQuantity: 30, metricUnit: "ml", tasteRole: "salty" },
  { slot: "duong", name: "Đường", kind: "seasoning", group: "Gia vị", quantity: 1, unit: "muong_canh", metricQuantity: 12, metricUnit: "g", tasteRole: "sweet" },
  { slot: "duong_thang", name: "Đường thắng nước màu", kind: "seasoning", group: "Gia vị", quantity: 1, unit: "muong_canh", metricQuantity: 12, metricUnit: "g" },
  { slot: "tieu", name: "Tiêu xay", kind: "seasoning", group: "Gia vị", quantity: 0.5, unit: "muong_ca_phe", metricQuantity: null, metricUnit: null, tasteRole: "spicy" },
  { slot: "dau_an", name: "Dầu ăn", kind: "seasoning", group: "Gia vị", quantity: 1, unit: "muong_canh", metricQuantity: 15, metricUnit: "ml", tasteRole: "rich" },
  { slot: "nuoc", name: "Nước dừa tươi hoặc nước lọc", kind: "food", group: "Nguyên liệu", quantity: 200, unit: "ml", metricQuantity: null, metricUnit: null },
];

export const equipment: Equipment[] = [
  { name: "Bếp gas hoặc bếp từ", kind: "appliance", required: true },
  { name: "Nồi đất (tộ) hoặc nồi nhỏ đáy dày", kind: "utensil", required: true, alternative: "Không có nồi đất thì dùng nồi đáy dày, lửa nhỏ hơn một chút." },
  { name: "Dao, thớt", kind: "utensil", required: true },
  { name: "Muỗng canh, muỗng cà phê", kind: "utensil", required: true },
];

export const steps: Step[] = [
  {
    no: 1,
    phase: "prep",
    title: "Rửa cá cho hết tanh",
    instructions: ["Chà cá với một ít muối, rửa lại bằng nước sạch.", "Để cá thật ráo nước."],
    doneWhen: "cá hết nhớt, sờ không còn trơn.",
    avoid: "cá còn ướt — khi kho sẽ ra nước, nhạt và dễ tanh.",
    uses: [{ slot: "ca", portion: 1 }],
  },
  {
    no: 2,
    phase: "prep",
    title: "Ướp cá",
    instructions: ["Cho cá vào tô.", "Thêm {nuoc_mam}, {duong}, {tieu} và một nửa hành tỏi băm.", "Trộn nhẹ tay cho đều rồi để yên."],
    doneWhen: "cá ngấm gia vị, sau khoảng 15 phút.",
    avoid: "trộn mạnh tay làm cá nát.",
    timerSeconds: 900,
    timerLabel: "Ướp cá",
    uses: [
      { slot: "nuoc_mam", portion: 1 },
      { slot: "duong", portion: 1 },
      { slot: "tieu", portion: 1 },
      { slot: "hanh_tim", portion: 0.5 },
      { slot: "toi", portion: 0.5 },
    ],
  },
  {
    no: 3,
    phase: "cook",
    title: "Thắng nước màu",
    instructions: ["Bắc nồi lên bếp, lửa nhỏ.", "Cho {dau_an} và {duong_thang} vào.", "Khuấy nhẹ đến khi đường tan và đổi màu."],
    doneWhen: "đường chuyển màu nâu cánh gián, thơm mùi caramel.",
    avoid: "để quá lửa — đường cháy đen sẽ bị đắng. Thấy vừa ngả nâu là làm bước tiếp theo ngay.",
    ifWrong: "Nếu đường đã cháy đen và có mùi khét, mẹ bỏ đi, rửa nồi rồi thắng lại.",
    heat: "low",
    uses: [
      { slot: "dau_an", portion: 1 },
      { slot: "duong_thang", portion: 1 },
    ],
  },
  {
    no: 4,
    phase: "cook",
    title: "Phi thơm hành tỏi, cho cá vào",
    instructions: ["Cho phần hành tỏi còn lại vào nồi, đảo nhanh.", "Xếp cá (và thịt ba chỉ nếu có) vào nồi.", "Để yên khoảng 2 phút rồi trở mặt cá một lần."],
    doneWhen: "hành tỏi thơm, cá săn lại và áo màu nâu vàng.",
    avoid: "đảo nhiều — cá sẽ nát.",
    heat: "medium",
    timerSeconds: 120,
    timerLabel: "Cho cá săn lại",
    uses: [
      { slot: "hanh_tim", portion: 0.5 },
      { slot: "toi", portion: 0.5 },
      { slot: "ca", portion: 1 },
      { slot: "thit_ba_chi", portion: 1 },
    ],
  },
  {
    no: 5,
    phase: "cook",
    title: "Thêm nước, kho lửa nhỏ",
    instructions: ["Đổ phần nước ướp cá còn trong tô và {nuoc} vào nồi.", "Đun sôi rồi hạ lửa nhỏ.", "Kho không đậy nắp, thỉnh thoảng múc nước kho rưới lên cá."],
    doneWhen: "nước kho rút còn khoảng một nửa, hơi sánh, cá thấm màu nâu đẹp.",
    avoid: "lửa lớn — nước cạn nhanh mà cá chưa thấm, dễ khét đáy nồi.",
    ifWrong: "Nước cạn quá nhanh thì thêm 2–3 muỗng canh nước nóng.",
    heat: "low",
    timerSeconds: 1500,
    timerLabel: "Kho cá lửa nhỏ",
    uses: [{ slot: "nuoc", portion: 1 }],
  },
  {
    no: 6,
    phase: "finish",
    title: "Nêm lại và hoàn tất",
    instructions: ["Nếm thử nước kho.", "Mặn thì thêm chút nước và đường; nhạt thì thêm nửa muỗng cà phê nước mắm.", "Rắc {hanh_la}, thêm {ot} nếu thích cay, rồi tắt bếp."],
    doneWhen: "nước kho sánh, vị mặn ngọt hài hoà, vừa ăn với cơm.",
    avoid: "nêm khi nước kho còn nhiều — lúc cạn lại sẽ mặn hơn.",
    heat: "off",
    uses: [
      { slot: "hanh_la", portion: 1 },
      { slot: "ot", portion: 1 },
    ],
  },
];

export const notes = "Nồi đất giữ nhiệt tốt nên cá thấm đều. Kho xong để nguội bớt rồi hâm lại, cá sẽ ngon hơn.";
export const tasteTips = "Hơi mặn: lần sau bớt nước mắm ½ muỗng canh. Hơi ngọt: bớt đường ½ muỗng canh. Muốn đậm màu hơn: thắng nước màu sậm hơn một chút.";
