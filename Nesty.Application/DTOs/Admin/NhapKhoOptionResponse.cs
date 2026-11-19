namespace Nesty.Application.DTOs.Admin.Kho;

// Các DTO dùng để đổ dữ liệu vào ô chọn (dropdown) trên form tạo phiếu nhập kho

public class KhoOptionResponse
{
    public int KhoID { get; set; }
    public string TenKho { get; set; } = string.Empty;
    public string? DiaChi { get; set; }
}

public class NhaCungCapOptionResponse
{
    public int NhaCungCapID { get; set; }
    public string TenNhaCungCap { get; set; } = string.Empty;
    public string? SoDienThoai { get; set; }
}

public class BienTheOptionResponse
{
    public int BienTheID { get; set; }
    public int SanPhamID { get; set; }
    public string TenSanPham { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public string KichThuoc { get; set; } = string.Empty;
    public string MauSac { get; set; } = string.Empty;
}
