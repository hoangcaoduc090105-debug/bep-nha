import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start gap-6 px-4 py-10">
      <h1 className="text-display">Không tìm thấy trang này</h1>
      <p className="text-lg font-normal">Có thể đường dẫn đã cũ.</p>
      <Link href="/" className="inline-flex min-h-target-lg items-center rounded-md bg-accent px-6 text-lg font-semibold text-on-accent">
        Về trang chủ
      </Link>
    </main>
  );
}
