import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Lets the app be added to the Home Screen and opened full screen, like an installed app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bếp Nhà",
    short_name: "Bếp Nhà",
    description: "Sổ tay nấu ăn của gia đình",
    lang: "vi",
    start_url: `${base}/`,
    scope: `${base}/`,
    display: "standalone",
    orientation: "portrait",
    background_color: "#FBF6EC",
    theme_color: "#FBF6EC",
    icons: [
      { src: `${base}/icon-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `${base}/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `${base}/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
