using Nesty.Application.DTOs.Admin.Kho;

namespace Nesty.Application.Interfaces;

public interface IQuanLyKhoService
{
    Task<bool> NhapKhoAsync(PhieuNhapKhoRequest request);
    Task<List<TonKhoResponse>> LayTonKhoAsync(int? khoId);

    // Danh sách cho các ô chọn trên form tạo phiếu nhập kho
    Task<List<KhoOptionResponse>> LayDanhSachKhoAsync();
    Task<List<NhaCungCapOptionResponse>> LayDanhSachNhaCungCapAsync();
    Task<List<BienTheOptionResponse>> LayDanhSachBienTheAsync();
}