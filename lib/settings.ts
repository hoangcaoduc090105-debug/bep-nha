// Names and defaults of the settings kept on the device.

export const TEXT_SCALES = [
  { id: "lon", label: "Lớn" },
  { id: "rat_lon", label: "Rất lớn" },
  { id: "cuc_lon", label: "Cực lớn" },
] as const;
export type TextScale = (typeof TEXT_SCALES)[number]["id"];

export const VOICE_RATES = [
  { value: 0.75, label: "Chậm" },
  { value: 0.9, label: "Vừa" },
  { value: 1.05, label: "Nhanh" },
] as const;

export const DEFAULTS = {
  textScale: "lon" as TextScale,
  voiceRate: 0.9,
  autoRead: false,
  /** The voice chosen in Cài đặt; null = let the app pick the best one. */
  voiceURI: null as string | null,
  addressAs: "mẹ",
};

export const REMIND_AFTER_DAYS = 7;
