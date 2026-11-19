-- Dữ liệu demo cho Kho và Nhà cung cấp (chạy trên database NestyDb)
-- Có thể chạy nhiều lần: dòng nào đã tồn tại (theo tên) sẽ không bị thêm lại.
-- TrangThai = 1: đang hoạt động (hiện trong ô chọn); 0: ngừng hoạt động (bị ẩn).

-- ===== KHO =====
INSERT INTO Kho (TenKho, DiaChi, TrangThai)
SELECT v.TenKho, v.DiaChi, v.TrangThai
FROM (VALUES
    (N'Kho Tổng TP.HCM',   N'12 Nguyễn Văn Linh, Quận 7, TP.HCM', 1),
    (N'Kho Hà Nội',        N'45 Phạm Hùng, Nam Từ Liêm, Hà Nội',   1),
    (N'Kho Đà Nẵng',       N'88 Nguyễn Hữu Thọ, Hải Châu, Đà Nẵng', 1),
    (N'Kho Cũ Bình Dương', N'Khu công nghiệp Sóng Thần, Bình Dương', 0)  -- ngừng hoạt động: dùng để thử việc bị ẩn
) AS v(TenKho, DiaChi, TrangThai)
WHERE NOT EXISTS (SELECT 1 FROM Kho k WHERE k.TenKho = v.TenKho);

-- ===== NHÀ CUNG CẤP =====
INSERT INTO NhaCungCap (TenNhaCungCap, SoDienThoai, Email, DiaChi, TrangThai)
SELECT v.TenNhaCungCap, v.SoDienThoai, v.Email, v.DiaChi, v.TrangThai
FROM (VALUES
    (N'Công ty TNHH Thời Trang Việt', N'0901234567', N'sales@thoitrangviet.vn', N'25 Lê Lợi, Quận 1, TP.HCM',      1),
    (N'Công ty CP Dệt May Hòa Bình',  N'0912345678', N'lienhe@detmayhoabinh.vn', N'102 Trường Chinh, Đống Đa, Hà Nội', 1),
    (N'Xưởng Giày Dép Minh Phát',     N'0987654321', N'minhphat@giaydep.vn',    N'7 Lý Thường Kiệt, Biên Hòa, Đồng Nai', 1),
    (N'NCC Ngừng Hợp Tác',            N'0900000000', N'cu@example.com',         N'Chưa cập nhật',                   0)  -- ngừng hợp tác: dùng để thử việc bị ẩn
) AS v(TenNhaCungCap, SoDienThoai, Email, DiaChi, TrangThai)
WHERE NOT EXISTS (SELECT 1 FROM NhaCungCap n WHERE n.TenNhaCungCap = v.TenNhaCungCap);

-- Kiểm tra kết quả
SELECT * FROM Kho;
SELECT * FROM NhaCungCap;
