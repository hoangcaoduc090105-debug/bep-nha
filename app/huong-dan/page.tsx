"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { BookOpen, ChefHat, CirclePlay, ClipboardCheck, Dices, PartyPopper, Volume2, type LucideIcon } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BackLink } from "@/components/back-link";
import { BrandLogo } from "@/components/brand-logo";
import { getSetting } from "@/data/repo";
import { DEFAULTS } from "@/lib/settings";

type Card = { Icon: LucideIcon; title: string; lines: (who: string) => string[] };

// The whole way from "what shall I cook" to "done", one card per moment, in the words on the
// buttons she will see. Kept short on purpose: it is read once, standing in the kitchen.
const CARDS: Card[] = [
  {
    Icon: Dices,
    title: "Chọn món",
    lines: (who) => [`Chưa biết nấu gì thì bấm “Hôm nay nấu gì?” ở trang chủ: máy chọn giúp ${who} một món mặn và một món canh.`, `Đã có món trong đầu thì vào “Công thức”, gõ tên món — không cần gõ dấu.`],
  },
  {
    Icon: ClipboardCheck,
    title: "Soạn nguyên liệu",
    lines: (who) => [`Mở món ra rồi bấm “Bắt đầu nấu”. Máy liệt kê từng thứ và lượng cần có.`, `Soạn xong thứ nào, ${who} chạm vào dòng đó để đánh dấu.`, `Nhà đông người hơn thì bấm dấu + ở “Số người ăn” trước khi nấu, lượng tự tính lại.`],
  },
  {
    Icon: ChefHat,
    title: "Nấu theo từng bước",
    lines: (who) => [`Mỗi màn hình là một bước, chữ to. Làm xong thì bấm “Tiếp theo”.`, `Ô “Được khi” cho ${who} biết nhìn thấy gì là được; ô “Tránh” nhắc chỗ dễ hư.`, `Lỡ tắt máy giữa chừng cũng không sao: mở lại là thấy “Đang nấu dở”.`],
  },
  {
    Icon: Volume2,
    title: "Nghe đọc và hẹn giờ",
    lines: () => [`Tay đang dơ thì bấm “Đọc”: máy đọc bước đó lên.`, `Bước nào cần canh giờ có nút “Hẹn giờ”. Tới giờ máy reo, khỏi phải nhìn đồng hồ.`],
  },
  {
    Icon: CirclePlay,
    title: "Xem video của kênh",
    lines: (who) => [`Bấm “Xem đoạn video của bước này” để xem kênh làm đúng bước đó. Cần có mạng.`, `Nếu hiện quảng cáo, ${who} chờ vài giây rồi bấm “Skip”.`, `Con số ${who} làm theo luôn là số ở mục “Cần dùng” trên màn hình.`],
  },
  {
    Icon: PartyPopper,
    title: "Nấu xong",
    lines: (who) => [`Bấm “Nấu xong”. ${who[0].toUpperCase()}${who.slice(1)} ghi món ngon hay chưa cũng được, không ghi cũng được.`, `Món đã nấu nằm trong “Nhật ký”; món ưng ý thì bấm “Thêm vào yêu thích” để lần sau dễ tìm.`],
  },
];

export default function GuidePage() {
  const who = useLiveQuery(() => getSetting("addressAs", DEFAULTS.addressAs), []) ?? DEFAULTS.addressAs;
  return (
    <AppShell tab="home">
      <BackLink href="/">Trang chủ</BackLink>
      <div className="flex items-center gap-4">
        <BrandLogo alt="" className="size-20" />
        <h1 className="text-display">Cách dùng Bếp Nhà</h1>
      </div>
      <p className="text-lg text-text-muted">Sáu việc, đi từ lúc chưa biết nấu gì tới lúc dọn cơm.</p>
      <ol className="flex flex-col gap-4">
        {CARDS.map(({ Icon, title, lines }, n) => (
          <li key={title} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-card">
            <div className="flex items-center gap-4">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-pill bg-accent-soft text-accent">
                <Icon aria-hidden className="size-9" />
              </span>
              <h2 className="text-xl">
                <span className="text-text-muted">{n + 1}. </span>
                {title}
              </h2>
            </div>
            <ul className="flex list-disc flex-col gap-2 pl-7 text-lg">
              {lines(who).map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <Link href="/" className="flex min-h-target-lg items-center justify-center gap-3 rounded-md bg-accent px-6 text-lg font-semibold text-on-accent">
        <BookOpen aria-hidden className="size-7" /> Về trang chủ chọn món
      </Link>
    </AppShell>
  );
}
