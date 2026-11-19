import api from "../services/api";

export const getTonKho = async (khoId = "") => {
    const url = khoId ? `/admin/kho/ton-kho?khoId=${khoId}` : "/admin/kho/ton-kho";
    return await api.get(url);
};

// Danh sách đổ vào các ô chọn của form tạo phiếu nhập kho
export const getDanhSachKho = async () => {
    return await api.get("/admin/kho/danh-sach-kho");
};

export const getDanhSachNhaCungCap = async () => {
    return await api.get("/admin/kho/nha-cung-cap");
};

export const getDanhSachBienThe = async () => {
    return await api.get("/admin/kho/bien-the");
};

export const createPhieuNhapKho = async (data) => {
    return await api.post("/admin/kho/nhap-kho", data);
};