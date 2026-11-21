"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { AppShell } from "@/components/app-shell";
import { EmptyState, Skeleton } from "@/components/ui/states";
import { listJournal } from "@/data/repo";
import { formatDateTime, VERDICT_LABELS, versionName } from "@/lib/labels";

export default function JournalPage() {
  const entries = useLiveQuery(() => listJournal(), []);
  return (
    <AppShell tab="journal">
      <h1 className="text-xl">Nhật ký nấu ăn</h1>
      {entries === undefined ? (
        <Skeleton className="h-32 w-full" />
      ) : entries.length === 0 ? (
        <EmptyState title="Chưa có lần nấu nào">Sau mỗi lần nấu xong, món ăn và nhận xét của nhà mình sẽ được ghi lại ở đây.</EmptyState>
      ) : (
        <ol className="flex flex-col gap-4">
          {entries.map(({ session, recipe, version }) => (
            <li key={session.id} className="flex flex-col gap-1 rounded-lg bg-surface p-4 shadow-card">
              <p className="text-sm text-text-muted">{formatDateTime(session.startedAt)}</p>
              <h2 className="text-lg">{recipe?.name ?? "Món đã xoá"}</h2>
              <p>
                {version ? versionName(version) : "Không rõ phiên bản"} · {session.servings} người
              </p>
              {session.feedback && <p className="text-lg">{VERDICT_LABELS[session.feedback.verdict]}</p>}
              {session.feedback?.note && <p className="text-text-muted">“{session.feedback.note}”</p>}
              {recipe && !recipe.isArchived && (
                <Link href={`/cong-thuc/mon/?id=${recipe.id}`} className="inline-flex min-h-target items-center self-start text-lg font-medium text-accent underline">
                  Mở công thức
                </Link>
              )}
            </li>
          ))}
        </ol>
      )}
    </AppShell>
  );
}
