import type { Equipment, Ingredient, RecipeSource, Step, StepUse, Unit } from "../types";

// SAMPLE RECIPES — written for this app in the common Southern home style, for 4 people.
// None has been cooked and checked by the family. All are stored as verification = "sample"
// and shown as "Mẫu – chưa kiểm chứng" until the family confirms them after cooking.

export type Seed = {
  seedId: string;
  name: string;
  description: string;
  categories: string[];
  servings: number;
  prepMinutes: number;
  cookMinutes: number;
  source: RecipeSource;
  ingredients: Ingredient[];
  steps: Step[];
  equipment: Equipment[];
  notes: string;
  tasteTips: string;
};

export const SAMPLE_SOURCE: RecipeSource = {
  kind: "sample",
  title: "Công thức mẫu của ứng dụng",
  fidelity: "own",
  note: "Chưa nấu thử. Mẹ nấu rồi chỉnh lại cho đúng khẩu vị nhà mình.",
};

type Extra = Partial<Pick<Ingredient, "optional" | "prepNote" | "tasteRole" | "scales">>;
const food = (slot: string, name: string, quantity: number, unit: Unit, extra: Extra = {}): Ingredient => ({ slot, name, kind: "food", group: "Nguyên liệu", quantity, unit, metricQuantity: null, metricUnit: null, ...extra });
const season = (slot: string, name: string, quantity: number, unit: Unit, metric: [number, "g" | "ml"] | null, extra: Extra = {}): Ingredient => ({ slot, name, kind: "seasoning", group: "Gia vị", quantity, unit, metricQuantity: metric?.[0] ?? null, metricUnit: metric?.[1] ?? null, ...extra });

const all = (...slots: string[]): StepUse[] => slots.map((slot) => ({ slot, portion: 1 }));
const half = (...slots: string[]): StepUse[] => slots.map((slot) => ({ slot, portion: 0.5 }));
type StepExtra = Partial<Pick<Step, "ifWrong" | "timerSeconds" | "timerLabel" | "heat">>;
const step = (no: number, phase: Step["phase"], title: string, instructions: string[], doneWhen: string, avoid: string, uses: StepUse[], extra: StepExtra = {}): Step => ({ no, phase, title, instructions, doneWhen, avoid, uses, ...extra });

const STOVE: Equipment = { name: "Bếp gas hoặc bếp từ", kind: "appliance", required: true };
const KNIFE: Equipment = { name: "Dao, thớt", kind: "utensil", required: true };
const SPOONS: Equipment = { name: "Muỗng canh, muỗng cà phê", kind: "utensil", required: true };
const pot = (name: string): Equipment => ({ name, kind: "utensil", required: true });

const fishSauce = (q: number) => season("nuoc_mam", "Nước mắm", q, "muong_canh", [q * 15, "ml"], { tasteRole: "salty" });
const sugarSpoon = (q: number) => season("duong", "Đường", q, "muong_canh", [q * 12, "g"], { tasteRole: "sweet" });
const sugarTea = (q: number) => season("duong", "Đường", q, "muong_ca_phe", [q * 4, "g"], { tasteRole: "sweet" });
const salt = (q: number) => season("muoi", "Muối", q, "muong_ca_phe", [q * 5, "g"], { tasteRole: "salty" });
const pepper = (q: number) => season("tieu", "Tiêu xay", q, "muong_ca_phe", null, { tasteRole: "spicy" });
const oil = (q: number) => season("dau_an", "Dầu ăn", q, "muong_canh", [q * 15, "ml"], { tasteRole: "rich" });
const shallot = (q: number) => food("hanh_tim", "Hành tím", q, "cu", { prepNote: "băm nhỏ" });
const garlic = (q: number) => food("toi", "Tỏi", q, "tep", { prepNote: "băm nhỏ" });
const scallion = (q: number) => food("hanh_la", "Hành lá", q, "nhanh", { prepNote: "cắt nhỏ" });

export const MORE_SEEDS: Seed[] = [
  {
    seedId: "thit-kho-trung",
    name: "Thịt kho trứng",
    description: "Thịt ba chỉ kho mềm với trứng và nước dừa, nước kho trong, vị mặn ngọt dịu.",
    categories: ["Món kho", "Món ăn gia đình"],
    servings: 4,
    prepMinutes: 25,
    cookMinutes: 80,
    source: SAMPLE_SOURCE,
    ingredients: [
      food("thit_ba_chi", "Thịt ba chỉ", 500, "g", { prepNote: "cắt miếng vuông khoảng 4 cm" }),
      food("trung", "Trứng vịt", 6, "trai"),
      food("nuoc_dua", "Nước dừa tươi", 500, "ml"),
      shallot(3),
      garlic(3),
      fishSauce(3),
      sugarSpoon(1),
      pepper(0.5),
    ],
    equipment: [STOVE, pot("Nồi vừa có nắp"), KNIFE, SPOONS],
    steps: [
      step(1, "prep", "Luộc trứng", ["Cho {trung} vào nồi nước lạnh, bật bếp.", "Nước sôi thì luộc thêm 10 phút.", "Vớt ra ngâm nước lạnh rồi bóc vỏ."], "trứng chín hẳn, bóc vỏ dễ, lòng trắng không rách.", "bóc trứng khi còn nóng — dễ bị rỗ mặt.", all("trung"), { timerSeconds: 600, timerLabel: "Luộc trứng" }),
      step(2, "prep", "Chần thịt", ["Đun một nồi nước sôi.", "Cho thịt vào chần khoảng 2 phút.", "Vớt ra rửa lại bằng nước sạch, để ráo."], "thịt đổi màu trắng, nước chần nổi bọt đục.", "chần quá lâu — thịt mất ngọt.", all("thit_ba_chi")),
      step(3, "prep", "Ướp thịt", ["Cho thịt vào tô.", "Thêm {nuoc_mam}, {duong}, {tieu}, hành tím và tỏi băm.", "Trộn đều rồi để yên."], "thịt ngấm gia vị, sau khoảng 20 phút.", "ướp vội dưới 10 phút — thịt kho xong nhạt bên trong.", all("nuoc_mam", "duong", "tieu", "hanh_tim", "toi"), { timerSeconds: 1200, timerLabel: "Ướp thịt" }),
      step(4, "cook", "Xào săn thịt", ["Bắc nồi lên bếp, lửa vừa.", "Cho thịt vào đảo đều tay 3–4 phút."], "mặt ngoài miếng thịt săn lại, hơi ra mỡ.", "lửa lớn làm gia vị cháy khét đáy nồi.", [], { heat: "medium" }),
      step(5, "cook", "Đổ nước dừa, kho lửa nhỏ", ["Đổ {nuoc_dua} vào, thêm nước lọc nếu chưa ngập thịt.", "Đun sôi, hớt bọt cho nước trong.", "Hạ lửa nhỏ, mở hé nắp và kho."], "thịt mềm, xiên đũa qua dễ dàng; nước kho rút bớt và ngả màu nâu nhạt.", "đậy kín nắp và để lửa lớn — nước kho bị đục.", all("nuoc_dua"), { heat: "low", timerSeconds: 2700, timerLabel: "Kho thịt" }),
      step(6, "finish", "Cho trứng vào, nêm lại", ["Cho trứng đã bóc vỏ vào nồi.", "Kho thêm 20 phút cho trứng thấm màu.", "Nếm nước kho: mặn thì thêm chút nước dừa, nhạt thì thêm nửa muỗng canh nước mắm."], "trứng ngả màu nâu vàng, nước kho vị mặn ngọt vừa ăn.", "nêm quá sớm — nước cạn lại sẽ mặn hơn.", [], { heat: "low", timerSeconds: 1200, timerLabel: "Kho trứng" }),
    ],
    notes: "Kho xong để qua bữa sau hâm lại, thịt và trứng thấm hơn.",
    tasteTips: "Hơi mặn: lần sau bớt nước mắm ½ muỗng canh. Hơi ngọt: bớt đường hoặc thay một phần nước dừa bằng nước lọc.",
  },
  {
    seedId: "canh-chua-ca",
    name: "Canh chua cá",
    description: "Canh chua kiểu miền Nam với cá, thơm, cà chua, đậu bắp và giá, vị chua ngọt thanh.",
    categories: ["Món canh", "Món ăn gia đình"],
    servings: 4,
    prepMinutes: 20,
    cookMinutes: 20,
    source: SAMPLE_SOURCE,
    ingredients: [
      food("ca", "Cá (cá lóc hoặc cá basa)", 400, "g", { prepNote: "cắt khúc" }),
      food("ca_chua", "Cà chua", 2, "trai", { prepNote: "cắt múi cau" }),
      food("thom", "Thơm (khóm)", 150, "g", { prepNote: "cắt miếng mỏng" }),
      food("dau_bap", "Đậu bắp", 6, "trai", { prepNote: "cắt xéo" }),
      food("gia", "Giá", 100, "g"),
      food("me", "Me chín", 30, "g"),
      food("rau_thom", "Ngò gai, rau om", 1, "bo", { prepNote: "cắt nhỏ" }),
      garlic(2),
      food("nuoc", "Nước", 1200, "ml"),
      fishSauce(2),
      sugarSpoon(2),
      salt(0.5),
      oil(1),
    ],
    equipment: [STOVE, pot("Nồi canh"), KNIFE, SPOONS],
    steps: [
      step(1, "prep", "Dầm me lấy nước chua", ["Cho {me} vào chén với nửa chén nước nóng.", "Dầm cho me tan rồi lọc bỏ hột."], "được một chén nước me sệt, màu nâu.", "để sót hột và xơ me trong nước canh.", all("me")),
      step(2, "cook", "Phi tỏi", ["Cho {dau_an} vào nồi, lửa vừa.", "Phi tỏi băm cho vàng thơm rồi vớt ra chén riêng."], "tỏi vàng nhạt, dậy mùi thơm.", "phi quá tay — tỏi cháy sẽ đắng.", all("dau_an", "toi"), { heat: "medium" }),
      step(3, "cook", "Nấu nước canh", ["Đổ {nuoc} vào nồi, đun sôi.", "Cho nước me, thơm và cà chua vào.", "Nấu khoảng 3 phút."], "nước canh sôi lại, có màu vàng cam nhạt và mùi thơm của thơm.", "cho hết nước me một lần — nên để lại một ít để chỉnh độ chua sau.", all("nuoc", "thom", "ca_chua"), { heat: "high" }),
      step(4, "cook", "Cho cá vào", ["Thả cá vào khi nước đang sôi.", "Hạ lửa vừa, nấu 6–7 phút.", "Hớt bọt cho nước trong, không khuấy mạnh."], "thịt cá chuyển màu trắng đục, tách khỏi xương dễ.", "thả cá khi nước chưa sôi — canh sẽ tanh; khuấy nhiều làm cá nát.", all("ca"), { heat: "medium", timerSeconds: 420, timerLabel: "Nấu cá" }),
      step(5, "cook", "Nêm canh", ["Thêm {nuoc_mam}, {duong} và {muoi}.", "Nếm thử: canh chua cần đủ ba vị chua, ngọt, mặn."], "nước canh chua thanh, hậu ngọt, không gắt.", "nêm một lần quá tay — nêm từ từ rồi nếm lại.", all("nuoc_mam", "duong", "muoi")),
      step(6, "finish", "Cho rau, tắt bếp", ["Cho đậu bắp vào nấu 2 phút.", "Cho giá vào, đợi sôi lại thì tắt bếp ngay.", "Rắc ngò gai, rau om và tỏi phi lên trên."], "đậu bắp chín tới còn xanh, giá còn giòn.", "nấu giá lâu — giá mềm nhũn, mất ngon.", all("dau_bap", "gia", "rau_thom"), { heat: "off" }),
    ],
    notes: "Múc cá ra dĩa riêng, chấm nước mắm nguyên chất dằm ớt.",
    tasteTips: "Hơi chua: thêm đường từng nửa muỗng. Hơi ngọt: lần sau bớt đường 1 muỗng canh. Nhạt: thêm nước mắm từng nửa muỗng canh.",
  },
  {
    seedId: "suon-xao-chua-ngot",
    name: "Sườn xào chua ngọt",
    description: "Sườn non chiên vàng rồi rim với nước sốt chua ngọt sánh, bám đều từng miếng.",
    categories: ["Món xào", "Món ăn gia đình"],
    servings: 4,
    prepMinutes: 25,
    cookMinutes: 30,
    source: SAMPLE_SOURCE,
    ingredients: [
      food("suon", "Sườn non", 500, "g", { prepNote: "chặt khúc vừa ăn" }),
      garlic(4),
      shallot(2),
      scallion(2),
      food("nuoc", "Nước", 100, "ml"),
      fishSauce(1.5),
      sugarSpoon(2),
      season("giam", "Giấm (hoặc nước cốt chanh)", 1.5, "muong_canh", [22.5, "ml"], { tasteRole: "sour" }),
      salt(0.5),
      pepper(0.25),
      oil(2),
    ],
    equipment: [STOVE, pot("Chảo sâu lòng"), pot("Nồi nhỏ để chần"), KNIFE, SPOONS],
    steps: [
      step(1, "prep", "Chần sườn", ["Đun nước sôi, cho sườn vào chần 3 phút.", "Vớt ra rửa sạch, để thật ráo."], "sườn đổi màu, hết bọt bẩn.", "sườn còn ướt khi chiên — dầu sẽ bắn.", all("suon"), { timerSeconds: 180, timerLabel: "Chần sườn" }),
      step(2, "prep", "Ướp sườn", ["Ướp sườn với {muoi} và {tieu}.", "Để yên khoảng 15 phút."], "sườn ngấm, mặt hơi se lại.", "ướp bằng nước mắm lúc này — khi chiên dễ cháy.", all("muoi", "tieu"), { timerSeconds: 900, timerLabel: "Ướp sườn" }),
      step(3, "prep", "Pha nước sốt", ["Cho vào chén: {nuoc_mam}, {duong}, {giam} và {nuoc}.", "Khuấy cho tan đường."], "đường tan hết, nếm thấy chua ngọt rõ, hơi mặn.", "bỏ qua bước nếm — nước sốt quyết định vị của món.", all("nuoc_mam", "duong", "giam", "nuoc")),
      step(4, "cook", "Chiên sườn", ["Cho {dau_an} vào chảo, lửa vừa.", "Xếp sườn vào chiên, trở đều các mặt."], "sườn vàng nâu đều các mặt, sau khoảng 8–9 phút.", "lửa lớn — sườn cháy ngoài mà sống trong.", all("dau_an"), { heat: "medium", timerSeconds: 540, timerLabel: "Chiên sườn" }),
      step(5, "cook", "Rim với nước sốt", ["Gạt sườn sang một bên, phi thơm hành tím và tỏi.", "Đổ nước sốt vào, đảo đều.", "Hạ lửa nhỏ, rim và thỉnh thoảng đảo."], "nước sốt sệt lại, bóng và bám quanh miếng sườn.", "bỏ đi lâu không đảo — đường dễ cháy khét.", all("hanh_tim", "toi"), { heat: "low", timerSeconds: 660, timerLabel: "Rim sườn", ifWrong: "Sốt cạn mà sườn chưa mềm thì thêm 2–3 muỗng canh nước, rim tiếp." }),
      step(6, "finish", "Hoàn tất", ["Nếm lại, chỉnh chua ngọt cho vừa.", "Rắc {hanh_la}, đảo đều rồi tắt bếp."], "sườn bóng, vị chua ngọt hài hoà, mềm vừa.", "rim khô kiệt — sườn sẽ cứng.", all("hanh_la"), { heat: "off" }),
    ],
    notes: "Thích có màu đỏ đẹp có thể thêm 1 muỗng canh tương cà vào nước sốt.",
    tasteTips: "Hơi ngọt: bớt đường ½ muỗng canh. Chưa đủ chua: thêm giấm ½ muỗng canh. Hơi mặn: bớt nước mắm ½ muỗng canh.",
  },
  {
    seedId: "thit-rang-chay-canh",
    name: "Thịt rang cháy cạnh",
    description: "Thịt ba chỉ thái mỏng rang săn, cạnh vàng xém, thấm nước mắm đường — món mặn nhanh gọn.",
    categories: ["Món xào", "Món ăn gia đình"],
    servings: 4,
    prepMinutes: 10,
    cookMinutes: 15,
    source: SAMPLE_SOURCE,
    ingredients: [food("thit_ba_chi", "Thịt ba chỉ", 400, "g", { prepNote: "thái lát mỏng khoảng nửa phân" }), shallot(3), garlic(2), scallion(2), food("ot", "Ớt", 1, "trai", { optional: true, tasteRole: "spicy" }), fishSauce(1.5), sugarTea(1), pepper(0.5)],
    equipment: [STOVE, pot("Chảo đáy dày"), KNIFE, SPOONS],
    steps: [
      step(1, "prep", "Thái thịt", ["Thái thịt thành lát mỏng.", "Thấm cho thịt thật ráo."], "lát thịt mỏng đều, khô ráo.", "thái dày — khó cháy cạnh và lâu mềm.", all("thit_ba_chi")),
      step(2, "cook", "Rang thịt", ["Làm nóng chảo, không cần dầu.", "Cho thịt vào, dàn đều, lửa vừa.", "Đảo thỉnh thoảng để thịt ra mỡ."], "thịt săn lại, ra mỡ, cạnh bắt đầu vàng xém.", "đảo liên tục — thịt không kịp cháy cạnh.", [], { heat: "medium", timerSeconds: 420, timerLabel: "Rang thịt" }),
      step(3, "cook", "Chắt bớt mỡ", ["Nghiêng chảo, múc bớt mỡ ra chén.", "Để lại khoảng 1 muỗng canh mỡ trong chảo."], "chảo chỉ còn một lớp mỡ mỏng.", "để nguyên mỡ — món ăn sẽ ngấy.", []),
      step(4, "cook", "Phi hành tỏi", ["Gạt thịt sang một bên.", "Cho hành tím và tỏi vào phi khoảng 1 phút rồi đảo chung."], "hành tỏi thơm, vàng nhạt.", "để hành tỏi cháy đen.", all("hanh_tim", "toi")),
      step(5, "cook", "Nêm cho thấm", ["Rưới {nuoc_mam} quanh thành chảo, rắc {duong}.", "Đảo đều khoảng 2 phút."], "nước mắm keo lại, áo quanh miếng thịt, màu nâu bóng.", "đổ nước mắm thẳng lên thịt khi chảo nguội — thịt bị nồng.", all("nuoc_mam", "duong"), { heat: "medium" }),
      step(6, "finish", "Hoàn tất", ["Rắc {tieu} và {hanh_la}, thêm ớt nếu thích.", "Đảo đều rồi tắt bếp."], "thịt thơm, cạnh giòn nhẹ, vị mặn ngọt vừa cơm.", "rang tiếp quá lâu — thịt khô và cứng.", all("tieu", "hanh_la", "ot"), { heat: "off" }),
    ],
    notes: "Phần mỡ chắt ra có thể giữ lại để xào rau.",
    tasteTips: "Hơi mặn: bớt nước mắm ½ muỗng canh. Muốn đậm hơn: thêm ½ muỗng cà phê đường để dễ lên màu.",
  },
  {
    seedId: "ga-kho-gung",
    name: "Gà kho gừng",
    description: "Thịt gà săn chắc kho với gừng thơm ấm, nước kho sánh đậm đà.",
    categories: ["Món kho", "Món ăn gia đình"],
    servings: 4,
    prepMinutes: 30,
    cookMinutes: 30,
    source: SAMPLE_SOURCE,
    ingredients: [food("ga", "Thịt gà (đùi hoặc gà ta)", 600, "g", { prepNote: "chặt miếng vừa ăn" }), food("gung", "Gừng", 40, "g", { prepNote: "thái sợi" }), shallot(3), garlic(2), food("ot", "Ớt", 1, "trai", { optional: true, tasteRole: "spicy" }), food("nuoc", "Nước", 150, "ml"), fishSauce(2), sugarSpoon(1), pepper(0.5), oil(1)],
    equipment: [STOVE, pot("Nồi đáy dày hoặc chảo sâu lòng"), KNIFE, SPOONS],
    steps: [
      step(1, "prep", "Làm sạch gà", ["Chà gà với một ít muối, rửa lại.", "Để thật ráo nước."], "gà hết mùi hôi, khô ráo.", "gà còn ướt — khi xào ra nước, không săn.", all("ga")),
      step(2, "prep", "Ướp gà", ["Cho gà vào tô.", "Thêm {nuoc_mam}, {duong}, {tieu}, hành tím băm và một nửa gừng.", "Trộn đều rồi để yên."], "gà ngấm gia vị, sau khoảng 20 phút.", "ướp quá ít thời gian — gà nhạt bên trong.", [...all("nuoc_mam", "duong", "tieu", "hanh_tim"), ...half("gung")], { timerSeconds: 1200, timerLabel: "Ướp gà" }),
      step(3, "cook", "Phi tỏi và gừng", ["Cho {dau_an} vào nồi, lửa vừa.", "Phi tỏi và phần gừng còn lại."], "gừng tỏi vàng nhạt, thơm nồng.", "để cháy — sẽ đắng.", [...all("dau_an", "toi"), ...half("gung")], { heat: "medium" }),
      step(4, "cook", "Xào săn gà", ["Cho gà vào nồi, đảo đều.", "Xào khoảng 5 phút."], "thịt gà săn lại, da hơi vàng.", "đổ nước vào khi gà chưa săn — thịt dễ bở.", [], { heat: "medium", timerSeconds: 300, timerLabel: "Xào gà" }),
      step(5, "cook", "Kho lửa nhỏ", ["Thêm {nuoc} và phần nước ướp còn lại.", "Đun sôi rồi hạ lửa nhỏ.", "Kho, thỉnh thoảng đảo nhẹ."], "nước kho rút còn ít, sánh lại, gà thấm màu nâu vàng.", "lửa lớn — cạn nhanh, dễ khét.", all("nuoc"), { heat: "low", timerSeconds: 1200, timerLabel: "Kho gà", ifWrong: "Nước cạn mà gà chưa mềm thì thêm 3–4 muỗng canh nước nóng." }),
      step(6, "finish", "Nêm lại", ["Nếm nước kho và chỉnh cho vừa.", "Thêm ớt nếu thích cay, rồi tắt bếp."], "gà mềm, thơm gừng, vị mặn ngọt vừa ăn.", "nêm khi nước còn nhiều — cạn lại sẽ mặn.", all("ot"), { heat: "off" }),
    ],
    notes: "Gà ta thịt chắc nên kho lâu hơn gà công nghiệp khoảng 10 phút.",
    tasteTips: "Hơi mặn: bớt nước mắm ½ muỗng canh. Gừng nồng quá: lần sau giảm còn 30 g.",
  },
  {
    seedId: "tom-rim-thit",
    name: "Tôm rim thịt",
    description: "Tôm và thịt ba chỉ rim mặn ngọt, keo bóng, ăn rất hao cơm.",
    categories: ["Món kho", "Món ăn gia đình"],
    servings: 4,
    prepMinutes: 25,
    cookMinutes: 20,
    source: SAMPLE_SOURCE,
    ingredients: [food("tom", "Tôm tươi", 300, "g", { prepNote: "cắt râu, rút chỉ lưng" }), food("thit_ba_chi", "Thịt ba chỉ", 200, "g", { prepNote: "thái lát mỏng" }), shallot(3), garlic(2), scallion(2), food("nuoc", "Nước", 50, "ml"), fishSauce(2), sugarSpoon(1.5), pepper(0.5), oil(1)],
    equipment: [STOVE, pot("Chảo sâu lòng"), KNIFE, SPOONS],
    steps: [
      step(1, "prep", "Sơ chế tôm", ["Cắt râu, rút chỉ lưng tôm.", "Rửa sạch, để ráo."], "tôm sạch, ráo nước.", "bỏ sót chỉ lưng — ăn bị sạn.", all("tom")),
      step(2, "prep", "Ướp tôm và thịt", ["Cho tôm và thịt vào tô.", "Thêm {nuoc_mam}, {duong}, {tieu} và hành tím băm.", "Trộn đều rồi để yên."], "tôm thịt ngấm gia vị, sau khoảng 15 phút.", "ướp quá 30 phút — tôm bị mặn và bở.", all("thit_ba_chi", "nuoc_mam", "duong", "tieu", "hanh_tim"), { timerSeconds: 900, timerLabel: "Ướp tôm thịt" }),
      step(3, "cook", "Xào thịt", ["Cho {dau_an} vào chảo, phi thơm tỏi.", "Vớt thịt ra khỏi tô ướp cho vào xào trước, lửa vừa."], "thịt săn, hơi vàng cạnh, sau khoảng 5 phút.", "cho tôm vào cùng lúc — tôm chín quá, bị dai.", all("dau_an", "toi"), { heat: "medium", timerSeconds: 300, timerLabel: "Xào thịt" }),
      step(4, "cook", "Cho tôm vào", ["Cho tôm vào chảo.", "Đảo khoảng 2 phút."], "tôm chuyển màu đỏ cam, cong lại.", "đảo mạnh tay làm tôm tróc vỏ.", [], { heat: "medium" }),
      step(5, "cook", "Rim lửa nhỏ", ["Đổ phần nước ướp còn lại và {nuoc} vào.", "Hạ lửa nhỏ, rim và đảo nhẹ."], "nước rim keo lại, bóng, bám quanh tôm thịt.", "rim đến khô kiệt — tôm cứng và mặn.", all("nuoc"), { heat: "low", timerSeconds: 480, timerLabel: "Rim tôm thịt" }),
      step(6, "finish", "Hoàn tất", ["Rắc {hanh_la}, đảo đều.", "Tắt bếp."], "tôm thịt bóng đẹp, vị mặn ngọt đậm đà.", "để trên bếp lâu sau khi đã keo.", all("hanh_la"), { heat: "off" }),
    ],
    notes: "Tôm đất hoặc tôm thẻ nhỏ để nguyên vỏ rim sẽ đậm vị hơn.",
    tasteTips: "Hơi mặn: bớt nước mắm ½ muỗng canh. Hơi ngọt: bớt đường ½ muỗng canh.",
  },
  {
    seedId: "rau-muong-xao-toi",
    name: "Rau muống xào tỏi",
    description: "Rau muống xanh giòn, thơm tỏi — món rau nhanh nhất cho bữa cơm.",
    categories: ["Món xào", "Món ăn gia đình"],
    servings: 4,
    prepMinutes: 10,
    cookMinutes: 5,
    source: SAMPLE_SOURCE,
    ingredients: [food("rau_muong", "Rau muống", 500, "g", { prepNote: "nhặt bỏ gốc già, cắt khúc" }), food("toi", "Tỏi", 5, "tep", { prepNote: "đập dập" }), oil(2), fishSauce(1), sugarTea(0.5), season("muoi", "Muối (để chần rau)", 1, "muong_ca_phe", [5, "g"], { scales: false })],
    equipment: [STOVE, pot("Chảo lớn"), pot("Nồi để chần rau"), SPOONS],
    steps: [
      step(1, "prep", "Nhặt và rửa rau", ["Nhặt rau, bỏ phần gốc già.", "Rửa sạch, để ráo."], "rau sạch, ráo nước.", "rau còn đọng nước — xào sẽ ra nước, không giòn.", all("rau_muong")),
      step(2, "prep", "Chần rau", ["Đun nồi nước sôi, cho {muoi} vào.", "Cho rau vào chần khoảng nửa phút.", "Vớt ra ngâm ngay vào nước lạnh rồi để ráo."], "rau chuyển màu xanh đậm, còn giòn.", "chần lâu — rau mềm nhũn, thâm màu.", all("muoi"), { heat: "high", timerSeconds: 30, timerLabel: "Chần rau" }),
      step(3, "cook", "Phi tỏi", ["Cho {dau_an} vào chảo, lửa vừa.", "Cho tỏi vào phi."], "tỏi vàng, thơm.", "tỏi cháy đen sẽ đắng.", all("dau_an", "toi"), { heat: "medium" }),
      step(4, "cook", "Xào rau lửa lớn", ["Vặn lửa lớn.", "Cho rau vào, đảo nhanh tay."], "rau nóng đều, bóng dầu, vẫn xanh giòn — khoảng 1 phút rưỡi.", "xào lâu hoặc lửa nhỏ — rau ra nước và dai.", [], { heat: "high", timerSeconds: 90, timerLabel: "Xào rau" }),
      step(5, "finish", "Nêm và tắt bếp", ["Thêm {nuoc_mam} và {duong}.", "Đảo đều vài lần rồi tắt bếp, bày ra dĩa ngay."], "rau xanh, giòn, vừa ăn.", "để rau trong chảo nóng — rau tiếp tục chín và thâm lại.", all("nuoc_mam", "duong"), { heat: "off" }),
    ],
    notes: "Không chần cũng được, nhưng chần trước giúp rau xanh và xào nhanh hơn.",
    tasteTips: "Hơi mặn: bớt nước mắm còn ½ muỗng canh. Muốn thơm hơn: thêm 2 tép tỏi.",
  },
  {
    seedId: "canh-bi-nau-tom",
    name: "Canh bí nấu tôm",
    description: "Canh bí xanh nấu tôm tươi, nước trong, ngọt mát, dễ ăn.",
    categories: ["Món canh", "Món ăn gia đình"],
    servings: 4,
    prepMinutes: 20,
    cookMinutes: 15,
    source: SAMPLE_SOURCE,
    ingredients: [food("bi", "Bí xanh (bí đao)", 400, "g", { prepNote: "gọt vỏ, bỏ ruột, cắt miếng vừa ăn" }), food("tom", "Tôm tươi", 150, "g", { prepNote: "bóc vỏ, băm thô" }), shallot(2), food("hanh_ngo", "Hành lá, ngò", 2, "nhanh", { prepNote: "cắt nhỏ" }), food("nuoc", "Nước", 1000, "ml"), fishSauce(1), salt(0.5), pepper(0.25), oil(1)],
    equipment: [STOVE, pot("Nồi canh"), KNIFE, SPOONS],
    steps: [
      step(1, "prep", "Ướp tôm", ["Cho tôm băm vào chén.", "Thêm {tieu}, một nửa muối và một nửa hành tím băm.", "Trộn đều, để yên."], "tôm ngấm gia vị, sau khoảng 10 phút.", "băm tôm quá nhuyễn — canh bị đục.", [...all("tom", "tieu"), ...half("muoi", "hanh_tim")], { timerSeconds: 600, timerLabel: "Ướp tôm" }),
      step(2, "cook", "Xào tôm", ["Cho {dau_an} vào nồi, phi thơm phần hành tím còn lại.", "Cho tôm vào xào 1–2 phút."], "tôm săn lại, chuyển màu hồng.", "xào lâu — tôm khô.", [...all("dau_an"), ...half("hanh_tim")], { heat: "medium" }),
      step(3, "cook", "Đổ nước", ["Đổ {nuoc} vào nồi.", "Đun sôi, hớt bọt."], "nước sôi, trong, có váng dầu hồng nhạt.", "không hớt bọt — nước canh đục.", all("nuoc"), { heat: "high" }),
      step(4, "cook", "Nấu bí", ["Cho bí vào nồi.", "Nấu lửa vừa khoảng 6 phút."], "bí trong lại, mềm nhưng chưa nát.", "nấu quá lâu — bí nhũn, chua nước.", all("bi"), { heat: "medium", timerSeconds: 360, timerLabel: "Nấu bí" }),
      step(5, "finish", "Nêm và tắt bếp", ["Thêm {nuoc_mam} và phần muối còn lại, nếm cho vừa.", "Rắc hành ngò, tắt bếp."], "canh ngọt thanh, vừa ăn.", "đậy nắp khi canh còn nóng — bí tiếp tục chín và nhũn.", [...all("nuoc_mam", "hanh_ngo"), ...half("muoi")], { heat: "off" }),
    ],
    notes: "Có thể thay tôm tươi bằng 30 g tôm khô ngâm mềm.",
    tasteTips: "Nhạt: thêm nước mắm từng nửa muỗng canh. Muốn ngọt nước hơn: tăng tôm lên 200 g.",
  },
  {
    seedId: "dau-hu-sot-ca-chua",
    name: "Đậu hũ sốt cà chua",
    description: "Đậu hũ chiên vàng rim trong sốt cà chua chua ngọt nhẹ — món đơn giản, đưa cơm.",
    categories: ["Món chiên", "Món ăn gia đình"],
    servings: 4,
    prepMinutes: 10,
    cookMinutes: 20,
    source: SAMPLE_SOURCE,
    ingredients: [food("dau_hu", "Đậu hũ trắng", 4, "mieng", { prepNote: "cắt đôi, thấm khô" }), food("ca_chua", "Cà chua chín", 3, "trai", { prepNote: "cắt hạt lựu" }), shallot(2), garlic(2), scallion(2), food("nuoc", "Nước", 100, "ml"), oil(3), fishSauce(1), sugarTea(1), salt(0.25), pepper(0.25)],
    equipment: [STOVE, pot("Chảo chống dính"), KNIFE, SPOONS],
    steps: [
      step(1, "prep", "Chuẩn bị đậu hũ", ["Cắt đôi từng miếng đậu.", "Dùng khăn giấy thấm cho thật khô."], "mặt đậu khô ráo.", "đậu còn ướt — khi chiên dầu bắn và đậu dính chảo.", all("dau_hu")),
      step(2, "cook", "Chiên đậu", ["Cho {dau_an} vào chảo, lửa vừa, đợi dầu nóng.", "Xếp đậu vào chiên, trở khi mặt dưới đã vàng."], "đậu vàng đều các mặt, vỏ hơi giòn — khoảng 7 phút.", "trở đậu quá sớm — đậu dính chảo và vỡ.", all("dau_an"), { heat: "medium", timerSeconds: 420, timerLabel: "Chiên đậu" }),
      step(3, "cook", "Làm sốt cà chua", ["Vớt đậu ra dĩa, chắt bớt dầu, chỉ để lại một lớp mỏng trong chảo.", "Phi thơm hành tím và tỏi.", "Cho cà chua và {muoi} vào xào."], "cà chua mềm nhuyễn, ra nước đỏ — khoảng 4 phút.", "xào cà chưa nhuyễn — sốt lợn cợn, không sánh.", all("hanh_tim", "toi", "ca_chua", "muoi"), { heat: "medium", timerSeconds: 240, timerLabel: "Xào cà chua" }),
      step(4, "cook", "Nêm sốt", ["Thêm {nuoc}, {nuoc_mam} và {duong}.", "Đun sôi, nếm thử."], "sốt sôi, vị chua ngọt nhẹ, hơi mặn.", "cho quá nhiều nước — sốt loãng, không bám đậu.", all("nuoc", "nuoc_mam", "duong")),
      step(5, "cook", "Rim đậu", ["Cho đậu đã chiên vào chảo.", "Hạ lửa nhỏ, rim và trở nhẹ một lần."], "sốt sánh lại, bám quanh miếng đậu — khoảng 5 phút.", "đảo mạnh tay làm đậu vỡ.", [], { heat: "low", timerSeconds: 300, timerLabel: "Rim đậu" }),
      step(6, "finish", "Hoàn tất", ["Rắc {hanh_la} và {tieu}.", "Tắt bếp."], "đậu mềm bên trong, thấm sốt đỏ đẹp.", "rim cạn hết sốt — đậu khô.", all("hanh_la", "tieu"), { heat: "off" }),
    ],
    notes: "Cà chua càng chín đỏ thì sốt càng đẹp màu và ngọt tự nhiên.",
    tasteTips: "Hơi chua: thêm ½ muỗng cà phê đường. Nhạt: thêm nước mắm ½ muỗng canh.",
  },
];
