"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { FeedbackOptions, type FeedbackId } from "@/components/ui/feedback-option";
import { IngredientRow } from "@/components/ui/ingredient-row";
import { PhotoTile } from "@/components/ui/photo-tile";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { RecipeCard, RecipeCardSkeleton } from "@/components/ui/recipe-card";
import { SearchField } from "@/components/ui/search-field";
import { Banner, EmptyState, ErrorState } from "@/components/ui/states";
import { Avoid, DoneWhen, StepProgress } from "@/components/ui/step";
import { TabBar } from "@/components/ui/tab-bar";
import { TimerBar, TimerButton } from "@/components/ui/timer";
import { VersionBadge, VersionSwitch } from "@/components/ui/version";
import { MicButton, SpeakButton, type MicState } from "@/components/ui/voice";
import { formatAmount, formatMetric } from "@/lib/quantity";

const SCALES = [
  { id: "lon", label: "Lớn" },
  { id: "rat_lon", label: "Rất lớn" },
  { id: "cuc_lon", label: "Cực lớn" },
] as const;

const MIC_STATES: MicState[] = ["idle", "listening", "processing", "understood", "not_understood", "unavailable"];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-border pt-6">
      <h2 className="text-xl">{title}</h2>
      {children}
    </section>
  );
}

export function Showcase() {
  const [scale, setScale] = useState<(typeof SCALES)[number]["id"]>("lon");
  const [query, setQuery] = useState("ca kho");
  const [chips, setChips] = useState<string[]>(["Thịt heo", "Trứng"]);
  const [version, setVersion] = useState<"family" | "original">("family");
  const [servings, setServings] = useState(4);
  const [fishSauce, setFishSauce] = useState(1.5);
  const [ticked, setTicked] = useState<Record<string, boolean>>({ dau: true });
  const [feedback, setFeedback] = useState<FeedbackId | null>(null);
  const [mic, setMic] = useState<MicState>("idle");

  // The real app sets this once from the saved setting; here it follows the chips above.
  useEffect(() => {
    const saved = document.documentElement.getAttribute("data-text-scale");
    document.documentElement.setAttribute("data-text-scale", scale);
    return () => {
      if (saved) document.documentElement.setAttribute("data-text-scale", saved);
      else document.documentElement.removeAttribute("data-text-scale");
    };
  }, [scale]);
  const toggleChip = (c: string) => setChips((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));

  return (
    <>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8">
        <header className="flex flex-col gap-3">
          <h1 className="text-display">Bộ giao diện Bếp Nhà</h1>
          <p className="text-text-muted">
            Trang kiểm tra thiết kế: các thành phần cơ bản và trạng thái của chúng. Dữ liệu trên trang này chỉ để minh hoạ, không phải công thức đã kiểm chứng.
          </p>
          <div role="radiogroup" aria-label="Cỡ chữ" className="flex flex-wrap gap-3">
            {SCALES.map((s) => (
              <Chip key={s.id} selected={scale === s.id} onClick={() => setScale(s.id)}>
                Chữ {s.label.toLowerCase()}
              </Chip>
            ))}
          </div>
        </header>

        <Section title="Chữ">
          <p className="text-display">Phi thơm hành và tỏi</p>
          <p className="text-xl">Cá kho tộ — tiêu đề màn hình</p>
          <p className="text-lg">Nước mắm, đường, tiêu — tên nguyên liệu</p>
          <p className="text-cook">Đợi dầu nóng vừa rồi cho hành, tỏi vào. Đảo đều tay đến khi vàng nhạt.</p>
          <p>Chữ thường: Mẹ nêm lại cho vừa ăn, nếu nhạt thì thêm nửa muỗng cà phê nước mắm.</p>
          <p className="text-sm text-text-muted">Chữ nhỏ nhất: Nguồn tham khảo · ễ ặ ỡ ữ ộ ẩ ỳ</p>
        </Section>

        <Section title="Nút bấm">
          <div className="flex flex-wrap gap-3">
            <Button>Lưu bản nhà mình</Button>
            <Button variant="secondary">So sánh với bản gốc</Button>
            <Button variant="quiet">Xem lịch sử</Button>
            <Button variant="danger">Xoá món này</Button>
            <Button disabled>Chưa thể lưu</Button>
            <Button loading>Đang lưu</Button>
          </div>
          <Button size="lg" fullWidth icon={<Play aria-hidden className="size-7" />}>
            Bắt đầu nấu
          </Button>
        </Section>

        <Section title="Tìm món và chọn nguyên liệu">
          <SearchField label="Tìm món ăn" value={query} onChange={setQuery} placeholder="Ví dụ: cá kho, canh chua" />
          <div className="flex flex-wrap gap-3">
            {["Thịt heo", "Trứng", "Cà chua", "Đậu hũ", "Cá"].map((c) => (
              <Chip key={c} selected={chips.includes(c)} onClick={() => toggleChip(c)}>
                {c}
              </Chip>
            ))}
            <Chip disabled>Hết hàng</Chip>
          </div>
        </Section>

        <Section title="Thẻ món ăn">
          <div className="grid gap-4 sm:grid-cols-2">
            <RecipeCard href="/design" name="Cá kho tộ" totalMinutes={50} servings={4} badge="family" />
            <RecipeCard href="/design" name="Canh chua cá" totalMinutes={35} servings={4} badge="sample" imageUrl="/khong-co-anh-nay.jpg" />
            <RecipeCardSkeleton />
          </div>
          <div className="flex flex-wrap gap-2">
            <VersionBadge kind="family" />
            <VersionBadge kind="original" />
            <VersionBadge kind="sample" />
            <VersionBadge kind="approved" />
          </div>
          <div className="max-w-60">
            <PhotoTile name="Thịt kho trứng" />
          </div>
        </Section>

        <Section title="Phiên bản và định lượng">
          <VersionSwitch value={version} onChange={setVersion} />
          <p className="text-lg">Số người ăn</p>
          <QuantityStepper name="số người ăn" value={servings} unit={null} step={1} min={1} max={30} onChange={setServings} />
          <p className="text-lg">Nước mắm</p>
          <QuantityStepper name="nước mắm" value={fishSauce} unit="muong_canh" step={0.25} min={0.25} max={10} original={2} onChange={setFishSauce} />
        </Section>

        <Section title="Nguyên liệu">
          <div className="rounded-lg bg-surface p-2 shadow-card">
            <IngredientRow name="Cá" amount={formatAmount(500, "g")} prepNote="cắt khúc 3 cm" />
            <IngredientRow name="Nước mắm" amount={formatAmount(fishSauce, "muong_canh")} metric={formatMetric(fishSauce * 15, "ml")} />
            <IngredientRow name="Ớt" amount={formatAmount(1, "trai")} optional />
          </div>
          <p className="text-lg">Danh sách có đánh dấu (trong lúc nấu)</p>
          <div className="rounded-lg bg-surface-warm p-2">
            {[
              { id: "dau", name: "Dầu ăn", amount: formatAmount(1, "muong_canh"), metric: formatMetric(15, "ml") },
              { id: "hanh", name: "Hành tím", amount: formatAmount(2, "cu"), prepNote: "băm nhỏ" },
              { id: "toi", name: "Tỏi", amount: formatAmount(3, "tep"), prepNote: "băm nhỏ" },
            ].map((i) => (
              <IngredientRow key={i.id} {...i} checked={ticked[i.id] ?? false} onCheckedChange={(v) => setTicked((t) => ({ ...t, [i.id]: v }))} />
            ))}
          </div>
        </Section>

        <Section title="Bước nấu">
          <div className="flex flex-col gap-4 rounded-lg bg-cook-bg p-4 shadow-card">
            <StepProgress current={3} total={8} />
            <p className="text-display">Phi thơm hành và tỏi</p>
            <ol className="flex list-decimal flex-col gap-3 pl-8 text-cook">
              <li>Cho 1 muỗng canh dầu ăn vào chảo, bật lửa vừa.</li>
              <li>Dầu nóng thì cho hành và tỏi vào.</li>
              <li>Đảo đều tay.</li>
            </ol>
            <DoneWhen>hành tỏi vàng nhạt, dậy mùi thơm.</DoneWhen>
            <Avoid>lửa lớn — tỏi cháy sẽ bị đắng.</Avoid>
            <div className="flex flex-wrap gap-3">
              <TimerButton minutes={2} />
              <SpeakButton />
              <SpeakButton speaking />
            </div>
            <SpeakButton available={false} />
          </div>
        </Section>

        <Section title="Hẹn giờ">
          <TimerBar label="Kho cá lửa nhỏ" remainingSeconds={754} state="running" />
          <TimerBar label="Kho cá lửa nhỏ" remainingSeconds={754} state="paused" />
          <TimerBar label="Kho cá lửa nhỏ" remainingSeconds={0} state="finished" />
        </Section>

        <Section title="Giọng nói">
          <div className="flex flex-wrap gap-3">
            {MIC_STATES.map((s) => (
              <Chip key={s} selected={mic === s} onClick={() => setMic(s)}>
                {s}
              </Chip>
            ))}
          </div>
          <MicButton state={mic} heard="tiếp theo" onPress={() => setMic(mic === "listening" ? "processing" : "listening")} />
        </Section>

        <Section title="Đánh giá sau khi nấu">
          <p className="text-xl">Gia đình mình thấy món ăn hôm nay thế nào?</p>
          <FeedbackOptions value={feedback} onChange={setFeedback} />
        </Section>

        <Section title="Thông báo và trạng thái">
          <Banner>Đã lưu bản nhà mình.</Banner>
          <Banner kind="offline">Mất mạng — đã lưu trên máy, sẽ gửi lên khi có mạng lại.</Banner>
          <Banner kind="backup" action={<Button variant="secondary">Sao lưu</Button>}>
            Đã hơn 30 ngày chưa sao lưu.
          </Banner>
          <Banner kind="error">Chưa lưu được. Mẹ thử lại giúp con nhé.</Banner>
          <EmptyState title="Chưa có món yêu thích" action={<Button>Xem công thức</Button>}>
            Bấm hình trái tim ở món mình thích để lưu vào đây.
          </EmptyState>
          <ErrorState>Không tải được công thức. Có thể mạng đang yếu.</ErrorState>
        </Section>
      </main>
      <TabBar current="cooking" cookingStep={3} className="sticky bottom-0" />
    </>
  );
}
