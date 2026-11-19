import { useState, useEffect, useMemo } from "react";
import {
    createPhieuNhapKho,
    getDanhSachKho,
    getDanhSachNhaCungCap,
    getDanhSachBienThe,
} from "../../api/khoApi";
import { useNavigate } from "react-router-dom";

// Tạo nhãn hiển thị cho một biến thể: "Áo thun - M - Đen (SKU)"
const formatBienThe = (bt) => {
    const phanLoai = [bt.kichThuoc, bt.mauSac].filter(Boolean).join(" - ");
    const ten = phanLoai ? `${bt.tenSanPham} - ${phanLoai}` : bt.tenSanPham;
    return bt.sku ? `${ten} (${bt.sku})` : ten;
};

// Lấy thông báo lỗi từ phản hồi của API; không kết nối được server thì báo "Lỗi kết nối"
const getErrorMessage = (error, fallback) => {
    if (!error.response) return "Lỗi kết nối";
    const data = error.response.data;
    if (typeof data === "string" && data) return data;
    return data?.message || fallback;
};

export default function NhapKhoPage() {
    const navigate = useNavigate();

    // Dữ liệu cho các ô chọn
    const [khos, setKhos] = useState([]);
    const [nhaCungCaps, setNhaCungCaps] = useState([]);
    const [bienThes, setBienThes] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(true);

    // Thông tin chung của phiếu nhập
    const [khoID, setKhoID] = useState("");
    const [nhaCungCapID, setNhaCungCapID] = useState("");
    const [ghiChu, setGhiChu] = useState("");
    const [chiTiet, setChiTiet] = useState([]);

    // Form nhập nhanh chi tiết
    const [bienTheID, setBienTheID] = useState("");
    const [timBienThe, setTimBienThe] = useState("");
    const [soLuong, setSoLuong] = useState("");
    const [donGiaNhap, setDonGiaNhap] = useState("");

    // Sửa dòng trong danh sách chi tiết
    const [editIndex, setEditIndex] = useState(null);
    const [editSoLuong, setEditSoLuong] = useState("");
    const [editDonGia, setEditDonGia] = useState("");

    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Bước 2: tải danh sách kho, nhà cung cấp, biến thể từ cơ sở dữ liệu
    useEffect(() => {
        const loadOptions = async () => {
            try {
                const [khoRes, nccRes, btRes] = await Promise.all([
                    getDanhSachKho(),
                    getDanhSachNhaCungCap(),
                    getDanhSachBienThe(),
                ]);
                setKhos(khoRes.data);
                setNhaCungCaps(nccRes.data);
                setBienThes(btRes.data);
            } catch (err) {
                console.error("Lỗi tải danh sách:", err);
                setError(getErrorMessage(err, "Không tải được danh sách kho, nhà cung cấp, biến thể."));
            } finally {
                setLoadingOptions(false);
            }
        };
        loadOptions();
    }, []);

    // Tra nhanh biến thể theo ID để hiển thị tên trong bảng chi tiết
    const bienTheMap = useMemo(() => {
        const map = {};
        bienThes.forEach((bt) => { map[bt.bienTheID] = bt; });
        return map;
    }, [bienThes]);

    // Lọc danh sách biến thể theo ô tìm kiếm (tên sản phẩm, size, màu, SKU)
    const bienTheHienThi = useMemo(() => {
        const tuKhoa = timBienThe.trim().toLowerCase();
        if (!tuKhoa) return bienThes;
        return bienThes.filter((bt) => formatBienThe(bt).toLowerCase().includes(tuKhoa));
    }, [bienThes, timBienThe]);

    const handleAddRow = () => {
        setError("");

        // Luồng rẽ nhánh 2: chưa chọn biến thể hoặc chưa nhập số lượng, đơn giá
        if (!bienTheID || soLuong === "" || donGiaNhap === "") {
            setError("Vui lòng chọn biến thể và nhập đầy đủ số lượng, đơn giá.");
            return;
        }

        const sl = Number(soLuong);
        const dg = Number(donGiaNhap);

        // Luồng rẽ nhánh 3: số lượng phải là số nguyên dương, đơn giá không nhỏ hơn 0
        if (!Number.isInteger(sl) || sl <= 0) {
            setError("Số lượng phải là số nguyên dương.");
            return;
        }
        if (Number.isNaN(dg) || dg < 0) {
            setError("Đơn giá nhập không được nhỏ hơn 0.");
            return;
        }

        if (chiTiet.some((item) => item.bienTheID === Number(bienTheID))) {
            setError("Biến thể này đã có trong phiếu. Hãy dùng nút Sửa để đổi số lượng hoặc đơn giá.");
            return;
        }

        setChiTiet([...chiTiet, { bienTheID: Number(bienTheID), soLuong: sl, donGiaNhap: dg }]);

        // Reset form nhập chi tiết
        setBienTheID("");
        setSoLuong("");
        setDonGiaNhap("");
    };

    const handleRemoveRow = (indexToRemove) => {
        setChiTiet(chiTiet.filter((_, index) => index !== indexToRemove));
        if (editIndex === indexToRemove) setEditIndex(null);
    };

    // Luồng rẽ nhánh 4: chỉnh sửa số lượng / đơn giá của dòng đã thêm
    const handleStartEdit = (index) => {
        setError("");
        setEditIndex(index);
        setEditSoLuong(String(chiTiet[index].soLuong));
        setEditDonGia(String(chiTiet[index].donGiaNhap));
    };

    const handleSaveEdit = () => {
        const sl = Number(editSoLuong);
        const dg = Number(editDonGia);

        if (editSoLuong === "" || editDonGia === "") {
            setError("Vui lòng nhập đầy đủ số lượng và đơn giá.");
            return;
        }
        if (!Number.isInteger(sl) || sl <= 0) {
            setError("Số lượng phải là số nguyên dương.");
            return;
        }
        if (Number.isNaN(dg) || dg < 0) {
            setError("Đơn giá nhập không được nhỏ hơn 0.");
            return;
        }

        setError("");
        setChiTiet(chiTiet.map((item, i) =>
            i === editIndex ? { ...item, soLuong: sl, donGiaNhap: dg } : item
        ));
        setEditIndex(null);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (submitting) return;
        setError("");

        // Luồng rẽ nhánh 1: chưa chọn kho hoặc nhà cung cấp
        if (!khoID || !nhaCungCapID) {
            setError("Vui lòng chọn kho và nhà cung cấp.");
            return;
        }

        // Luồng rẽ nhánh 6: phiếu chưa có sản phẩm nào
        if (chiTiet.length === 0) {
            setError("Vui lòng thêm ít nhất 1 sản phẩm/biến thể vào phiếu nhập.");
            return;
        }

        if (editIndex !== null) {
            setError("Vui lòng lưu hoặc hủy chỉnh sửa dòng đang sửa trước khi hoàn tất.");
            return;
        }

        const payload = {
            khoID: Number(khoID),
            nhaCungCapID: Number(nhaCungCapID),
            ghiChu: ghiChu,
            chiTiet: chiTiet,
        };

        try {
            setSubmitting(true);
            await createPhieuNhapKho(payload);
            alert("Nhập kho thành công");
            navigate("/admin/ton-kho");
        } catch (err) {
            console.error("Lỗi nhập kho:", err);
            setError(getErrorMessage(err, "Thao tác nhập kho chưa hoàn tất. Vui lòng kiểm tra lại thông tin và thử lại."));
        } finally {
            setSubmitting(false);
        }
    };

    const tongTien = chiTiet.reduce((sum, item) => sum + (item.soLuong * item.donGiaNhap), 0);

    return (
        <div style={styles.container}>
            {/* Header tiêu đề trang */}
            <div style={styles.pageHeader}>
                <div>
                    <h2 style={styles.title}>Tạo phiếu nhập kho</h2>
                </div>
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}

            {/* Form thông tin chung & thêm chi tiết */}
            <div style={styles.card}>
                {/* Chặn Enter trong form làm gửi cả phiếu; chỉ nút "Hoàn tất nhập kho" mới ghi nhận */}
                <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Kho:</label>
                            <select
                                value={khoID}
                                onChange={(e) => setKhoID(e.target.value)}
                                disabled={loadingOptions}
                                style={styles.inputField}
                            >
                                <option value="">{loadingOptions ? "Đang tải..." : "-- Chọn kho --"}</option>
                                {khos.map((k) => (
                                    <option key={k.khoID} value={k.khoID}>
                                        {k.tenKho}{k.diaChi ? ` - ${k.diaChi}` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Nhà cung cấp:</label>
                            <select
                                value={nhaCungCapID}
                                onChange={(e) => setNhaCungCapID(e.target.value)}
                                disabled={loadingOptions}
                                style={styles.inputField}
                            >
                                <option value="">{loadingOptions ? "Đang tải..." : "-- Chọn nhà cung cấp --"}</option>
                                {nhaCungCaps.map((n) => (
                                    <option key={n.nhaCungCapID} value={n.nhaCungCapID}>
                                        {n.tenNhaCungCap}{n.soDienThoai ? ` - ${n.soDienThoai}` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Ghi chú phiếu nhập:</label>
                        <textarea
                            placeholder="Nhập ghi chú (nếu có)..."
                            value={ghiChu}
                            onChange={(e) => setGhiChu(e.target.value)}
                            rows="3"
                            style={styles.textareaField}
                        />
                    </div>

                    <div style={styles.subCard}>
                        <h4 style={styles.subCardTitle}>Thêm sản phẩm nhập nhanh</h4>
                        <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap" }}>
                            <div style={{ ...styles.formGroup, flex: "2", minWidth: "260px" }}>
                                <label style={styles.label}>Sản phẩm / Biến thể</label>
                                <input
                                    type="text"
                                    placeholder="Gõ để lọc theo tên, size, màu, SKU..."
                                    value={timBienThe}
                                    onChange={(e) => setTimBienThe(e.target.value)}
                                    style={styles.inputField}
                                />
                                <select
                                    value={bienTheID}
                                    onChange={(e) => setBienTheID(e.target.value)}
                                    disabled={loadingOptions}
                                    style={styles.inputField}
                                >
                                    <option value="">
                                        {loadingOptions ? "Đang tải..." : `-- Chọn biến thể (${bienTheHienThi.length}) --`}
                                    </option>
                                    {bienTheHienThi.map((bt) => (
                                        <option key={bt.bienTheID} value={bt.bienTheID}>
                                            {formatBienThe(bt)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ ...styles.formGroup, flex: "1", minWidth: "120px" }}>
                                <label style={styles.label}>Số lượng</label>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    placeholder="Số lượng"
                                    value={soLuong}
                                    onChange={(e) => setSoLuong(e.target.value)}
                                    style={styles.inputField}
                                />
                            </div>
                            <div style={{ ...styles.formGroup, flex: "1.2", minWidth: "150px" }}>
                                <label style={styles.label}>Đơn giá nhập</label>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Đơn giá nhập"
                                    value={donGiaNhap}
                                    onChange={(e) => setDonGiaNhap(e.target.value)}
                                    style={styles.inputField}
                                />
                            </div>
                            <button type="button" onClick={handleAddRow} style={styles.btnAddRow}>
                                + Thêm
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Bảng danh sách chi tiết sản phẩm nhập */}
            <div style={styles.card}>
                <div style={{ overflowX: "auto" }}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={{ ...styles.th, width: "32%" }}>Sản phẩm / Biến thể</th>
                                <th style={{ ...styles.th, width: "14%" }}>Số lượng</th>
                                <th style={{ ...styles.th, width: "18%" }}>Đơn giá nhập</th>
                                <th style={{ ...styles.th, width: "18%" }}>Thành tiền</th>
                                <th style={{ ...styles.th, width: "18%", textAlign: "center" }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chiTiet.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ ...styles.td, textAlign: "center", color: "#94a3b8", padding: "2rem" }}>
                                        Chưa có sản phẩm nào trong phiếu
                                    </td>
                                </tr>
                            ) : (
                                chiTiet.map((item, index) => {
                                    const bt = bienTheMap[item.bienTheID];
                                    const dangSua = editIndex === index;
                                    return (
                                        <tr key={item.bienTheID} style={styles.tr}>
                                            <td style={{ ...styles.td, fontWeight: "600", color: "#64748b" }} title={bt ? formatBienThe(bt) : ""}>
                                                {bt ? formatBienThe(bt) : `Biến thể #${item.bienTheID}`}
                                            </td>
                                            <td style={{ ...styles.td, fontWeight: "600", color: "#0f172a" }}>
                                                {dangSua ? (
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        step="1"
                                                        value={editSoLuong}
                                                        onChange={(e) => setEditSoLuong(e.target.value)}
                                                        style={styles.inputField}
                                                    />
                                                ) : item.soLuong}
                                            </td>
                                            <td style={{ ...styles.td, color: "#334155" }}>
                                                {dangSua ? (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={editDonGia}
                                                        onChange={(e) => setEditDonGia(e.target.value)}
                                                        style={styles.inputField}
                                                    />
                                                ) : `${item.donGiaNhap.toLocaleString("vi-VN")} đ`}
                                            </td>
                                            <td style={{ ...styles.td, fontWeight: "600", color: "#16a34a" }}>
                                                {(item.soLuong * item.donGiaNhap).toLocaleString("vi-VN")} đ
                                            </td>
                                            <td style={{ ...styles.td, textAlign: "center" }}>
                                                <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                                                    {dangSua ? (
                                                        <>
                                                            <button type="button" onClick={handleSaveEdit} style={styles.btnEdit}>Lưu</button>
                                                            <button type="button" onClick={() => setEditIndex(null)} style={styles.btnCancel}>Hủy</button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button type="button" onClick={() => handleStartEdit(index)} style={styles.btnEdit}>Sửa</button>
                                                            <button type="button" onClick={() => handleRemoveRow(index)} style={styles.btnDelete}>Xóa</button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Tổng cộng & Hoàn tất */}
                <div style={styles.footerSummary}>
                    <h3 style={styles.totalText}>Tổng cộng: <span style={{ color: "#16a34a" }}>{tongTien.toLocaleString("vi-VN")} đ</span></h3>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        style={{ ...styles.btnSubmit, opacity: submitting ? 0.6 : 1, cursor: submitting ? "not-allowed" : "pointer" }}
                    >
                        {submitting ? "ĐANG XỬ LÝ..." : "HOÀN TẤT NHẬP KHO"}
                    </button>
                </div>
            </div>
        </div>
    );
}


// Hệ thống CSS chuẩn Dashboard Admin Nesty
const styles = {
    container: {
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
    },
    pageHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem",
    },
    title: {
        fontSize: "1.5rem",
        fontWeight: "700",
        color: "#0f172a",
        margin: 0,
    },
    subtitle: {
        fontSize: "0.875rem",
        color: "#64748b",
        margin: "4px 0 0 0",
    },
    card: {
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        padding: "1.5rem",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)",
        border: "1px solid #e2e8f0",
    },
    formGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        flex: 1,
    },
    label: {
        fontSize: "0.85rem",
        fontWeight: "600",
        color: "#475569",
    },
    inputField: {
        padding: "0.6rem 0.8rem",
        borderRadius: "8px",
        border: "1px solid #cbd5e1",
        outline: "none",
        fontSize: "0.9rem",
        backgroundColor: "#fff",
        color: "#1e293b",
        width: "100%",
        boxSizing: "border-box",
    },
    textareaField: {
        padding: "0.6rem 0.8rem",
        borderRadius: "8px",
        border: "1px solid #cbd5e1",
        outline: "none",
        fontSize: "0.9rem",
        fontFamily: "inherit",
        backgroundColor: "#fff",
        color: "#1e293b",
        width: "100%",
        boxSizing: "border-box",
    },
    subCard: {
        backgroundColor: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        padding: "1.25rem",
        marginTop: "0.5rem",
    },
    subCardTitle: {
        fontSize: "0.95rem",
        fontWeight: "700",
        color: "#0f172a",
        margin: "0 0 1rem 0",
    },
    btnAddRow: {
        padding: "0.6rem 1.25rem",
        backgroundColor: "#2563eb",
        color: "#ffffff",
        border: "none",
        borderRadius: "8px",
        fontWeight: "600",
        fontSize: "0.9rem",
        cursor: "pointer",
        height: "38px",
        whiteSpace: "nowrap",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        textAlign: "left",
        tableLayout: "fixed",
    },
    th: {
        padding: "0.85rem 1rem",
        backgroundColor: "#f8fafc",
        color: "#475569",
        fontSize: "0.8rem",
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        borderBottom: "1px solid #e2e8f0",
        whiteSpace: "nowrap",
    },
    tr: {
        borderBottom: "1px solid #f1f5f9",
    },
    td: {
        padding: "1rem",
        fontSize: "0.9rem",
        verticalAlign: "middle",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    errorBox: {
        backgroundColor: "#fef2f2",
        color: "#dc2626",
        border: "1px solid #fecaca",
        borderRadius: "8px",
        padding: "0.75rem 1rem",
        fontSize: "0.9rem",
        fontWeight: "500",
    },
    btnEdit: {
        padding: "0.3rem 0.7rem",
        backgroundColor: "#eff6ff",
        color: "#2563eb",
        border: "1px solid #bfdbfe",
        borderRadius: "6px",
        fontWeight: "600",
        fontSize: "0.78rem",
        cursor: "pointer",
    },
    btnCancel: {
        padding: "0.3rem 0.7rem",
        backgroundColor: "#f1f5f9",
        color: "#475569",
        border: "1px solid #cbd5e1",
        borderRadius: "6px",
        fontWeight: "600",
        fontSize: "0.78rem",
        cursor: "pointer",
    },
    btnDelete: {
        padding: "0.3rem 0.7rem",
        backgroundColor: "#fef2f2",
        color: "#dc2626",
        border: "1px solid #fecaca",
        borderRadius: "6px",
        fontWeight: "600",
        fontSize: "0.78rem",
        cursor: "pointer",
    },
    footerSummary: {
        marginTop: "1.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem",
        borderTop: "1px solid #e2e8f0",
        paddingTop: "1.25rem",
    },
    totalText: {
        fontSize: "1.15rem",
        fontWeight: "700",
        color: "#0f172a",
        margin: 0,
    },
    btnSubmit: {
        padding: "0.75rem 1.5rem",
        backgroundColor: "#16a34a",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontWeight: "700",
        fontSize: "0.95rem",
        cursor: "pointer",
        boxShadow: "0 2px 4px rgba(22, 163, 74, 0.2)",
    },
};