"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { AppShell } from "@/components/app-shell";
import { RecipeList } from "@/components/recipe-list";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { SearchField } from "@/components/ui/search-field";
import { EmptyState } from "@/components/ui/states";
import { listCategories } from "@/data/repo";

export default function RecipesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const categories = useLiveQuery(() => listCategories(), []);
  const filtered = query !== "" || category !== undefined;
  const reset = () => {
    setQuery("");
    setCategory(undefined);
  };
  return (
    <AppShell tab="recipes">
      <h1 className="text-xl">Công thức</h1>
      <Link href="/cong-thuc/soan/" className="inline-flex min-h-target items-center justify-center gap-3 rounded-md border-2 border-border-input bg-surface px-6 text-lg font-semibold active:bg-surface-warm">
        <Plus aria-hidden className="size-6" /> Thêm món mới
      </Link>
      <SearchField label="Tìm món ăn" value={query} onChange={setQuery} placeholder="Ví dụ: cá kho" />
      {categories && categories.length > 1 && (
        <div role="group" aria-label="Loại món" className="flex flex-wrap gap-3">
          <Chip selected={category === undefined} onClick={() => setCategory(undefined)}>
            Tất cả
          </Chip>
          {categories.map((c) => (
            <Chip key={c} selected={category === c} onClick={() => setCategory(category === c ? undefined : c)}>
              {c}
            </Chip>
          ))}
        </div>
      )}
      <RecipeList
        query={query}
        category={category}
        empty={
          <EmptyState title={filtered ? "Không tìm thấy món nào" : "Chưa có công thức nào"} action={filtered ? <Button variant="secondary" onClick={reset}>Xem tất cả món</Button> : undefined}>
            {query ? "Mẹ thử gõ tên khác, không cần gõ dấu." : undefined}
          </EmptyState>
        }
      />
    </AppShell>
  );
}
