// ==========================================
// API CLIENT & TYPE DEFINITIONS
// ==========================================

const API_BASE_URL = "http://127.0.0.1:8000";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  created_at: string;
}

export interface CartItem {
  id: number;
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface CartSummary {
  items: CartItem[];
  total: number;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: number;
  user_id: number;
  total_amount: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

// Token helper
export function getToken(): string | null {
  return localStorage.getItem("nexus_token");
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem("nexus_token", token);
  } else {
    localStorage.removeItem("nexus_token");
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorDetail =
      data && data.detail
        ? typeof data.detail === "string"
          ? data.detail
          : JSON.stringify(data.detail)
        : `Request failed with status ${response.status}`;
    throw new Error(errorDetail);
  }

  return data as T;
}

// API Methods
export const api = {
  // Auth
  login: async (email: string, password: string): Promise<TokenResponse> => {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Authentication failed");
    }
    return data;
  },

  register: async (name: string, email: string, password: string, role: string = "user"): Promise<User> => {
    return request<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, role }),
    });
  },

  getProfile: async (): Promise<User> => {
    return request<User>("/auth/me");
  },

  // Products
  getProducts: async (skip: number = 0, limit: number = 50): Promise<Product[]> => {
    return request<Product[]>(`/products?skip=${skip}&limit=${limit}`);
  },

  getProduct: async (id: number): Promise<Product> => {
    return request<Product>(`/products/${id}`);
  },

  createProduct: async (product: { name: string; description?: string; price: number; stock: number }): Promise<Product> => {
    return request<Product>("/products", {
      method: "POST",
      body: JSON.stringify(product),
    });
  },

  updateProduct: async (id: number, updates: Partial<{ name: string; description: string; price: number; stock: number }>): Promise<Product> => {
    return request<Product>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  deleteProduct: async (id: number): Promise<void> => {
    return request<void>(`/products/${id}`, {
      method: "DELETE",
    });
  },

  // Cart
  getCart: async (): Promise<CartSummary> => {
    return request<CartSummary>("/cart");
  },

  addToCart: async (productId: number, quantity: number = 1): Promise<CartItem> => {
    return request<CartItem>("/cart", {
      method: "POST",
      body: JSON.stringify({ product_id: productId, quantity }),
    });
  },

  updateCartItem: async (cartItemId: number, quantity: number): Promise<CartItem> => {
    return request<CartItem>(`/cart/${cartItemId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    });
  },

  removeFromCart: async (cartItemId: number): Promise<void> => {
    return request<void>(`/cart/${cartItemId}`, {
      method: "DELETE",
    });
  },

  // Orders
  placeOrder: async (): Promise<Order> => {
    return request<Order>("/orders", {
      method: "POST",
    });
  },

  getOrders: async (): Promise<Order[]> => {
    return request<Order[]>("/orders");
  },

  getOrderById: async (orderId: number): Promise<Order> => {
    return request<Order>(`/orders/${orderId}`);
  },

  // Admin
  getAllOrders: async (): Promise<Order[]> => {
    return request<Order[]>("/admin/orders");
  },
};
