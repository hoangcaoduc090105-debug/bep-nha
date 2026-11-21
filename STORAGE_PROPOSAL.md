# BẾP NHÀ — Đánh giá và đề xuất cơ chế lưu trữ, sao lưu

Trạng thái: **ĐÃ DUYỆT ngày 2026-11-21 theo mục 12** (mô hình My Gym Progress: lưu trên máy, sao lưu bằng gói ZIP). Các mục 5–8 và 11 về Google Drive là phương án để dành, chưa làm.

Các số liệu về giá, hạn mức và giới hạn nền tảng được đọc từ trang chính thức ngày 2026-11-21, có ghi nguồn ở mục 9. Chỗ nào ghi **"chưa xác minh"** là chưa có trang chính thức xác nhận và phải kiểm tra lại trước khi dựa vào.

---

## 1. Kiến trúc hiện tại (kiểm tra thực tế trong thư mục dự án)

| hạng mục | thực tế |
| --- | --- |
| Khung | Next.js 16.4.6, React 19.3, TypeScript 5, Tailwind 4.3 |
| Thư viện ngoài | chỉ có `lucide-react` (biểu tượng) |
| Mã nguồn đã có | 14 thành phần giao diện trong `components/ui/`, trang xem thử `/design`, trang chủ tạm, `lib/quantity.ts` (hiển thị định lượng), bộ sinh token giao diện |
| **Cơ chế lưu dữ liệu** | **Chưa có gì.** Không có Supabase, Firebase, IndexedDB, localStorage hay lệnh gọi mạng nào trong mã nguồn (đã tìm toàn bộ `app/`, `components/`, `lib/`, `scripts/`) |
| Dịch vụ ngoài đang dùng | Không có. Chưa triển khai Vercel, chưa có dự án Supabase, chưa có kho Git |
| Cấu trúc dữ liệu | Mới ở dạng thiết kế: `DATABASE_SCHEMA.md` + `replica/schema.sql` (22 bảng cho PostgreSQL/Supabase), chưa chạy lần nào |
| Chức năng sản phẩm | Chưa có màn hình nào (công thức, nấu, nhật ký…) |

**Hệ quả:** đổi cơ chế lưu trữ lúc này gần như không tốn công làm lại. Thứ bị thay là *tài liệu* đã duyệt (Supabase, đăng nhập, RLS), không phải mã nguồn. Mô hình dữ liệu (công thức → phiên bản → nguyên liệu/bước → lần nấu → đánh giá) giữ nguyên, chỉ đổi nơi chứa.

Kiến trúc đã thiết kế sẵn một lớp trung gian (`repository`) giữa giao diện và nơi lưu, nên việc đổi nơi lưu không đụng tới giao diện.

---

## 2. Ba sự thật nền tảng quyết định mọi phương án

1. **Safari trên iPhone tự xóa dữ liệu trang web sau 7 ngày không tương tác.** IndexedDB của một trang mở bằng thẻ Safari bị xóa nếu qua 7 ngày *có dùng Safari* mà không chạm vào trang đó. Ứng dụng đã **thêm vào màn hình chính thì được miễn** quy tắc này. → Với mọi phương án lưu trên máy, "Thêm vào màn hình chính" từ chỗ tùy chọn trở thành **rất nên làm** (làm một lần, anh làm giúp mẹ).
2. **Không ứng dụng web nào tự chạy được khi đã đóng trên iPhone.** Safari không hỗ trợ Background Sync hay Periodic Background Sync. "Sao lưu tự động" chỉ có nghĩa là: *tự chạy trong lúc ứng dụng đang mở, không cần ai bấm*. Việc chưa xong sẽ tiếp tục ở lần mở sau.
3. **Trình duyệt thuần không giữ được quyền Google Drive lâu dài.** Google không cấp refresh token cho ứng dụng chỉ chạy trong trình duyệt; mỗi lần xin lại quyền (khoảng mỗi giờ) cần một cú chạm và một cửa sổ bật lên. Muốn sao lưu thật sự không cần bấm thì cần một điểm đổi token phía máy chủ.

---

## 3. So sánh các phương án

| | **A1** IndexedDB + Drive, thuần trình duyệt | **A2** IndexedDB + Drive, có 2 hàm nhỏ trên Vercel | **B** IndexedDB + xuất tệp | **C1** Supabase (kế hoạch đã duyệt) | **C2** Postgres Neon + kho ảnh riêng |
| --- | --- | --- | --- | --- | --- |
| Nơi lưu chính | máy | máy | máy | đám mây | đám mây |
| Sao lưu | Drive, **cần chạm mỗi lần** hết hạn quyền | Drive, **tự chạy khi mở app** | tệp tải về, cần chạm mỗi lần | không có sẵn ở gói Free; tự xuất | tự xây |
| Phí hằng tháng | 0đ | 0đ | 0đ | 0đ | 0đ |
| Thẻ thanh toán | không cần cho Drive API | như A1 | không | chưa xác minh | Neon: không cần; kho ảnh: tùy dịch vụ |
| Vào Dashboard định kỳ | không | không | không | **có nguy cơ**: dự án Free bị tạm dừng sau 1 tuần không hoạt động, phải bấm "Resume" trong Dashboard | không (tự bật lại) |
| Dùng khi mất mạng | đầy đủ | đầy đủ | đầy đủ | không (hoặc phải xây thêm) | không |
| Mất điện thoại / trình duyệt xóa dữ liệu | khôi phục từ Drive (mất phần chưa kịp sao lưu) | như A1, phần mất nhỏ hơn vì sao lưu đều | mất từ lần xuất tệp gần nhất | không mất | không mất |
| Đổi điện thoại | kết nối Google → khôi phục | như A1 | chép tệp sang máy mới → nhập | đăng nhập là có | đăng nhập là có |
| Backend riêng | không | 2–3 hàm không trạng thái, không cơ sở dữ liệu | không | Supabase + phiên đăng nhập | API + xác thực + kho ảnh |
| Độ phức tạp xây dựng | vừa | vừa (+1 phần nhỏ) | thấp | vừa–cao | cao |
| Đơn giản với mẹ | kém: hay bị hỏi lại quyền Google | tốt: không phải làm gì | trung bình: phải nhớ bấm và biết tệp nằm đâu | tốt nếu không bị tạm dừng | tốt |

Đã xét và loại sớm:
- **Firebase (gói Spark miễn phí):** Cloud Storage nay bắt buộc gói Blaze có tài khoản thanh toán → không lưu ảnh miễn phí được.
- **Cloudflare R2/D1:** bật R2 phải qua bước "checkout" đăng ký (việc có cần thẻ hay không: chưa xác minh).

### Ưu, nhược điểm và rủi ro

**A1 — thuần trình duyệt**
- Ưu: không có bất kỳ phần máy chủ nào; không có khóa bí mật nào để giữ.
- Nhược: không đáp ứng yêu cầu "tự động". Quyền truy cập Drive hết hạn sau khoảng một giờ; lần sao lưu sau đó cần mẹ chạm nút và qua một cửa sổ Google.
- Rủi ro: cửa sổ bật lên trên Safari iPhone có thể bị chặn (chỉ có phản ánh từ cộng đồng, chưa xác minh).

**A2 — có điểm đổi token (đề xuất)**
- Ưu: sao lưu chạy ngầm mỗi khi mở ứng dụng, mẹ không phải làm gì; kết nối Google một lần duy nhất.
- Nhược: có một phần máy chủ rất nhỏ (2–3 hàm trong chính dự án Next.js trên Vercel) và 2 khóa bí mật đặt trong cấu hình Vercel.
- Rủi ro: phụ thuộc gói Vercel Hobby còn miễn phí; nếu Vercel ngừng, **dữ liệu không mất** (nằm trên máy và trên Drive), chỉ mất phần tự động cho tới khi chuyển chỗ khác.

**B — chỉ xuất tệp**
- Ưu: đơn giản nhất, không phụ thuộc dịch vụ nào.
- Nhược: trên iPhone không có cách ghi tệp lặng lẽ (không có File System Access API); mỗi lần xuất cần chạm và chọn nơi lưu. "Tự động theo lịch" chỉ có thể là *nhắc*. Việc chia sẻ tệp ZIP qua bảng chia sẻ sang ứng dụng Tệp: chưa xác minh, phải thử trên máy thật.
- Rủi ro: bản sao lưu nằm cùng chiếc điện thoại thì mất máy là mất cả hai; phụ thuộc vào việc có người nhớ bấm.

**C1 — Supabase**
- Ưu: dữ liệu ở đám mây, đổi máy không cần khôi phục; dùng được trên nhiều thiết bị.
- Nhược: trái với yêu cầu mới ở hai điểm — nhiều thiết bị không còn cần, và gói Free tạm dừng dự án sau 1 tuần không hoạt động, phải vào Dashboard bật lại. Gói Free không có sao lưu tự động và ảnh không bao giờ nằm trong bản sao lưu của họ.
- Rủi ro: "mẹo" gọi tự động mỗi ngày để tránh tạm dừng dựa vào hai gói miễn phí cùng lúc; hỏng một trong hai là ứng dụng ngừng chạy cho tới khi có người vào Dashboard.

**C2 — Neon + kho ảnh**
- Ưu: tự bật lại, không cần Dashboard, không cần thẻ.
- Nhược: phải tự xây API, xác thực và tìm chỗ chứa ảnh; nhiều thành phần nhất, nhiều thứ có thể hỏng nhất. Vượt quá nhu cầu "một cuốn sổ nấu ăn".

---

## 4. Chi phí thực tế

| dịch vụ | dùng để | giá | thẻ thanh toán | hạn mức liên quan | nếu vượt hạn mức |
| --- | --- | --- | --- | --- | --- |
| Vercel Hobby | chứa ứng dụng + 2–3 hàm đổi token | 0 USD/tháng | chưa xác minh (trang giá không nói) | 100 GB truyền tải, 1.000.000 lượt gọi hàm mỗi tháng | **bị tạm dừng, không bị tính tiền**; phải chờ hết chu kỳ 30 ngày |
| Google Cloud (dự án OAuth) | khai báo ứng dụng với Google | 0đ; bật thanh toán là *tùy chọn* | không cần để tạo dự án; bước tạo OAuth client: chưa xác minh | — | — |
| Google Drive API | tải bản sao lưu lên | "không tính thêm phí" cho mức dùng thông thường | không | 325.000 đơn vị/phút cho mỗi người dùng | Google dự định tính phí phần vượt hạn mức "cuối năm 2026" |
| Dung lượng Google của người dùng | chứa bản sao lưu | 15 GB miễn phí, dùng chung với Gmail và Photos (tài khoản tạo từ 9/3/2026: 5 GB cho tới khi xác minh số điện thoại) | không | — | sao lưu thất bại với lỗi `storageQuotaExceeded`; không phát sinh phí |
| GitHub | chứa mã nguồn | 0đ | không | — | — |

Ước tính mức dùng của Bếp Nhà:
- Dữ liệu chữ (công thức, phiên bản, nhật ký): dưới 1–2 MB mỗi bản sao lưu, kể cả sau vài năm.
- Ảnh: nén còn khoảng 300 KB mỗi tấm; 300 tấm ≈ 90 MB. Ảnh chỉ tải lên một lần, không nhân lên theo số bản sao lưu.
- Lượt gọi: vài chục lượt mỗi ngày — thấp hơn hạn mức Drive và Vercel hàng nghìn lần.

**Kết luận chi phí:** phương án đề xuất là 0đ/tháng với mức dùng này. Điều tôi *không* thể cam kết: các gói miễn phí giữ nguyên điều kiện mãi mãi. Hai điểm cần theo dõi: điều khoản "chỉ dùng cá nhân, phi thương mại" của Vercel Hobby (Bếp Nhà đáp ứng), và việc Google sẽ tính phí phần vượt hạn mức Drive API. Suy luận của tôi (không phải lời Google): dự án không gắn tài khoản thanh toán thì không có nơi nào để tính tiền; khả năng xấu nhất là bị từ chối lượt gọi.

---

## 5. Kiến trúc đề xuất: A2 + B, ba lớp bảo vệ

> **Dữ liệu chính nằm trên điện thoại. Google Drive giữ bản sao lưu tự động. Tệp xuất tay là đường lui độc lập.**

| lớp | chống lại | cách làm |
| --- | --- | --- |
| 1. Trên máy | xóa nhầm, sửa nhầm | "Xoá món" chỉ chuyển vào "Món đã xoá"; phiên bản công thức không bao giờ bị ghi đè; giữ thêm vài điểm khôi phục ngay trên máy |
| 2. Google Drive (tự động) | trình duyệt xóa dữ liệu, mất/hỏng/đổi điện thoại | bản sao lưu đầy đủ vào thư mục riêng trong Drive, giữ nhiều bản |
| 3. Gói xuất tay | mất quyền Google, Google hoặc Vercel đổi chính sách | một tệp ZIP độc lập chứa toàn bộ dữ liệu và ảnh, tự cất ở đâu tùy ý |

### 5.1 Thay đổi so với tài liệu đã duyệt

| đã duyệt | đề xuất mới | lý do |
| --- | --- | --- |
| Supabase là nơi lưu chính | IndexedDB trên máy | không cần nhiều thiết bị; tránh việc bị tạm dừng |
| Đăng nhập tài khoản ứng dụng (Supabase Auth) | **không còn đăng nhập vào ứng dụng**; chỉ "Kết nối Google Drive" một lần để sao lưu | dữ liệu nằm trên máy, không có gì trên mạng để bảo vệ bằng mật khẩu |
| Thêm vào màn hình chính: tùy chọn | **rất nên làm** (không bắt buộc về chức năng) | tránh quy tắc xóa sau 7 ngày của Safari |
| Dùng được trên máy tính và thiết bị khác với cùng dữ liệu | mỗi thiết bị một bộ dữ liệu riêng; chuyển công thức bằng "gói công thức" | không đồng bộ |
| Sao lưu: tải tệp, nhắc sau 30 ngày | tự động lên Drive + tệp xuất tay | yêu cầu mới |

Không chức năng nấu ăn nào bị bỏ. Bốn nguyên tắc (không ghi đè bản gốc, không mất lịch sử phiên bản, lần nấu gắn đúng phiên bản, công thức mẫu không tự thành "đã duyệt") giữ nguyên và vẫn được kiểm tra khi ghi dữ liệu.

**Hệ quả cần anh cân nhắc — cách anh thêm công thức.** Không còn đồng bộ, nên có hai cách:
- nhập trực tiếp trên điện thoại của mẹ; hoặc
- soạn trên máy tính của anh (cùng đường link, dữ liệu riêng của máy anh) → "Xuất gói công thức" → gửi tệp qua Zalo/AirDrop → trên máy mẹ bấm "Nhập gói công thức". Việc nhập chỉ *thêm* món mới hoặc phiên bản mới, không ghi đè gì của mẹ.

### 5.2 Kết nối Google Drive

- Quyền xin: **chỉ `drive.file`** — ứng dụng chỉ thấy những tệp do chính nó tạo, không đọc được phần còn lại của Drive. Google xếp quyền này vào loại "không nhạy cảm", không bắt buộc qua thẩm định. (Màn hình cảnh báo "ứng dụng chưa xác minh" được định nghĩa cho quyền nhạy cảm; việc nó không hiện với quyền này là suy ra, chưa có câu khẳng định trực tiếp.)
- Không dùng thư mục ẩn `appDataFolder`: thư mục đó bị xóa khi gỡ ứng dụng và người dùng không nhìn thấy được. Thay vào đó là thư mục **nhìn thấy được** "Bếp Nhà – Sao lưu" trong Drive, mở ra xem và tải về được mà không cần ứng dụng.
- Ứng dụng OAuth phải đặt trạng thái **"In production"**. Ở trạng thái "Testing", Google hủy quyền sau đúng 7 ngày — đúng kiểu bảo trì hằng tuần mà anh muốn tránh.
- Đăng nhập Google diễn ra trên trang của Google. Ứng dụng không bao giờ thấy mật khẩu.

**Phần máy chủ tối thiểu (lý do duy nhất phải có):** Google chỉ cấp quyền lâu dài qua luồng có máy chủ, và khóa bí mật của ứng dụng không được nằm trong trình duyệt. (Tài liệu Google ghi khóa này là "tùy chọn" ở bước đổi mã, nhưng phản ánh từ cộng đồng cho thấy ứng dụng web bị từ chối nếu thiếu — chưa xác minh chính thức; kế hoạch tính theo hướng cần có.)

```
/api/google/start      chuyển sang trang cấp quyền của Google
/api/google/callback   đổi mã lấy quyền lâu dài, mã hóa, đặt vào cookie httpOnly
/api/google/token      trả cho trình duyệt một quyền tạm (≈1 giờ) để tải lên Drive
/api/google/disconnect thu hồi quyền và xóa cookie
```
- Không có cơ sở dữ liệu. Quyền lâu dài nằm trong cookie đã mã hóa trên chính điện thoại, do máy chủ đặt (không bị quy tắc 7 ngày).
- **Dữ liệu gia đình không đi qua Vercel**: trình duyệt tải thẳng lên Drive.
- Khóa bí mật (`GOOGLE_CLIENT_SECRET`, khóa mã hóa cookie) chỉ nằm trong biến môi trường của Vercel; không trong mã nguồn, không trong GitHub, không trong trình duyệt.
- Quyền lâu dài hết hiệu lực khi: bị thu hồi, hoặc 6 tháng không dùng. Khi đó ứng dụng hiện "Kết nối lại Google Drive" — một lần chạm.

### 5.3 Một bản sao lưu gồm những gì

```
Bếp Nhà – Sao lưu/
  images/<mã băm>.jpg            mỗi ảnh tải lên đúng một lần, không bao giờ sửa
  data-2026-11-21T0830.json.gz   toàn bộ dữ liệu chữ của thời điểm đó
  manifest-2026-11-21T0830.json  GHI SAU CÙNG: danh sách tệp, mã băm, số lượng bản ghi, phiên bản cấu trúc
```
Dữ liệu trong `data-…`: công thức, nguồn và liên kết, phiên bản gốc và phiên bản gia đình, nguyên liệu và định lượng, các bước nấu, thiết bị và dụng cụ, lịch sử nấu, đánh giá, điều chỉnh gia vị, yêu thích, nguyên liệu có ở nhà, thực đơn tuần và danh sách mua sắm (khi có), cài đặt, hồ sơ khẩu vị, kể cả các món trong "Món đã xoá".

**Quy tắc an toàn**
1. Một bản sao lưu chỉ được coi là tồn tại khi có `manifest`. Manifest được ghi cuối cùng, sau khi mọi tệp đã lên và đã đối chiếu mã băm với giá trị Drive trả về.
2. Không bao giờ ghi đè: mỗi lần là tệp mới, tên theo thời điểm.
3. Bản cũ chỉ bị xóa **sau khi** bản mới đã hoàn tất và kiểm tra xong.
4. Bản dở dang (không có manifest) bị bỏ qua khi khôi phục và được dọn ở lần chạy sau.
5. Ảnh chỉ bị xóa khỏi Drive khi không còn manifest nào tham chiếu tới.

**Số bản giữ lại:** 7 bản gần nhất, **mỗi ngày tối đa một bản** (nếu không, bảy lần sửa liên tiếp trong một buổi sẽ đẩy hết các bản cũ đi), cộng thêm 1 bản mỗi tháng trong 3 tháng gần nhất để cứu trường hợp xóa nhầm mà lâu mới phát hiện.

**Kiểm tra toàn vẹn**
- Trước khi tải lên: kiểm tra liên kết nội bộ (mỗi lần nấu trỏ tới một phiên bản có thật, mỗi phiên bản thuộc một công thức có thật…), đếm số bản ghi, tính SHA-256 từng tệp.
- Sau khi tải lên: đối chiếu mã băm với Drive.
- Khi khôi phục: tải về → kiểm tra mã băm và số lượng → dựng thử vào vùng tạm → chỉ khi mọi thứ đạt mới thay dữ liệu đang dùng. Trước khi thay, tự tạo một điểm khôi phục của dữ liệu hiện tại.

### 5.4 Khi nào sao lưu chạy

| lúc | hành động |
| --- | --- |
| Có thay đổi dữ liệu | đánh dấu "đang chờ"; chạy sau khoảng 1 phút yên lặng |
| Bấm "Nấu xong" và lưu đánh giá | chạy ngay |
| Mở ứng dụng mà còn việc "đang chờ" hoặc lần gần nhất đã quá 24 giờ | chạy ngay |
| Ứng dụng sắp bị ẩn | cố gắng chạy nhanh (không bảo đảm) |
| Bấm "Sao lưu ngay" | chạy ngay |
| Ứng dụng đã đóng | **không chạy được** — iPhone không cho phép; việc dở sẽ tiếp tục ở lần mở sau |

Trạng thái hiển thị ở Cài đặt → Sao lưu, và một dòng nhỏ ở Trang chủ khi có vấn đề: **Đang chờ · Đang sao lưu · Đã sao lưu lúc 08:30 hôm nay · Sao lưu chưa được (lý do bằng lời thường)**.

### 5.5 Sơ đồ luồng

```
┌──────────────────────── Điện thoại của mẹ (Safari / màn hình chính) ────────────────────────┐
│                                                                                             │
│  Giao diện ──▶ Lớp repository ──▶ IndexedDB  (NƠI LƯU CHÍNH: dữ liệu + ảnh đã nén)          │
│                      │                 ▲                                                    │
│                      │ có thay đổi     │ khôi phục (sau khi kiểm tra đạt)                   │
│                      ▼                 │                                                    │
│              Bộ sao lưu ───────────────┤                                                    │
│   đang chờ → đang chạy → thành công    │                                                    │
│                   └────→ thất bại (thử lại lần sau, báo sau 3 lần)                          │
│        │                         │                                                          │
│        │ "Xuất gói sao lưu"      │ cần quyền tạm                                            │
│        ▼                         ▼                                                          │
│   Tệp ZIP độc lập         cookie đã mã hóa ──▶ Vercel /api/google/token ──▶ Google OAuth    │
│   (lưu vào Tệp/iCloud…)          │              (chỉ đổi token; không thấy dữ liệu)         │
└──────────────────────────────────┼──────────────────────────────────────────────────────────┘
                                   │ quyền tạm ≈ 1 giờ, phạm vi drive.file
                                   ▼
                 Google Drive của gia đình ▸ "Bếp Nhà – Sao lưu"
                 1) ảnh mới   2) data-…json.gz   3) đối chiếu mã băm   4) manifest (ghi cuối)
                 5) dọn bản cũ ngoài hạn giữ
```

### 5.6 Xử lý mười tình huống

| tình huống | điều xảy ra |
| --- | --- |
| Mất Internet | Ứng dụng chạy đầy đủ. Sao lưu ở trạng thái "đang chờ", tự chạy khi có mạng và ứng dụng đang mở |
| Ứng dụng bị đóng giữa lúc sao lưu | Bản dở không có manifest nên không được tính; bản tốt trước đó còn nguyên. Lần mở sau chạy lại, ảnh đã lên rồi không phải tải lại |
| Thêm công thức nhưng sao lưu chưa xong | Công thức đã an toàn trên máy ngay lập tức; trạng thái "đang chờ" được ghi nhớ qua các lần mở |
| Xóa nhầm công thức | Vào "Món đã xoá" → "Khôi phục". Nếu đã lâu: khôi phục riêng món đó từ một bản sao lưu cũ |
| Trình duyệt xóa dữ liệu | Mở ứng dụng thấy trống → màn hình "Khôi phục từ Google Drive" → kết nối Google → chọn bản mới nhất. Mất tối đa phần thay đổi sau lần sao lưu cuối |
| Đổi điện thoại | Mở link trên máy mới → "Khôi phục từ Google Drive". Hoặc chép gói ZIP sang và "Nhập gói sao lưu" |
| Google Drive hết dung lượng | Sao lưu báo thất bại: "Google Drive đã đầy". Bản cũ không bị đụng tới. Gợi ý dọn Drive hoặc xuất gói tay |
| Quyền Google bị thu hồi | Báo "Chưa kết nối Google Drive" + nút "Kết nối lại". Dữ liệu trên máy không ảnh hưởng |
| Thất bại nhiều lần | Tự thử lại ở các lần mở sau với khoảng nghỉ tăng dần; sau 3 lần liên tiếp hoặc 7 ngày không có bản thành công → dòng cảnh báo ở Trang chủ kèm lý do |
| Khôi phục từ bản cũ | Chọn bản theo ngày, xem tóm tắt (bao nhiêu món, bao nhiêu lần nấu, ngày tạo) → xác nhận → tự lưu điểm khôi phục của hiện tại trước khi thay, để có thể quay lại |

### 5.7 Bảo mật

- Công thức và ảnh không nằm ở nơi công khai nào: chỉ trên điện thoại và trong Drive riêng của gia đình. Đường link ứng dụng mở ra một ứng dụng trống đối với người lạ.
- Không có khóa bí mật nào trong mã nguồn phía trình duyệt hay trên GitHub. Không dùng service account.
- Chỉ một quyền Google: `drive.file`.
- Điểm `/api/google/token` chỉ trả lời yêu cầu đến từ chính trang ứng dụng và có cookie hợp lệ.
- Bản sao lưu trên Drive không mã hóa thêm (đã được tài khoản Google bảo vệ). Mã hóa bằng mật khẩu riêng là làm được, nhưng quên mật khẩu thì mất bản sao lưu — tôi không khuyên.
- **Thu hồi quyền:** vào https://myaccount.google.com/linkedapps → chọn Bếp Nhà → "Remove access"; hoặc Cài đặt → Sao lưu → "Ngắt kết nối Google Drive". Các tệp sao lưu vẫn nằm trong Drive sau khi thu hồi.

---

## 6. Thay đổi cần thiết trong mã nguồn (chưa thực hiện)

| phần | việc |
| --- | --- |
| Thư viện thêm | `idb` (bọc IndexedDB, nhỏ), `fflate` (nén và tạo ZIP). Không cần SDK của Google — gọi thẳng bằng `fetch` |
| `data/db` | khai báo các kho IndexedDB theo đúng mô hình 22 bảng (bỏ cột `owner_id`), thêm kho ảnh và kho trạng thái sao lưu; có số phiên bản cấu trúc và bước nâng cấp |
| `data/repository` | như đã thiết kế; các ràng buộc trước đây đặt trong PostgreSQL (phiên bản đã nấu thì không sửa được, không xóa món có lịch sử…) chuyển thành quy tắc trong lớp này, có kiểm thử |
| `features/backup` | tạo ảnh chụp dữ liệu, kiểm tra toàn vẹn, máy trạng thái, tải lên Drive, giữ/dọn bản cũ, khôi phục, xuất/nhập gói ZIP, xuất/nhập gói công thức |
| `app/api/google/*` | 4 điểm nhỏ ở mục 5.2 |
| Giao diện | Cài đặt → Sao lưu (trạng thái, lần gần nhất, "Sao lưu ngay", "Khôi phục", "Xuất gói", kết nối/ngắt Google); màn hình chào khi dữ liệu trống; dòng báo ở Trang chủ. Thành phần `Banner` đã có sẵn kiểu "backup" |
| Ảnh | nén trong trình duyệt trước khi lưu (cạnh dài 1600 px) |
| Bỏ khỏi kế hoạch | bộ nối Supabase, trang đăng nhập và middleware phiên, chính sách RLS, hai dự án Supabase thử/chính, lệnh gọi giữ dự án thức |
| Giữ nguyên | toàn bộ `components/ui`, `lib/quantity.ts`, token giao diện, thiết kế màn hình, mô hình dữ liệu |
| Biến môi trường | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (chỉ máy chủ), `COOKIE_ENCRYPTION_KEY` (chỉ máy chủ) |

Tài liệu phải sửa nếu duyệt: PRD (mục 13–14), ARCHITECTURE, DATABASE_SCHEMA (thành mô hình dữ liệu trên máy; `schema.sql` giữ làm tham khảo nếu sau này cần đám mây), FEATURE_ROADMAP, TEST_PLAN, README, `.env.example`.

---

## 7. Các giai đoạn triển khai

| giai đoạn | nội dung | xong khi |
| --- | --- | --- |
| **G0 — Thử trên iPhone thật** (nửa ngày, cần một lần triển khai Vercel) | Trang thử: ghi IndexedDB ở thẻ Safari và ở màn hình chính, kết quả `persist()`, luồng cấp quyền Google bằng chuyển trang, tải một tệp lên Drive, chia sẻ tệp ZIP sang ứng dụng Tệp | có kết quả đo thật cho các điểm đang "chưa xác minh" |
| **G1 — Lưu trên máy** | IndexedDB + repository + dữ liệu mẫu; các màn hình P0 chạy trên đó | tải lại trang dữ liệu còn nguyên; kiểm thử các quy tắc phiên bản đạt |
| **G2 — Lớp 1 và lớp 3** | "Món đã xoá", điểm khôi phục trên máy, xuất/nhập gói ZIP, kiểm tra toàn vẹn | xuất → xóa sạch → nhập lại, dữ liệu và ảnh khớp hoàn toàn |
| **G3 — Google Drive** | kết nối, sao lưu tự động, trạng thái, giữ/dọn bản cũ | 10 tình huống ở mục 5.6 đều qua |
| **G4 — Khôi phục** | khôi phục toàn bộ, khôi phục một món, màn hình chào khi trống, diễn tập đổi máy | khôi phục thành công trên một thiết bị khác |
| **G5 — Gói công thức** | xuất/nhập công thức giữa máy anh và máy mẹ | nhập không ghi đè dữ liệu sẵn có |

G1 và G2 không phụ thuộc Google hay Vercel; nếu G0 cho thấy Drive trên iPhone có trở ngại thì ứng dụng vẫn dùng được với phương án B trong lúc tìm cách khác.

---

## 8. Kế hoạch kiểm thử và khôi phục

**Tự động (không cần thiết bị)**
- Ảnh chụp dữ liệu → khôi phục → so sánh từng bản ghi và mã băm ảnh: phải trùng khít.
- Làm hỏng có chủ ý: sửa một byte, bỏ một ảnh, bỏ manifest, cắt cụt tệp → khôi phục phải từ chối và dữ liệu đang dùng không đổi.
- Ngắt giữa chừng ở từng bước tải lên → lần sau hoàn tất, bản tốt trước đó còn nguyên.
- Quy tắc giữ bản: 7 theo ngày + 3 theo tháng; ảnh chỉ bị dọn khi không còn bản nào dùng.
- Drive giả lập trả lỗi: hết dung lượng, hết quyền, mất mạng, quá hạn mức → trạng thái và lời báo đúng.
- Nâng cấp cấu trúc dữ liệu: bản sao lưu của phiên bản cũ vẫn khôi phục được.
- Quét mã nguồn và bản build: không chứa khóa bí mật.

**Trên iPhone thật**
- Không mở ứng dụng 8 ngày (vẫn dùng Safari) ở thẻ Safari và ở màn hình chính → dữ liệu còn hay mất; nếu mất thì khôi phục từ Drive.
- Xóa dữ liệu trang web trong Cài đặt Safari → khôi phục.
- Thu hồi quyền tại trang tài khoản Google → ứng dụng báo đúng và kết nối lại được.
- Đóng ứng dụng giữa lúc sao lưu nhiều ảnh.
- Diễn tập đổi máy: khôi phục trên một điện thoại khác.

**Diễn tập định kỳ:** mỗi 6 tháng, khôi phục bản mới nhất vào một trình duyệt khác và nấu thử một món từ đó. Một bản sao lưu chưa từng được khôi phục thử thì chưa đáng tin.

---

## 9. Nguồn

- Hạn mức và phí Drive API: https://developers.google.com/workspace/drive/api/guides/limits
- Tạo dự án, thanh toán là tùy chọn: https://developers.google.com/workspace/guides/create-project
- Phân loại quyền Drive: https://developers.google.com/workspace/drive/api/guides/api-specific-auth
- Thẩm định ứng dụng: https://support.google.com/cloud/answer/13463073 · cảnh báo chưa xác minh: https://support.google.com/cloud/answer/7454865
- Thư mục appDataFolder: https://developers.google.com/workspace/drive/api/guides/appdata
- Trạng thái Testing, hết hạn 7 ngày: https://support.google.com/cloud/answer/15549945
- Mô hình cấp quyền trong trình duyệt: https://developers.google.com/identity/oauth2/web/guides/choose-authorization-model
- Hết hạn refresh token: https://developers.google.com/identity/protocols/oauth2
- Dung lượng tài khoản Google: https://support.google.com/googleone/answer/9312312 · lỗi Drive: https://developers.google.com/workspace/drive/api/guides/handle-errors
- Thu hồi quyền: https://support.google.com/accounts/answer/13533235
- Safari xóa dữ liệu sau 7 ngày, miễn cho ứng dụng màn hình chính: https://webkit.org/tracking-prevention/
- Dung lượng và `persist()` trên Safari: https://webkit.org/blog/14403/updates-to-storage-policy/
- Chia sẻ tệp: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
- Vercel Hobby: https://vercel.com/pricing · https://vercel.com/docs/plans/hobby · https://vercel.com/legal/terms
- Supabase: https://supabase.com/pricing · https://supabase.com/docs/guides/platform/free-project-pausing · https://supabase.com/docs/guides/platform/backups
- Firebase Storage cần Blaze: https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024
- Neon: https://neon.com/pricing · Cloudflare R2: https://developers.cloudflare.com/r2/get-started/

## 10. Điểm còn chưa xác minh (G0 sẽ trả lời phần lớn)

1. Luồng cấp quyền Google bằng chuyển trang trên Safari iPhone, ở thẻ thường và ở màn hình chính.
2. Màn hình cảnh báo "chưa xác minh" có hiện với riêng quyền `drive.file` hay không.
3. Ứng dụng web có bắt buộc gửi khóa bí mật khi đổi mã hay không (kế hoạch giả định là có).
4. Chia sẻ tệp ZIP qua bảng chia sẻ của iOS sang ứng dụng Tệp.
5. Vercel và Supabase có yêu cầu thẻ khi đăng ký gói miễn phí hay không.
6. `persist()` có được cấp cho thẻ Safari thường hay chỉ cho ứng dụng màn hình chính.

## 11. Quyết định cần anh duyệt

| # | quyết định | đề xuất |
| --- | --- | --- |
| S1 | Phương án lưu trữ | A2 + B (ba lớp ở mục 5) |
| S2 | Chấp nhận 4 hàm nhỏ trên Vercel để sao lưu thật sự tự động | Có. Nếu không muốn bất kỳ phần máy chủ nào → A1: mỗi lần sao lưu cần một cú chạm |
| S3 | Bỏ đăng nhập vào ứng dụng | Có; chỉ còn "Kết nối Google Drive" |
| S4 | Tài khoản Google chứa bản sao lưu | Tài khoản của mẹ nếu mẹ có sẵn trên máy; nếu không thì của anh |
| S5 | Thêm vào màn hình chính | Rất nên làm, anh thiết lập một lần cho mẹ |
| S6 | Cách anh thêm công thức | Gói công thức gửi qua Zalo/AirDrop, hoặc nhập trực tiếp trên máy mẹ |
| S7 | Số bản giữ lại | 7 bản theo ngày + 3 bản theo tháng |
| S8 | Mã hóa bản sao lưu bằng mật khẩu riêng | Không |

---

## 12. Cập nhật 2026-11-21: đối chiếu với My Gym Progress và đề xuất điều chỉnh

Chủ dự án đặt điều kiện: phương án phải **đơn giản, dễ dùng, không phát sinh chi phí**; nếu không thì theo mô hình của ứng dụng My Gym Progress.

**My Gym Progress làm thế nào** (đọc từ README công khai của kho mã): local-first; dữ liệu và ảnh chỉ nằm trong IndexedDB (Dexie); không backend, không tài khoản, không API key; xuất/nhập JSON và thùng rác trong Cài đặt; PWA dùng được offline; triển khai trên GitHub Pages. Đây chính là **phương án B** trong bảng so sánh.

**Đánh giá thẳng phương án A2 theo điều kiện trên**
| điều kiện | A2 (Drive tự động) | B (mô hình My Gym Progress) |
| --- | --- | --- |
| Không phát sinh chi phí | đạt (0đ) | đạt (0đ) |
| Dễ dùng với mẹ | đạt | đạt, nhưng phải có người bấm "Sao lưu" định kỳ |
| Đơn giản để xây và duy trì | **không đạt**: phải tạo dự án Google Cloud, cấu hình OAuth, giữ 2 khóa bí mật, thêm 4 hàm máy chủ, và còn 3 điểm chưa xác minh trên iPhone | đạt: không có dịch vụ ngoài nào |

→ Theo đúng điều kiện đã nêu, **đề xuất chính đổi thành B**. Sao lưu Google Drive trở thành phần bổ sung tùy chọn về sau.

### Đề xuất điều chỉnh: "như My Gym Progress, thêm vài thứ cho việc sao lưu"
- Lưu trữ: IndexedDB trên máy (Dexie, cùng thư viện với My Gym Progress). Không backend, không tài khoản, không đăng nhập, không khóa bí mật.
- Triển khai: trang tĩnh. GitHub Pages như My Gym Progress, hoặc Vercel — vì không còn hàm máy chủ nên nơi nào cũng được.
- Cài lên màn hình chính dạng PWA, dùng được offline (như My Gym Progress). Đây cũng là cách tránh việc Safari xóa dữ liệu sau 7 ngày.
- Sao lưu: nút **"Sao lưu"** tạo một gói ZIP gồm toàn bộ dữ liệu và ảnh, lưu vào ứng dụng Tệp (nếu chọn thư mục iCloud Drive thì iPhone tự đưa tệp lên iCloud). Có kiểm tra toàn vẹn khi tạo và khi khôi phục.
- Thêm so với My Gym Progress: hiện thời điểm sao lưu gần nhất; dòng nhắc ở Trang chủ khi có thay đổi chưa sao lưu quá 7 ngày; "Món đã xoá"; tự lưu điểm khôi phục trước mỗi lần nhập dữ liệu; gói công thức để anh gửi món mới cho mẹ.

### Điều phương án này KHÔNG làm được (đánh đổi phải chấp nhận)
- **Không có sao lưu tự động.** Trên iPhone, ứng dụng web không thể tự ghi tệp ra ngoài; mỗi lần sao lưu cần một lần bấm. Các yêu cầu "tự động sao lưu", "giữ 7 bản gần nhất" ở mục 4 chỉ đáp ứng được theo nghĩa: ứng dụng *nhắc*, người dùng bấm, các tệp cũ do người dùng giữ.
- Mất hoặc hỏng điện thoại thì mất phần thay đổi kể từ lần bấm sao lưu gần nhất.
- Việc lưu tệp ZIP qua bảng chia sẻ của iOS vẫn cần thử trên máy thật; nếu không được thì dùng cách tải tệp xuống thông thường.

### Đường nâng cấp
Định dạng gói sao lưu của B chính là định dạng dùng cho Drive ở mục 5.3. Nếu sau này muốn tự động, chỉ thêm phần kết nối Drive (G3) mà không phải làm lại phần nào.

### Giai đoạn triển khai (thay cho mục 7)
G1 lưu trên máy + các màn hình P0 → G2 sao lưu/khôi phục bằng gói ZIP, "Món đã xoá", nhắc sao lưu → G3 PWA offline + triển khai → G4 gói công thức. (Tùy chọn về sau: Google Drive tự động.)

### Quyết định cần duyệt (thay cho mục 11)
| # | quyết định | đề xuất |
| --- | --- | --- |
| T1 | Mô hình lưu trữ | như My Gym Progress: IndexedDB, không backend, không tài khoản |
| T2 | Nơi triển khai | GitHub Pages (anh đã quen, không có hạn mức nào để theo dõi) |
| T3 | Sao lưu | gói ZIP bấm tay + nhắc sau 7 ngày có thay đổi chưa sao lưu |
| T4 | Google Drive tự động | để sau, chỉ làm khi anh thấy cần |
