import { describe, expect, it } from "vitest";
import { forSpeech, isBetterVoice, pickVietnameseVoice, speechChunks, vietnameseVoices, voiceKind } from "@/features/voice/text";

describe("text prepared for reading aloud", () => {
  it("turns symbols into words", () => {
    expect(forSpeech("cắt khúc dày khoảng 3 cm")).toBe("cắt khúc dày khoảng 3 xăng ti mét");
    expect(forSpeech("thêm 2–3 muỗng canh nước nóng")).toBe("thêm 2 đến 3 muỗng canh nước nóng");
    expect(forSpeech("500 g cá, 200ml nước, 1½ chén, ½ trái")).toBe("500 gam cá, 200 mi li lít nước, 1 rưỡi chén, nửa trái");
  });
  it("makes asides into pauses", () => {
    expect(forSpeech("Xếp cá (và thịt ba chỉ nếu có) vào nồi.")).toBe("Xếp cá, và thịt ba chỉ nếu có, vào nồi.");
    expect(forSpeech("cá còn ướt — khi kho sẽ ra nước")).toBe("cá còn ướt, khi kho sẽ ra nước");
    expect(forSpeech("Dùng nồi đất (tộ).")).toBe("Dùng nồi đất, tộ.");
  });
  it("speaks one sentence at a time", () => {
    expect(speechChunks("Bước 2. Ướp cá. Cho cá vào tô. Được khi cá ngấm gia vị.")).toEqual(["Bước 2.", "Ướp cá.", "Cho cá vào tô.", "Được khi cá ngấm gia vị."]);
    expect(speechChunks("  ")).toEqual([]);
  });
});

describe("choosing a voice", () => {
  const compact = { name: "Linh", lang: "vi-VN", voiceURI: "com.apple.voice.compact.vi-VN.Linh", localService: true };
  const enhanced = { name: "Linh (Nâng cao)", lang: "vi-VN", voiceURI: "com.apple.voice.enhanced.vi-VN.Linh", localService: true };
  const english = { name: "Samantha", lang: "en-US", voiceURI: "com.apple.voice.premium.en-US.Samantha", localService: true };
  it("prefers the better Vietnamese voice when the phone has one", () => {
    expect(pickVietnameseVoice([english, compact, enhanced])).toBe(enhanced);
    expect(pickVietnameseVoice([enhanced, compact])).toBe(enhanced);
    expect(isBetterVoice(enhanced)).toBe(true);
    expect(isBetterVoice(compact)).toBe(false);
  });
  it("lists every Vietnamese voice, best first, and names its kind", () => {
    expect(vietnameseVoices([english, compact, enhanced])).toEqual([enhanced, compact]);
    expect([compact, enhanced].map(voiceKind)).toEqual(["thường", "nâng cao"]);
  });
  it("uses what there is, and never a voice of another language", () => {
    expect(pickVietnameseVoice([english, compact])).toBe(compact);
    expect(pickVietnameseVoice([english])).toBeNull();
    expect(pickVietnameseVoice([{ ...compact, lang: "vi_VN" }])).not.toBeNull();
  });
});
