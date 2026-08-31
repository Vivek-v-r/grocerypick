import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env?.VITE_API_BASE_URL || "/api",
  headers: { "Content-Type": "application/json" },
});
// Module token fallback (used if localStorage isn't available)
let moduleToken = null;

export const setAuthToken = (token) => {
  moduleToken = token;
  if (token) {
    api.defaults.headers.common.Authorization = `Token ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

// Try to synchronously initialize token from localStorage (so requests during initial render include header)
try {
  const initialToken = localStorage.getItem("adminToken");
  if (initialToken) {
    setAuthToken(initialToken);
  }
} catch (e) {
  // ignore — localStorage unavailable
}

api.interceptors.request.use((config) => {
  try {
    const isAdminRoute = (config.url || "").startsWith("/admin");
    const token = isAdminRoute
      ? localStorage.getItem("adminToken")
      : localStorage.getItem("customerToken") || localStorage.getItem("adminToken");
    if (token) config.headers.Authorization = `Token ${token}`;
    else if (moduleToken) config.headers.Authorization = `Token ${moduleToken}`;
  } catch (e) {
    if (moduleToken) config.headers.Authorization = `Token ${moduleToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV !== "production") {
      try {
        console.debug(
          "[API]",
          response.status,
          response.config.method.toUpperCase(),
          response.config.url,
        );
      } catch (e) {}
    }
    return response;
  },
  (error) => {
    if (error?.response?.status === 401) {
      try {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminName");
        localStorage.removeItem("customerToken");
        localStorage.removeItem("customer");
      } catch (e) {}
      if (window.location.pathname.startsWith("/admin")) {
        window.location.href = "/admin";
      }
    }
    console.error(
      "[API ERROR]",
      error?.response?.status,
      error?.config?.url,
      error?.message,
    );
    return Promise.reject(error);
  },
);

export default api;

// Store
export const getStoreSettings = () => api.get("/store/settings/");
export const updateStoreSettings = (data) =>
  api.put("/store/settings/update/", data);

// Auth
export const adminLogin = (credentials) =>
  api.post("/auth/login/", credentials);
export const adminLogout = () => api.post("/auth/logout/");

// Categories
export const getCategories = () => api.get("/categories/");
export const createCategory = (data) => api.post("/categories/create/", data);
export const deleteCategory = (id) => api.delete(`/categories/${id}/`);

// Products
export const getProducts = (params) => api.get("/products/", { params });
export const getProduct = (id) => api.get(`/products/${id}/`);
export const adminGetProducts = () => api.get("/admin/products/");
export const adminCreateProduct = (data) => api.post("/admin/products/", data);
export const adminUpdateProduct = (id, data) =>
  api.patch(`/admin/products/${id}/`, data);
export const adminDeleteProduct = (id) => api.delete(`/admin/products/${id}/`);

// Orders
export const createOrder = (data) => api.post("/orders/", data);
export const trackOrder = (orderNumber) =>
  api.get(`/orders/track/${orderNumber}/`);
export const adminGetOrders = (params) => api.get("/admin/orders/", { params });
export const adminUpdateOrderStatus = (id, data) =>
  api.patch(`/admin/orders/${id}/status/`, data);
export const getDashboardStats = () => api.get("/admin/dashboard/");

// Customer Auth
export const customerRegister = (data) => api.post("/customer/register/", data);
export const customerLogin = (data) => api.post("/customer/login/", data);
export const customerLogout = () => api.post("/customer/logout/");
export const customerProfile = () => api.get("/customer/profile/");
export const customerUpdateProfile = (data) => api.put("/customer/profile/", data);
export const customerForgotPassword = (data) => api.post("/customer/forgot-password/", data);

// Customer Orders
export const customerOrders = (params) => api.get("/customer/orders/", { params });
export const reorder = (orderId) => api.post(`/customer/reorder/${orderId}/`);

// Shared Group Cart & Bill Splitting
export const createGroup = (data) => api.post("/groups/create/", data);
export const joinGroup = (data) => api.post("/groups/join/", data);
export const myGroups = () => api.get("/groups/my/");
export const groupDetails = (groupId) => api.get(`/groups/${groupId}/`);
export const groupCart = (groupId) => api.get(`/groups/${groupId}/cart/`);
export const addCartItem = (groupId, data) => api.post(`/groups/${groupId}/cart/`, data);
export const deleteCartItem = (groupId, itemId) => api.delete(`/groups/${groupId}/cart/${itemId}/`);
export const toggleItemPurchased = (groupId, itemId) => api.patch(`/groups/${groupId}/cart/${itemId}/toggle/`);
export const splitBill = (groupId, data) => api.post(`/groups/${groupId}/split-bill/`, data);
export const updatePaymentStatus = (paymentId) => api.patch(`/payments/${paymentId}/status/`);

// Daily Offers
export const getActiveOffers = () => api.get("/offers/");
export const adminGetOffers = () => api.get("/admin/offers/");
export const adminCreateOffer = (data) => api.post("/admin/offers/", data);
export const adminUpdateOffer = (id, data) => api.put(`/admin/offers/${id}/`, data);
export const adminDeleteOffer = (id) => api.delete(`/admin/offers/${id}/`);
export const adminToggleOffer = (id) => api.patch(`/admin/offers/${id}/toggle/`);
