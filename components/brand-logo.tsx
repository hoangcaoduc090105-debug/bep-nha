import { cn } from "@/lib/cn";

export const LOGO_SRC = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/logo.webp`;

/**
 * The round Bếp Nhà logo: mother and son in the kitchen, inside a jade and gold ring. The picture
 * already carries its own frame, so it gets no border here. Always square; size it with `size-*`.
 */
export function BrandLogo({ className, alt = "Bếp Nhà" }: { className?: string; alt?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- a static file of the app itself; the site is a static export
  return <img src={LOGO_SRC} alt={alt} width={512} height={512} decoding="async" className={cn("block aspect-square shrink-0 rounded-pill object-contain", className)} />;
}
