using Nesty.Domain.Entities;

namespace Nesty.Application.Interfaces.Repositories;

public interface IBienTheRepository
    : IRepository<BienTheSanPham>
{
    Task<List<BienTheSanPham>> GetBySanPhamIdAsync(int sanPhamId);

    // Lấy tất cả biến thể đang hoạt động kèm sản phẩm, kích thước, màu sắc
    Task<List<BienTheSanPham>> GetAllActiveWithDetailsAsync();
}