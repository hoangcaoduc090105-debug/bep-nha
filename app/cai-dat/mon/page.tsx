"use client";

import { useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Download, Send } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BackLink } from "@/components/back-link";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Banner, EmptyState } from "@/components/ui/states";
import { listRecipes } from "@/data/repo";
import { BackupError, handOver } from "@/features/backup";
import { createRecipePack, importRecipePack, inspectRecipePack, type PackSummary } from "@/features/backup/pack";
import { formatDateTime } from "@/lib/labels";

type Notice = { kind: "info" | "error"; text: string } | null;

function describe(s: PackSummary): string {
  const parts: string[] = [];
  if (s.added > 0) parts.push(`thêm ${s.added} món mới`);
  if (s.newVersions > 0) parts.push(`thêm ${s.newVersions} phiên bản cho món đã có`);
  const same = s.dishes.filter((d) => d.status === "existing" && d.newVersions === 0).length;
  if (same > 0) parts.push(`${same} món đã có sẵn, giữ nguyên`);
  return parts.join("; ");
}

export default function PackPage() {
  return (
    <AppShell tab="home">
      <BackLink href="/cai-dat/">Cài đặt</BackLink>
      <h1 className="text-display">Gửi và nhận món</h1>
      <p className="text-text-muted">Gửi công thức sang điện thoại khác bằng một tệp, qua Zalo, AirDrop hay thư điện tử. Tệp chỉ có công thức và ảnh món, không có nhật ký nấu.</p>
      <ReceiveSection />
      <SendSection />
    </AppShell>
  );
}

function ReceiveSection() {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, setPending] = useState<{ bytes: Uint8Array; summary: PackSummary } | null>(null);
  const fail = (e: unknown, fallback: string) => setNotice({ kind: "error", text: e instanceof BackupError ? e.message : fallback });

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setNotice(null);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const summary = await inspectRecipePack(bytes);
      if (summary.added === 0 && summary.newVersions === 0) setNotice({ kind: "info", text: `Máy đã có đủ các món trong tệp này (${summary.dishes.map((d) => d.name).join(", ")}). Không cần thêm gì.` });
      else setPending({ bytes, summary });
    } catch (e) {
      fail(e, "Không đọc được tệp này.");
    }
    setBusy(false);
    if (input.current) input.current.value = "";
  };

  const receive = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      const s = await importRecipePack(pending.bytes);
      setNotice({ kind: "info", text: `Đã nhận xong: ${describe(s)}. Nếu nhận nhầm, mẹ vào Cài đặt → Sao lưu để hoàn tác.` });
    } catch (e) {
      fail(e, "Chưa nhận được. Dữ liệu trên máy vẫn còn nguyên.");
    }
    setPending(null);
    setBusy(false);
  };

  return (
    <section className="flex flex-col gap-3 border-t border-border pt-6">
      <h2 className="text-xl">Nhận món</h2>
      <p className="text-text-muted">Lưu tệp nhận được vào máy (trên iPhone: “Lưu vào Tệp”), rồi bấm nút dưới đây và chọn tệp đó. Món đang có trên máy không bị thay đổi.</p>
      {notice && <Banner kind={notice.kind}>{notice.text}</Banner>}
      <input ref={input} type="file" accept=".zip,application/zip" className="sr-only" aria-label="Chọn tệp gửi món" tabIndex={-1} onChange={(e) => void pick(e.target.files?.[0])} />
      <Button size="lg" fullWidth loading={busy && !pending} icon={<Download aria-hidden className="size-7" />} onClick={() => input.current?.click()}>
        Nhận món từ tệp
      </Button>
      <ConfirmDialog open={pending != null} title="Nhận các món này?" confirmLabel="Nhận món" cancelLabel="Không nhận" busy={busy} onConfirm={() => void receive()} onCancel={() => setPending(null)}>
        {pending && (
          <>
            <p>Tệp tạo lúc {formatDateTime(pending.summary.createdAt)}.</p>
            <ul className="flex list-disc flex-col gap-1 pl-6">
              {pending.summary.dishes.map((d, i) => (
                <li key={i}>
                  {d.name} — {d.status === "new" ? "món mới" : d.newVersions > 0 ? `đã có, thêm ${d.newVersions} phiên bản` : "đã có sẵn, giữ nguyên"}
                </li>
              ))}
            </ul>
            <p>Máy chỉ thêm vào, không ghi đè món nào đang có. Sau đó vẫn hoàn tác được.</p>
          </>
        )}
      </ConfirmDialog>
    </section>
  );
}

function SendSection() {
  const recipes = useLiveQuery(() => listRecipes(), []);
  const [chosen, setChosen] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const toggle = (id: string) => setChosen((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const send = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const { bytes, fileName, names } = await createRecipePack(chosen);
      if (await handOver(bytes, fileName, names.length === 1 ? `Món ${names[0]}` : `${names.length} món từ Bếp Nhà`)) {
        setNotice({ kind: "info", text: `Đã tạo tệp “${fileName}” gồm ${names.length} món. Mẹ gửi tệp này cho máy bên kia.` });
        setChosen([]);
      } else setNotice({ kind: "info", text: "Chưa gửi tệp. Mẹ bấm lại khi sẵn sàng." });
    } catch (e) {
      setNotice({ kind: "error", text: e instanceof BackupError ? e.message : "Chưa tạo được tệp gửi món. Mẹ thử lại nhé." });
    }
    setBusy(false);
  };

  return (
    <section className="flex flex-col gap-3 border-t border-border pt-6">
      <h2 className="text-xl">Gửi món</h2>
      <p className="text-text-muted">Bấm vào những món muốn gửi.</p>
      {recipes && recipes.length === 0 && <EmptyState title="Chưa có công thức nào để gửi" />}
      {recipes && recipes.length > 0 && (
        <>
          <div className="flex flex-wrap gap-3">
            <Button variant="quiet" onClick={() => setChosen(recipes.map((r) => r.id))}>
              Chọn tất cả
            </Button>
            {chosen.length > 0 && (
              <Button variant="quiet" onClick={() => setChosen([])}>
                Bỏ chọn hết
              </Button>
            )}
          </div>
          <div role="group" aria-label="Chọn món để gửi" className="flex flex-wrap gap-3">
            {recipes.map((r) => (
              <Chip key={r.id} selected={chosen.includes(r.id)} onClick={() => toggle(r.id)}>
                {r.name}
              </Chip>
            ))}
          </div>
        </>
      )}
      {notice && <Banner kind={notice.kind}>{notice.text}</Banner>}
      <Button size="lg" fullWidth disabled={chosen.length === 0} loading={busy} icon={<Send aria-hidden className="size-7" />} onClick={() => void send()}>
        {chosen.length === 0 ? "Tạo tệp gửi món" : `Tạo tệp gửi ${chosen.length} món`}
      </Button>
    </section>
  );
}
