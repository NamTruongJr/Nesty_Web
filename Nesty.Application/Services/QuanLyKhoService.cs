using Nesty.Application.DTOs.Admin.Kho;
using Nesty.Application.Interfaces;
using Nesty.Domain.Entities;

namespace Nesty.Application.Services;

public class QuanLyKhoService : IQuanLyKhoService
{
    private readonly IUnitOfWork _unitOfWork;

    public QuanLyKhoService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    // Kiểm tra thông tin bắt buộc của phiếu nhập trước khi ghi nhận.
    // Lỗi dữ liệu người dùng nhập -> ném ArgumentException để controller trả về 400 kèm thông báo.
    private async Task ValidatePhieuNhapAsync(PhieuNhapKhoRequest request)
    {
        if (request.KhoID <= 0 || request.NhaCungCapID <= 0)
            throw new ArgumentException("Vui lòng chọn kho và nhà cung cấp.");

        if (request.ChiTiet == null || request.ChiTiet.Count == 0)
            throw new ArgumentException("Phiếu nhập phải có ít nhất một sản phẩm/biến thể.");

        var kho = await _unitOfWork.Khos.GetByIdAsync(request.KhoID);
        if (kho == null || !kho.TrangThai)
            throw new ArgumentException("Kho đã chọn không tồn tại hoặc đã ngừng hoạt động.");

        var nhaCungCap = await _unitOfWork.NhaCungCaps.GetByIdAsync(request.NhaCungCapID);
        if (nhaCungCap == null || !nhaCungCap.TrangThai)
            throw new ArgumentException("Nhà cung cấp đã chọn không tồn tại hoặc đã ngừng hợp tác.");

        foreach (var item in request.ChiTiet)
        {
            if (item.BienTheID <= 0)
                throw new ArgumentException("Vui lòng chọn biến thể sản phẩm cho tất cả các dòng.");

            if (item.SoLuong <= 0)
                throw new ArgumentException("Số lượng nhập phải là số nguyên dương.");

            if (item.DonGiaNhap < 0)
                throw new ArgumentException("Đơn giá nhập không được nhỏ hơn 0.");

            var bienThe = await _unitOfWork.BienThes.GetByIdAsync(item.BienTheID);
            if (bienThe == null)
                throw new ArgumentException($"Biến thể có ID {item.BienTheID} không tồn tại.");
        }
    }

    public async Task<bool> NhapKhoAsync(PhieuNhapKhoRequest request)
    {
        // Kiểm tra dữ liệu đầu vào trước khi mở Transaction
        await ValidatePhieuNhapAsync(request);

        // Sử dụng Transaction để đảm bảo tính toàn vẹn dữ liệu nếu có lỗi xảy ra giữa chừng
        await _unitOfWork.BeginTransactionAsync();
        try
        {
            // BƯỚC 1: Lưu phiếu nhập cha trước để EF sinh ra PhieuNhapKhoID
            var phieuNhap = new PhieuNhapKho
            {
                KhoID = request.KhoID,
                NhaCungCapID = request.NhaCungCapID,
                MaPhieuNhap = "PN" + DateTime.Now.ToString("yyyyMMddHHmmss"),
                NgayNhap = DateTime.Now,
                GhiChu = request.GhiChu,
                TongTien = request.ChiTiet.Sum(x => x.SoLuong * x.DonGiaNhap),
                ChiTietPhieuNhapKhos = new List<ChiTietPhieuNhapKho>() // Khởi tạo list rỗng, không gom chung dữ liệu
            };

            await _unitOfWork.PhieuNhapKhos.AddAsync(phieuNhap);
            await _unitOfWork.SaveChangesAsync(); // Cố định xuống DB, lúc này phieuNhap đã có ID thật

            // BƯỚC 2: Thêm chi tiết phiếu nhập với ID cha đã có
            foreach (var x in request.ChiTiet)
            {
                phieuNhap.ChiTietPhieuNhapKhos.Add(new ChiTietPhieuNhapKho
                {
                    PhieuNhapKhoID = phieuNhap.PhieuNhapKhoID, // Gán cứng khóa ngoại
                    BienTheID = x.BienTheID,
                    SoLuong = x.SoLuong,
                    DonGiaNhap = x.DonGiaNhap,
                    ThanhTien = x.SoLuong * x.DonGiaNhap
                });
            }
            await _unitOfWork.SaveChangesAsync(); // EF tự động insert các bản ghi chi tiết mới

            // BƯỚC 3: Xử lý Tồn kho và Giao dịch kho
            foreach (var item in request.ChiTiet)
            {
                var tonKho = await _unitOfWork.TonKhos.GetByKhoAndBienTheAsync(request.KhoID, item.BienTheID);

                if (tonKho == null)
                {
                    tonKho = new TonKho
                    {
                        KhoID = request.KhoID,
                        BienTheID = item.BienTheID,
                        SoLuongTon = item.SoLuong,
                        NgayCapNhat = DateTime.Now
                    };
                    await _unitOfWork.TonKhos.AddAsync(tonKho);
                    await _unitOfWork.SaveChangesAsync(); // Lấy TonKhoID mới để gán cho Giao dịch
                }
                else
                {
                    tonKho.SoLuongTon += item.SoLuong;
                    tonKho.NgayCapNhat = DateTime.Now;
                    _unitOfWork.TonKhos.Update(tonKho);
                }

                var giaoDich = new GiaoDichKho
                {
                    TonKhoID = tonKho.TonKhoID,
                    LoaiGiaoDich = "NHẬP KHO",
                    SoLuong = item.SoLuong,
                    ThoiGian = DateTime.Now,
                    LyDo = "Nhập hàng theo phiếu " + phieuNhap.MaPhieuNhap
                };
                await _unitOfWork.GiaoDichKhos.AddAsync(giaoDich);
            }

            // BƯỚC 4: Lưu lần cuối và Xác nhận (Commit) Transaction
            await _unitOfWork.SaveChangesAsync();
            await _unitOfWork.CommitTransactionAsync();

            return true;
        }
        catch
        {
            // Hủy bỏ toàn bộ thao tác nếu có lỗi (tránh việc bảng cha có mà bảng con không có)
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }
    }

    public async Task<List<TonKhoResponse>> LayTonKhoAsync(int? khoId)
    {
        var tonKhos = await _unitOfWork.TonKhos.GetAllTonKhoAsync(khoId);
        return tonKhos.Select(x => new TonKhoResponse
        {
            TonKhoID = x.TonKhoID,
            KhoID = x.KhoID,
            TenKho = x.Kho?.TenKho ?? string.Empty,
            BienTheID = x.BienTheID,
            TenSanPham = x.BienTheSanPham?.SanPham?.TenSanPham ?? string.Empty,
            KichThuoc = x.BienTheSanPham?.KichThuoc?.TenKichThuoc ?? string.Empty,
            MauSac = x.BienTheSanPham?.MauSac?.TenMau ?? string.Empty,
            SoLuongTon = x.SoLuongTon,
            NgayCapNhat = x.NgayCapNhat
        }).ToList();
    }

    public async Task<List<KhoOptionResponse>> LayDanhSachKhoAsync()
    {
        var khos = await _unitOfWork.Khos.GetAllAsync();
        return khos
            .Where(x => x.TrangThai)
            .OrderBy(x => x.TenKho)
            .Select(x => new KhoOptionResponse
            {
                KhoID = x.KhoID,
                TenKho = x.TenKho,
                DiaChi = x.DiaChi
            }).ToList();
    }

    public async Task<List<NhaCungCapOptionResponse>> LayDanhSachNhaCungCapAsync()
    {
        var nhaCungCaps = await _unitOfWork.NhaCungCaps.GetAllAsync();
        return nhaCungCaps
            .Where(x => x.TrangThai)
            .OrderBy(x => x.TenNhaCungCap)
            .Select(x => new NhaCungCapOptionResponse
            {
                NhaCungCapID = x.NhaCungCapID,
                TenNhaCungCap = x.TenNhaCungCap,
                SoDienThoai = x.SoDienThoai
            }).ToList();
    }

    public async Task<List<BienTheOptionResponse>> LayDanhSachBienTheAsync()
    {
        var bienThes = await _unitOfWork.BienThes.GetAllActiveWithDetailsAsync();
        return bienThes.Select(x => new BienTheOptionResponse
        {
            BienTheID = x.BienTheID,
            SanPhamID = x.SanPhamID,
            TenSanPham = x.SanPham?.TenSanPham ?? string.Empty,
            SKU = x.SKU,
            KichThuoc = x.KichThuoc?.TenKichThuoc ?? string.Empty,
            MauSac = x.MauSac?.TenMau ?? string.Empty
        }).ToList();
    }
}