import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function BackLink({ href, children = "Quay lại" }: { href: string; children?: React.ReactNode }) {
  return (
    <Link href={href} className="-ml-2 inline-flex min-h-target items-center gap-1 self-start rounded-md px-2 text-lg font-medium text-accent">
      <ChevronLeft aria-hidden className="size-7" /> {children}
    </Link>
  );
}
