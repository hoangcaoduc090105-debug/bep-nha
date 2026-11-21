"use client";

import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { Download, Send, Upload, Undo2, Volume2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BackLink } from "@/components/back-link";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Banner, EmptyState } from "@/components/ui/states";
import { archiveRecipe, deleteRecipeForever, getSetting, listRecipes, setSetting } from "@/data/repo";
import type { Recipe } from "@/data/types";
import { BackupError, createBackup, handOver, inspectBackup, latestRestorePoint, markBackedUp, restoreBackup, undoRestore, type BackupSummary } from "@/features/backup";
import { formatDateTime } from "@/lib/labels";
import { DEFAULTS, TEXT_SCALES, VOICE_RATES, type TextScale } from "@/lib/settings";
import { useSpeech } from "@/features/voice/tts";

type Notice = { kind: "info" | "error"; text: string } | null;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-border pt-6">
      <h2 className="text-xl">{title}</h2>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const settings = useLiveQuery(async () => ({
    textScale: await getSetting<TextScale>("textScale", DEFAULTS.textScale),
    voiceRate: await getSetting("voiceRate", DEFAULTS.voiceRate),
    autoRead: await getSetting("autoRead", DEFAULTS.autoRead),
    addressAs: await getSetting("addressAs", DEFAULTS.addressAs),
    lastBackupAt: await getSetting<string | null>("lastBackupAt", null),
    unsavedSince: await getSetting<string | null>("unsavedSince", null),
  }), []);

  return (
    <AppShell tab="home">
      <BackLink href="/">Trang chủ</BackLink>
      <h1 className="text-display">Cài đặt</h1>
      {settings && (
        <>
          <Section title="Cỡ chữ">
            <div role="radiogroup" aria-label="Cỡ chữ" className="flex flex-wrap gap-3">
              {TEXT_SCALES.map((s) => (
                <Chip key={s.id} selected={settings.textScale === s.id} onClick={() => void setSetting("textScale", s.id)}>
                  {s.label}
                </Chip>
              ))}
            </div>
            <p className="text-cook">Chữ hướng dẫn khi nấu sẽ to như thế này.</p>
          </Section>

          <Section title="Giọng đọc">
            <p>Tốc độ đọc</p>
            <div role="radiogroup" aria-label="Tốc độ đọc" className="flex flex-wrap gap-3">
              {VOICE_RATES.map((r) => (
                <Chip key={r.value} selected={settings.voiceRate === r.value} onClick={() => void setSetting("voiceRate", r.value)}>
                  {r.label}
                </Chip>
              ))}
            </div>
            <Chip selected={settings.autoRead} onClick={() => void setSetting("autoRead", !settings.autoRead)}>
              Tự đọc khi sang bước mới
            </Chip>
            <VoiceCheck rate={settings.voiceRate} />
          </Section>

          <Section title="Cách xưng hô">
            <p className="text-text-muted">Ứng dụng sẽ gọi người nấu là:</p>
            <div className="flex flex-wrap gap-3">
              {["mẹ", "má", "bà", "cô", "chị"].map((a) => (
                <Chip key={a} selected={settings.addressAs === a} onClick={() => void setSetting("addressAs", a)}>
                  {a}
                </Chip>
              ))}
            </div>
          </Section>

          <Section title="Gửi và nhận món">
            <p className="text-text-muted">Gửi công thức sang điện thoại khác, hoặc nhận món người nhà gửi qua.</p>
            <Link href="/cai-dat/mon/" className="inline-flex min-h-target items-center justify-center gap-3 rounded-md border-2 border-border-input bg-surface px-6 text-lg font-semibold active:bg-surface-warm">
              <Send aria-hidden className="size-6" /> Gửi và nhận món
            </Link>
          </Section>

          <BackupSection lastBackupAt={settings.lastBackupAt} unsavedSince={settings.unsavedSince} />
        </>
      )}
      <ArchivedSection />
      <StorageSection />
    </AppShell>
  );
}

const VOICE_SAMPLE = "Bước 2. Ướp cá. Cho cá vào tô. Thêm 1 muỗng canh rưỡi nước mắm và nửa muỗng cà phê tiêu. Được khi cá ngấm gia vị, sau khoảng 15 phút.";

/** Says which voice the phone gives the app, lets her hear it, and explains how to get a better one. */
function VoiceCheck({ rate }: { rate: number }) {
  const speech = useSpeech(rate);
  if (speech.available === null) return null;
  if (!speech.available) return <Banner>Máy này chưa có giọng đọc tiếng Việt, nên nút “Đọc” chưa dùng được.</Banner>;
  return (
    <>
      <p>
        Đang dùng giọng: {speech.voiceName} ({speech.betterVoice ? "loại hay hơn" : "loại thường"}).
      </p>
      <Button variant="secondary" className="self-start" icon={<Volume2 aria-hidden className="size-6" />} onClick={() => (speech.speaking ? speech.stop() : speech.speak(VOICE_SAMPLE))}>
        {speech.speaking ? "Dừng đọc" : "Nghe thử"}
      </Button>
      {!speech.betterVoice && (
        <p className="text-text-muted">Giọng đọc là giọng có sẵn của điện thoại. Muốn nghe hay hơn: mở Cài đặt của iPhone, vào Trợ năng, tìm phần giọng đọc tiếng Việt và tải về giọng loại “Nâng cao” (miễn phí). Tải xong, đóng hẳn Bếp Nhà rồi mở lại.</p>
      )}
    </>
  );
}

function BackupSection({ lastBackupAt, unsavedSince }: { lastBackupAt: string | null; unsavedSince: string | null }) {
  const [busy, setBusy] = useState<"backup" | "restore" | "undo" | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, setPending] = useState<{ bytes: Uint8Array; summary: BackupSummary } | null>(null);
  const [askUndo, setAskUndo] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const restorePoint = useLiveQuery(() => latestRestorePoint(), []);

  const fail = (e: unknown, fallback: string) => setNotice({ kind: "error", text: e instanceof BackupError ? e.message : fallback });

  const backup = async () => {
    setBusy("backup");
    setNotice(null);
    try {
      const { bytes, fileName, createdAt } = await createBackup();
      if (await handOver(bytes, fileName)) {
        await markBackedUp(createdAt);
        setNotice({ kind: "info", text: `Đã tạo tệp sao lưu “${fileName}”. Mẹ nhớ cất tệp ở nơi an toàn, ví dụ iCloud Drive.` });
      } else {
        setNotice({ kind: "info", text: "Chưa lưu tệp sao lưu. Mẹ bấm “Sao lưu ngay” lần nữa khi sẵn sàng." });
      }
    } catch (e) {
      fail(e, "Chưa sao lưu được. Mẹ thử lại nhé.");
    }
    setBusy(null);
  };

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    setNotice(null);
    setBusy("restore");
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      setPending({ bytes, summary: await inspectBackup(bytes) });
    } catch (e) {
      fail(e, "Không đọc được tệp này.");
    }
    setBusy(null);
    if (fileInput.current) fileInput.current.value = "";
  };

  const restore = async () => {
    if (!pending) return;
    setBusy("restore");
    try {
      const s = await restoreBackup(pending.bytes);
      setNotice({ kind: "info", text: `Đã khôi phục: ${s.recipes} món, ${s.sessions} lần nấu, ${s.images} ảnh.` });
    } catch (e) {
      fail(e, "Chưa khôi phục được. Dữ liệu hiện tại vẫn còn nguyên.");
    }
    setPending(null);
    setBusy(null);
  };

  const undo = async () => {
    setBusy("undo");
    const what = restorePoint?.reason === "Trước khi nhận món" ? "nhận món" : "khôi phục";
    try {
      await undoRestore();
      setNotice({ kind: "info", text: `Đã trả lại dữ liệu như trước khi ${what}.` });
    } catch (e) {
      fail(e, "Chưa hoàn tác được.");
    }
    setAskUndo(false);
    setBusy(null);
  };

  return (
    <Section title="Sao lưu">
      <p className="text-lg font-normal">
        {lastBackupAt ? `Lần sao lưu gần nhất: ${formatDateTime(lastBackupAt)}.` : "Chưa sao lưu lần nào."}
        {unsavedSince ? " Có thay đổi chưa được sao lưu." : lastBackupAt ? " Mọi thứ đã được sao lưu." : ""}
      </p>
      <p className="text-text-muted">Công thức, nhật ký và ảnh chỉ nằm trên máy này. Tệp sao lưu giúp lấy lại khi đổi điện thoại hoặc khi trình duyệt bị xoá dữ liệu. Ứng dụng không tự sao lưu được — mẹ cần bấm nút.</p>
      {notice && <Banner kind={notice.kind}>{notice.text}</Banner>}
      <Button size="lg" fullWidth loading={busy === "backup"} icon={<Download aria-hidden className="size-7" />} onClick={() => void backup()}>
        Sao lưu ngay
      </Button>
      <input ref={fileInput} type="file" accept=".zip,application/zip" className="sr-only" aria-label="Chọn tệp sao lưu" tabIndex={-1} onChange={(e) => void pickFile(e.target.files?.[0])} />
      <Button variant="secondary" fullWidth loading={busy === "restore" && !pending} icon={<Upload aria-hidden className="size-6" />} onClick={() => fileInput.current?.click()}>
        Khôi phục từ tệp sao lưu
      </Button>
      {restorePoint && (
        <Button variant="secondary" fullWidth icon={<Undo2 aria-hidden className="size-6" />} onClick={() => setAskUndo(true)}>
          {restorePoint.reason === "Trước khi nhận món" ? "Hoàn tác lần nhận món gần nhất" : "Hoàn tác lần khôi phục gần nhất"}
        </Button>
      )}

      <ConfirmDialog open={pending != null} title="Khôi phục từ bản sao lưu này?" confirmLabel="Khôi phục" cancelLabel="Không, giữ dữ liệu hiện tại" busy={busy === "restore"} onConfirm={() => void restore()} onCancel={() => setPending(null)}>
        {pending && (
          <>
            <p>Bản sao lưu tạo lúc {formatDateTime(pending.summary.createdAt)}.</p>
            <p>
              Gồm {pending.summary.recipes} món, {pending.summary.sessions} lần nấu, {pending.summary.images} ảnh.
            </p>
            <p>Dữ liệu đang có trên máy sẽ được thay bằng bản này. Sau đó vẫn hoàn tác được.</p>
          </>
        )}
      </ConfirmDialog>
      <ConfirmDialog open={askUndo} title={restorePoint?.reason === "Trước khi nhận món" ? "Hoàn tác lần nhận món gần nhất?" : "Hoàn tác lần khôi phục gần nhất?"} confirmLabel="Hoàn tác" busy={busy === "undo"} onConfirm={() => void undo()} onCancel={() => setAskUndo(false)}>
        {restorePoint && <p>Dữ liệu sẽ trở lại như lúc {formatDateTime(restorePoint.createdAt)}.</p>}
      </ConfirmDialog>
    </Section>
  );
}

function ArchivedSection() {
  const archived = useLiveQuery(() => listRecipes({ archived: true }), []);
  const [toDelete, setToDelete] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);

  const removeForever = async () => {
    if (!toDelete) return;
    try {
      await deleteRecipeForever(toDelete.id);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chưa xoá được.");
    }
    setToDelete(null);
  };

  return (
    <Section title="Món đã xoá">
      {error && <Banner kind="error">{error}</Banner>}
      {archived && archived.length === 0 && <EmptyState title="Không có món nào đã xoá" />}
      {archived?.map((r) => (
        <div key={r.id} className="flex flex-col gap-3 rounded-lg bg-surface p-4 shadow-card">
          <p className="text-lg">{r.name}</p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void archiveRecipe(r.id, false)}>Khôi phục món này</Button>
            <Button variant="danger" onClick={() => setToDelete(r)}>
              Xoá hẳn
            </Button>
          </div>
        </div>
      ))}
      <ConfirmDialog open={toDelete != null} title={`Xoá hẳn món “${toDelete?.name ?? ""}”?`} confirmLabel="Xoá hẳn món này" danger onConfirm={() => void removeForever()} onCancel={() => setToDelete(null)}>
        <p>Món sẽ mất hẳn và không lấy lại được. Món đã từng nấu thì không xoá hẳn được, để giữ nhật ký.</p>
      </ConfirmDialog>
    </Section>
  );
}

function StorageSection() {
  const [info, setInfo] = useState<{ installed: boolean; persisted: boolean | null } | null>(null);
  useEffect(() => {
    let alive = true;
    const installed = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    void (navigator.storage?.persisted?.() ?? Promise.resolve(null)).then((persisted) => {
      if (alive) setInfo({ installed, persisted });
    });
    return () => {
      alive = false;
    };
  }, []);
  if (!info) return null;
  return (
    <Section title="Lưu trữ trên máy">
      {info.installed ? (
        <Banner>Ứng dụng đang chạy từ màn hình chính. Dữ liệu được giữ lâu dài trên máy.</Banner>
      ) : (
        <Banner kind="offline">Ứng dụng đang mở trong trình duyệt. Trên iPhone, Safari có thể xoá dữ liệu nếu khoảng một tuần không mở. Nên thêm Bếp Nhà vào màn hình chính: bấm nút Chia sẻ của Safari → “Thêm vào Màn hình chính”.</Banner>
      )}
      {info.persisted === false && <p className="text-text-muted">Trình duyệt chưa cam kết giữ dữ liệu lâu dài, nên mẹ nhớ sao lưu thường xuyên.</p>}
    </Section>
  );
}
