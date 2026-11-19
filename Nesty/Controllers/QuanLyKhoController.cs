using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nesty.Application.DTOs.Admin.Kho;
using Nesty.Application.Interfaces;

namespace Nesty.API.Controllers;

[ApiController]
[Route("api/admin/kho")]
[Authorize(Roles = "Admin")]
public class QuanLyKhoController : ControllerBase
{
    private readonly IQuanLyKhoService _service;

    public QuanLyKhoController(IQuanLyKhoService service)
    {
        _service = service;
    }

    [HttpPost("nhap-kho")]
    public async Task<IActionResult> NhapKho([FromBody] PhieuNhapKhoRequest request)
    {
        try
        {
            var result = await _service.NhapKhoAsync(request);
            if (!result) return BadRequest(new { message = "Lỗi khi tạo phiếu nhập kho." });
            return Ok(new { message = "Nhập kho thành công" });
        }
        catch (ArgumentException ex)
        {
            // Dữ liệu không hợp lệ (chưa chọn kho/NCC, số lượng <= 0, đơn giá < 0, ...)
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("danh-sach-kho")]
    public async Task<IActionResult> GetDanhSachKho()
    {
        return Ok(await _service.LayDanhSachKhoAsync());
    }

    [HttpGet("nha-cung-cap")]
    public async Task<IActionResult> GetDanhSachNhaCungCap()
    {
        return Ok(await _service.LayDanhSachNhaCungCapAsync());
    }

    [HttpGet("bien-the")]
    public async Task<IActionResult> GetDanhSachBienThe()
    {
        return Ok(await _service.LayDanhSachBienTheAsync());
    }

    [HttpGet("ton-kho")]
    public async Task<IActionResult> GetTonKho([FromQuery] int? khoId)
    {
        return Ok(await _service.LayTonKhoAsync(khoId));
    }
}