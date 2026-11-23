# Bếp Nhà — hướng dẫn cho Claude

Sổ tay nấu ăn riêng của một gia đình Việt Nam (miền Nam). Người dùng chính là mẹ của chủ dự án, dùng trên iPhone. Mục tiêu: nấu cùng một món ra cùng một vị, không phải nhớ.

- Trang đang chạy: https://hoangcaoduc090105-debug.github.io/bep-nha/
- Kho mã: https://github.com/hoangcaoduc090105-debug/bep-nha (công khai, nhánh `main`)
- Trạng thái và những gì đã/chưa kiểm tra: `README.md`. Đọc nó trước khi làm gì.

## Cách làm việc với chủ dự án

- Trả lời bằng **tiếng Việt**. Giao diện ứng dụng cũng hoàn toàn tiếng Việt, giọng miền Nam, không chen tiếng Anh.
- Việc lớn hoặc đổi hướng: **trình bày phương án và chờ duyệt trước khi viết mã**. Việc nhỏ trong phạm vi đã duyệt thì cứ làm.
- Ưu tiên theo thứ tự: đơn giản, không tốn phí, không phải bảo trì, mẹ dễ dùng. Mô hình tham chiếu là ứng dụng trước của chủ dự án, My Gym Progress (`~/Documents/my-gym-progress`): local-first, không backend, không tài khoản.
- Báo cáo trung thực: nói rõ cái gì đã kiểm tra, cái gì chưa. Không gọi là "xong" khi chưa chạy thử.
- Commit và push chỉ khi được yêu cầu. Push lên `main` là triển khai ngay.

## Kiến trúc (đã duyệt, đừng đổi nếu không được yêu cầu)

- Next.js 16 xuất **trang tĩnh** (`output: "export"`), React 19, TypeScript, Tailwind 4. Triển khai GitHub Pages qua `.github/workflows/deploy.yml`, có tiền tố đường dẫn `NEXT_PUBLIC_BASE_PATH=/bep-nha`.
- Toàn bộ dữ liệu và ảnh nằm trong **IndexedDB trên máy** (Dexie). Không backend, không tài khoản, không đăng nhập, không khóa bí mật, không gọi dịch vụ ngoài, không AI API.
- Đã cân nhắc và **bỏ**: Supabase, Vercel, đăng nhập, đồng bộ nhiều thiết bị. Sao lưu tự động lên Google Drive chỉ là phương án để dành (`STORAGE_PROPOSAL.md` mục 5), chưa làm.
- Bản build có chính sách CSP chặn mọi kết nối ra ngoài (hai ngoại lệ, chỉ cho món viết lại theo video, duyệt 2026-11-22: khung phát `youtube-nocookie.com` khi bấm "Xem đoạn video của bước này", và ảnh bìa video từ `i.ytimg.com`, được service worker giữ lại). Thêm tài nguyên bên ngoài nào cũng phải sửa CSP trong `app/layout.tsx` — và phải có lý do rất tốt.
- Vì là trang tĩnh, trang món dùng tham số truy vấn (`/cong-thuc/mon/?id=…`), không dùng đường dẫn động. Trang đọc tham số phải bọc trong `<Suspense>`.
- Next.js 16 và Tailwind 4 mới hơn kiến thức sẵn có: khi không chắc, đọc tài liệu trong `node_modules/next/dist/docs` hoặc thử build, đừng đoán.

## Bản đồ mã

```
app/            màn hình: / · huong-dan (cách dùng) · cong-thuc · cong-thuc/mon · cong-thuc/chinh · cong-thuc/soan (trình soạn) · dang-nau · nhat-ky · yeu-thich · cai-dat · cai-dat/mon (gửi/nhận món) · design
components/ui/  thành phần cơ bản (xem /design); components/editor/ thẻ và ô nhập của trình soạn; components/ là khung trang và phần dùng chung
data/           types.ts · db.ts (Dexie) · repo.ts (MỌI quy tắc dữ liệu) · seed/ (`video.ts` 39 món viết lại theo video · `samples.ts` 10 món mẫu cũ, chỉ còn là dữ liệu kiểm thử)
features/       recipe-text (tính lại định lượng, điền câu chữ, bản đọc) · cooking (hẹn giờ, chuông, giữ màn hình)
                · voice (đọc tiếng Việt) · backup (gói ZIP, kiểm tra toàn vẹn, khôi phục, gói công thức `pack.ts`)
                · editor (biểu mẫu, kiểm tra hợp lệ, biểu mẫu → phiên bản) · photos (nén ảnh)
lib/            định dạng định lượng, nhãn, cài đặt
tests/          Vitest · e2e/ Playwright trên bản build · scripts/ sinh token, biểu tượng, sw.js
```

## Quy tắc không được phá

1. Màn hình **không** gọi Dexie trực tiếp; chỉ qua `data/repo.ts`.
2. Một phiên bản công thức là ảnh chụp trọn vẹn. **Không sửa phiên bản đã nấu**; chỉnh là tạo phiên bản mới (có bản gốc cha và lý do). Bản gốc không bao giờ bị ghi đè. Ngoại lệ duy nhất (đã duyệt 2026-11-21): món nhà tự nhập, chưa có lần nấu nào, thì trình soạn sửa thẳng để chữa lỗi gõ; công thức mẫu thì không bao giờ.
3. Mỗi lần nấu lưu đúng `versionId` đã nấu. Phiên bản có lần nấu thì không xóa được.
4. "Xoá món" là cất vào "Món đã xoá". Xóa hẳn chỉ cho món chưa từng nấu.
5. Món tự nhập hoặc nhận qua gói mang nhãn "Mới nhập – chưa nấu thử" (`entered`). Công thức mẫu và món mới nhập chỉ thành "Gia đình đã duyệt" khi người dùng xác nhận sau một lần nấu được khen. **Không bịa định lượng rồi trình bày như đã kiểm chứng**; công thức viết từ video phải ghi nguồn và nhãn "viết lại theo video".
6. Câu chữ trong bước nấu **không ghi cứng số lượng**: dùng token `{slot}` để lượng theo đúng phiên bản và số người ăn. Kiểm thử sẽ bắt lỗi này. Trình soạn chặn số gõ tay cạnh một nguyên liệu chưa được chèn ở đâu trong món; câu nêm lại kiểu "nhạt thì thêm nửa muỗng cà phê nước mắm" thì được.
7. Mỗi bước nấu phải có "Được khi…" (dấu hiệu nhận biết) và "Tránh…".
8. Sao lưu: gói chỉ hợp lệ khi có manifest và mọi mã kiểm tra khớp; khôi phục phải xác minh xong mới thay dữ liệu, và giữ điểm hoàn tác. Gói công thức dùng cùng định dạng (`kind: "recipe-pack"`), nhập là **chỉ thêm**, không ghi đè, và cũng giữ điểm hoàn tác. Không đọc dữ liệu ảnh (`blob.arrayBuffer()`) bên trong giao dịch Dexie: trình duyệt thật sẽ đóng giao dịch.
9. Đổi cấu trúc IndexedDB: thêm `this.version(n)` mới trong `data/db.ts`, không sửa phiên bản cũ; gói sao lưu cũ vẫn phải khôi phục được.

## Giao diện

Thiết kế cho người lớn tuổi, điện thoại dựng cạnh bếp. Chữ thường tối thiểu 18 px, chữ khi nấu 30 px, vùng chạm tối thiểu 56 px, tương phản AA trở lên. Không thao tác chỉ bằng vuốt hay nhấn giữ, biểu tượng luôn kèm chữ, không dùng màu làm tín hiệu duy nhất. Hộp xác nhận: nút lớn luôn là lựa chọn an toàn. Màu và cỡ chữ lấy từ token (`replica/design/tokens.json` → `node scripts/build-tokens.mjs`), không viết mã màu trực tiếp. Chi tiết: `DESIGN_SYSTEM.md`, `replica/design/components.md`.

## Lệnh

```bash
npm run dev        # http://localhost:3000 (không có offline ở chế độ này)
npm run check      # kiểm tra kiểu + lint + kiểm thử + build tĩnh — phải qua trước khi báo xong
npm run test:e2e   # build rồi chạy kiểm thử đầu-cuối bằng Google Chrome đã cài và WebKit (một lần: npx playwright install webkit)
node e2e/live-check.mjs https://hoangcaoduc090105-debug.github.io/bep-nha/   # kiểm tra trang thật sau khi triển khai
```

Lưu ý môi trường: không có `gh`; khung trình duyệt trong ứng dụng **không hỗ trợ service worker**, nên offline phải kiểm bằng Playwright. Đẩy mã dùng khóa trong Keychain (đã có quyền với kho `bep-nha`).

## Lộ trình

Mục tiêu đã chốt 2026-11-21: **mẹ chỉ mở ứng dụng, chọn món và nấu theo**; soạn món, gửi món, sao lưu là việc của chủ dự án. Đừng đề xuất việc gì bắt mẹ làm thêm.

Xong: G1–G4, cộng "Hoàn thiện cho mẹ": **nấu xong không cần đánh giá** (`finishSession(id, null)`), kiểm thử đầu-cuối chạy cả Chrome lẫn WebKit cỡ iPhone 14 Pro Max.
Còn lại: (1) ba phép thử ở bếp trên máy mẹ; (2) món thật: viết lại theo ba kênh YouTube mẹ xem, đặt trong `data/seed/video.ts` (chốt 2026-11-22: đưa vào mã, không dùng gói, để máy mẹ chỉ cần bấm "Cập nhật"): đã viết 29 món, đã rà lại toàn bộ mốc video và triển khai 2026-11-23; chủ dự án chốt 2026-11-23 nâng lên 100 món, làm từng đợt 10, chất lượng trên số lượng — đợt đầu (10 món, thành 39) đã soạn, chưa triển khai.
10 món mẫu đã bỏ (chốt 2026-11-23): máy mới không nạp; máy đã có thì lần mở đầu sau khi cập nhật tự cất vào "Món đã xoá", một lần, trừ món đang yêu thích, có "Bản nhà mình" hoặc đang nấu dở (`putAwaySamples` trong `data/repo.ts`); không xoá hẳn gì. Chúng còn trong mã (`data/seed/samples.ts`) chỉ để kiểm thử; kiểm thử đơn vị nạp chúng bằng `repo.addBuiltInRecipes`, kiểm thử đầu-cuối dùng món từ video và gói sao lưu cũ `tests/data/sao-luu-co-mon-mau.zip`.
Món từ video (chuẩn chốt 2026-11-22, mục tiêu khoảng 30 món, làm từng đợt 10): đọc trọn mô tả và trọn bản chép lời của video (bảng "Bản chép lời" trên trang YouTube, mở bằng trình duyệt ở khung rộng 1280 và tab YouTube phải nằm phía trước, nếu không trang không hiện phần mô tả; địa chỉ tải phụ đề trực tiếp trả về rỗng). Mọi con số phải có trong mô tả hoặc lời kênh; không có thì để "ít" (`quantity: null`, `unit: "it"`). Số gam chỉ ghi khi kênh ghi. Số chỉ nghe được qua bản chép lời tự động thì ghi vào `source.note` kèm phút:giây. "Được khi/Tránh" lấy từ lời kênh; câu nào tự viết thì đánh dấu `// own` và đếm trong `source.note`. Mỗi bước có `clip("m:ss", "m:ss")` là đoạn video của bước đó. Mỗi nguyên liệu có số phải ghi nguồn: `said("m:ss", "m:ss")` (khoảng giây kênh nói ra lượng đó) hoặc `DESC` (chỉ có trong mô tả); kênh nào liệt kê hết nguyên liệu ở đầu video thì món có thêm `ingredientsClip(...)`, hiện ở màn hình "Chuẩn bị nguyên liệu". `tests/video-seeds.test.ts` giữ năm quy tắc khớp giữa đoạn video và "Cần dùng" (đoạn không cắt giữa câu nói lượng, không chứa lượng của thứ bước đó không dùng…); đừng nới quy tắc để cho qua, hãy sửa mốc. Mốc lấy từ phụ đề trình phát YouTube tự tải (có giây của từng chữ), không lấy theo dòng 8–10 giây của bảng "Bản chép lời"; cách lấy ghi ở `README.md`. Người soạn không nghe được tiếng: mốc khớp theo phụ đề, chưa ai nghe kiểm. Số người ăn và số phút là ước chừng, phải nói rõ. Video không đọc được bản chép lời thì không soạn (video cũ của Cô Ba thường chỉ có phụ đề giữ chỗ "Caption is updating ..."). Trong bản chép lời tự động của Tú Lê, "muỗng gửi/gưi/gửa" là "muỗng rưỡi" (đã đối chiếu với mô tả ở hai video). Tên nguyên liệu trong một món không được trùng nhau sau khi bỏ phần trong ngoặc.
Thêm 2026-11-23 theo yêu cầu chủ dự án (đã làm, chưa triển khai): gợi ý "Hôm nay nấu gì?" ra một mâm mặn + canh, không bắt mẹ khai gì (`features/suggest/meal.ts`); món chia nhóm Món mặn/canh/xào/chiên và lọc theo nguyên liệu chính (`lib/dish-groups.ts`); logo hai mẹ con và bảng màu xanh ngọc – xanh than – vàng lấy từ tấm ảnh mẹ thích; "Ảnh của nhà mình" chọn trong Cài đặt, **chỉ lưu trên máy** (kho mã và trang web công khai — không đưa ảnh gia đình vào mã); trang "Cách dùng" (`app/huong-dan`). Màu vàng (`gold`) chỉ để trang trí, không dùng cho chữ (tương phản 2,4:1).
Đã bỏ (đừng đề xuất lại nếu không được hỏi): "chế độ gọn" ẩn nút quản lý món trên máy mẹ (đã làm rồi gỡ 2026-11-21, chủ dự án thấy không cần), ảnh sau mỗi lần nấu, Nhà đang có gì, gợi ý dựa trên đồ có trong nhà, lọc theo thiết bị, hồ sơ khẩu vị, lệnh giọng nói, mốc thời gian video, thực đơn tuần, danh sách mua sắm, sao lưu Google Drive. Giọng đọc: chấp nhận giọng thường của iPhone, không làm thêm trừ khi được yêu cầu.
Chi tiết: `FEATURE_ROADMAP.md`, `PRD.md` (mục 15 là mô hình hiện hành; các mục 13–14 về đăng nhập và đám mây đã bị thay thế).

## Còn mở

- Đã thử trên máy mẹ (chủ dự án, 2026-11-21): thêm vào màn hình chính, nấu theo từng bước.
- Chưa thử trên iPhone thật: phát video trong bước nấu (nhất là khi mở từ Màn hình chính), ảnh bìa video khi mất mạng, chuông hẹn giờ khi gạt im lặng, hẹn giờ sau khi khoá màn hình, giữ màn hình sáng, bảng chia sẻ khi sao lưu và khi gửi món, chụp/chọn ảnh (kể cả ảnh HEIC), nhận tệp gửi món qua Zalo/AirDrop (phải "Lưu vào Tệp" rồi chọn trong "Nhận món"), gõ tiếng Việt trong trình soạn.
- Máy mẹ: iPhone 14 Pro Max, iOS 26.5 (chủ dự án cho biết 2026-11-21). Màn hình rộng 430 pt; kiểm thử đầu-cuối chạy trên Chrome (Pixel 7) và WebKit của Playwright (cỡ iPhone 14 Pro Max) — không phải Safari thật. WebKit ở phiên tạm thời không lưu được ảnh vào IndexedDB (giống Duyệt riêng tư), nên `e2e/fixtures.ts` cho mỗi "máy" một hồ sơ trên đĩa; bài kiểm thử mới phải lấy `test` từ `./fixtures` và dùng `newPhone()` thay cho `browser.newContext()`.
- Các món viết lại theo video chưa ai nấu thử, và chưa ai nghe lại từng đoạn video của bước (mốc đặt theo phụ đề).
