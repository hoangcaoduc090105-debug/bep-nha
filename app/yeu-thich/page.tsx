"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { RecipeList } from "@/components/recipe-list";
import { EmptyState } from "@/components/ui/states";

export default function FavoritesPage() {
  return (
    <AppShell tab="favorites">
      <h1 className="text-xl">Món yêu thích</h1>
      <RecipeList
        favoritesOnly
        empty={
          <EmptyState
            title="Chưa có món yêu thích"
            action={
              <Link href="/cong-thuc/" className="inline-flex min-h-target items-center rounded-md bg-accent px-6 text-lg font-semibold text-on-accent">
                Xem công thức
              </Link>
            }
          >
            Mở một món rồi bấm “Thêm vào yêu thích” để lưu vào đây.
          </EmptyState>
        }
      />
    </AppShell>
  );
}
