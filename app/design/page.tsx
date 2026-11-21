import type { Metadata } from "next";
import { Showcase } from "./showcase";

export const metadata: Metadata = { title: "Bộ giao diện · Bếp Nhà" };

// Design-system check page (replica-design, step 4): every base component in every state.
export default function DesignPage() {
  return <Showcase />;
}
