const BASE_URL = import.meta.env.VITE_API_URL || "https://alicious-delicious-cakes-production.up.railway.app";

const getToken = () => localStorage.getItem("token");

const headers = () => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const request = async (method, path, body = null) => {
  const opts = { method, headers: headers() };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw { status: res.status, message: data.error || "Request failed", data };
  return data;
};

export const register = (body) => request("POST", "/auth/register", body);
export const login = (body) => request("POST", "/auth/login", body);
export const getMe = () => request("GET", "/auth/me");
export const getCakes = (params = {}) => { const qs = new URLSearchParams(params).toString(); return request("GET", `/cakes${qs ? "?" + qs : ""}`); };
export const getFeaturedCakes = () => request("GET", "/cakes/featured");
export const createCake = (body) => request("POST", "/admin/cakes", body);
export const updateCake = (id, body) => request("PATCH", `/admin/cakes/${id}`, body);
export const deleteCake = (id) => request("DELETE", `/admin/cakes/${id}`);
export const createOrder = (body) => request("POST", "/orders", body);
export const getMyOrders = (params = {}) => { const qs = new URLSearchParams(params).toString(); return request("GET", `/orders/my-orders${qs ? "?" + qs : ""}`); };
export const getOrder = (id) => request("GET", `/orders/${id}`);
export const cancelOrder = (id, body) => request("PATCH", `/orders/${id}/cancel`, body);
export const getAllOrders = (params = {}) => { const qs = new URLSearchParams(params).toString(); return request("GET", `/admin/orders${qs ? "?" + qs : ""}`); };
export const startBaking = (id) => request("PATCH", `/admin/orders/${id}/start-baking`);
export const markReady = (id) => request("PATCH", `/admin/orders/${id}/mark-ready`);
export const markDelivered = (id) => request("PATCH", `/admin/orders/${id}/mark-delivered`);
export const payDeposit = (body) => request("POST", "/payments/deposit", body);
export const getLatestReviews = () => request("GET", "/reviews/latest");
export const createReview = (body) => request("POST", "/reviews", body);
export const getDashboard = () => request("GET", "/admin/dashboard");
export const getFinance = (year) => request("GET", `/admin/finance${year ? "?year=" + year : ""}`);
export const getExpenses = () => request("GET", "/admin/expenses");
export const createExpense = (body) => request("POST", "/admin/expenses", body);
