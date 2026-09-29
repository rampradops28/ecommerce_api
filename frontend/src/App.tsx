import { useState, useEffect, useMemo } from "react";
import {
  api,
  setToken,
  getToken,
  type Product,
  type CartSummary,
  type Order,
  type User,
} from "./api";
import {
  ShoppingBag,
  Package,
  Shield,
  User as UserIcon,
  LogOut,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  X,
  Search,
  ArrowRight,
  Box,
  Layers,
  Edit3,
  Sun,
  Moon,
  Copy,
  Check,
  Truck,
  Heart,
  Eye,
  Star,
  RefreshCw,
  ShieldCheck,
  Lock,
} from "lucide-react";

// ==========================================
// CURATED E-COMMERCE IMAGERY & PRESETS
// ==========================================
interface ProductMeta {
  image: string;
  category: string;
  rating: number;
  reviewCount: number;
}

const CURATED_IMAGE_PRESETS: { name: string; url: string; category: string }[] = [
  {
    name: "Luxury Chronograph Watch",
    url: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
    category: "Horology",
  },
  {
    name: "Minimalist Leather Slides",
    url: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=800&q=80",
    category: "Footwear",
  },
  {
    name: "Studio Acoustic Headphones",
    url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    category: "Audio",
  },
  {
    name: "Mechanical Compact Keyboard",
    url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
    category: "Hardware",
  },
  {
    name: "Commuter Canvas Backpack",
    url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    category: "Carry",
  },
  {
    name: "Precision Espresso Tumbler",
    url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
    category: "Living",
  },
];

function resolveProductMeta(prod: Product): ProductMeta {
  const name = (prod.name || "").toLowerCase();
  const desc = (prod.description || "").toLowerCase();

  if (name.includes("rolex") || name.includes("watch") || desc.includes("rolex") || desc.includes("watch")) {
    return {
      image: CURATED_IMAGE_PRESETS[0].url,
      category: "Horology",
      rating: 4.9,
      reviewCount: 64,
    };
  }
  if (name.includes("slipper") || name.includes("slide") || name.includes("shoe") || desc.includes("flop")) {
    return {
      image: CURATED_IMAGE_PRESETS[1].url,
      category: "Footwear",
      rating: 4.8,
      reviewCount: 39,
    };
  }
  if (name.includes("headphone") || name.includes("audio") || name.includes("sound")) {
    return {
      image: CURATED_IMAGE_PRESETS[2].url,
      category: "Audio",
      rating: 4.9,
      reviewCount: 112,
    };
  }
  if (name.includes("keyboard") || name.includes("key")) {
    return {
      image: CURATED_IMAGE_PRESETS[3].url,
      category: "Hardware",
      rating: 4.7,
      reviewCount: 28,
    };
  }
  if (name.includes("bag") || name.includes("pack")) {
    return {
      image: CURATED_IMAGE_PRESETS[4].url,
      category: "Carry",
      rating: 4.9,
      reviewCount: 45,
    };
  }

  const presetIndex = Math.abs(prod.id % CURATED_IMAGE_PRESETS.length);
  return {
    image: CURATED_IMAGE_PRESETS[presetIndex].url,
    category: CURATED_IMAGE_PRESETS[presetIndex].category,
    rating: 4.8,
    reviewCount: 20 + ((prod.id * 7) % 50),
  };
}

export function App() {
  // Theme State (Clean Daylight vs Calming Slate)
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("meridian_theme") as "light" | "dark") || "light";
  });

  // App & User State
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartSummary>({ items: [], total: 0 });
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Navigation: "home" | "customer-dashboard" | "admin-deck"
  const [currentView, setCurrentView] = useState<"home" | "customer-dashboard" | "admin-deck">("home");

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"featured" | "price_asc" | "price_desc" | "rating">("featured");
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  // Wishlist State (Local persistence)
  const [wishlist, setWishlist] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("meridian_wishlist") || "[]");
    } catch {
      return [];
    }
  });

  // Modals & Drawers
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewQty, setQuickViewQty] = useState<number>(1);
  const [checkoutModalOrder, setCheckoutModalOrder] = useState<Order | null>(null);
  const [productModalOpen, setProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<number | null>(null);

  // Form Fields: Auth
  const [loginEmail, setLoginEmail] = useState("demo@example.com");
  const [loginPassword, setLoginPassword] = useState("demo1234");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<"user" | "admin">("user");

  // Form Fields: Product
  const [prodName, setProdName] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodPrice, setProdPrice] = useState<number>(99.0);
  const [prodStock, setProdStock] = useState<number>(15);

  // Toast System
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Sync Theme to HTML data-theme attribute
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("meridian_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    showToast(`Switched to ${next === "dark" ? "Calming Slate" : "Clean Daylight"} mode`, "info");
  };

  // Wishlist toggle
  const toggleWishlist = (productId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updated: number[];
    if (wishlist.includes(productId)) {
      updated = wishlist.filter((id) => id !== productId);
      showToast("Removed from wishlist", "info");
    } else {
      updated = [...wishlist, productId];
      showToast("Saved to your wishlist", "success");
    }
    setWishlist(updated);
    localStorage.setItem("meridian_wishlist", JSON.stringify(updated));
  };

  // Keyboard shortcut: ESC to close any modal/drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCartOpen(false);
        setAuthModalOpen(false);
        setProductModalOpen(false);
        setQuickViewProduct(null);
        setCheckoutModalOrder(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Data Bootstrap
  useEffect(() => {
    bootstrap();
  }, []);

  const bootstrap = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (token) {
        try {
          const profile = await api.getProfile();
          setUser(profile);
        } catch {
          setToken(null);
          setUser(null);
        }
      }
      await loadProducts();
    } catch (err: any) {
      showToast(err.message || "Failed to initialize store", "error");
    } finally {
      setLoading(false);
    }
  };

  // Reload data when user changes
  useEffect(() => {
    if (user) {
      loadCart();
      loadUserOrders();
      if (user.role === "admin") {
        loadAllOrders();
      }
    } else {
      setCart({ items: [], total: 0 });
      setOrders([]);
      setAllOrders([]);
    }
  }, [user]);

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const loadCart = async () => {
    try {
      const data = await api.getCart();
      setCart(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const loadUserOrders = async () => {
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const loadAllOrders = async () => {
    try {
      const data = await api.getAllOrders();
      setAllOrders(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  // 1-Click Fast Switch Demo Personas
  const handleQuickSwitch = async (email: string, pass: string, targetView?: "home" | "customer-dashboard" | "admin-deck") => {
    try {
      setLoading(true);
      const res = await api.login(email, pass);
      setToken(res.access_token);
      const profile = await api.getProfile();
      setUser(profile);
      if (targetView) {
        setCurrentView(targetView);
      } else {
        setCurrentView(profile.role === "admin" ? "admin-deck" : "customer-dashboard");
      }
      showToast(`Welcome, ${profile.name}! Role: ${profile.role.toUpperCase()}`, "success");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Auth Submit Handlers
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.login(loginEmail, loginPassword);
      setToken(res.access_token);
      const profile = await api.getProfile();
      setUser(profile);
      setAuthModalOpen(false);
      showToast(`Welcome back, ${profile.name}!`, "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.register(regName, regEmail, regPassword, regRole);
      const res = await api.login(regEmail, regPassword);
      setToken(res.access_token);
      const profile = await api.getProfile();
      setUser(profile);
      setAuthModalOpen(false);
      showToast(`Account created as ${profile.role.toUpperCase()}!`, "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setCurrentView("home");
    showToast("Signed out. See you soon!", "info");
  };

  // Cart Handlers
  const handleAddToCart = async (product: Product, quantity = 1, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) {
      setAuthModalOpen(true);
      showToast("Please sign in to add items to your cart", "info");
      return;
    }
    try {
      await api.addToCart(product.id, quantity);
      await loadCart();
      showToast(`Added ${product.name} to cart`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to add to cart", "error");
    }
  };

  const handleUpdateQuantity = async (cartItemId: number, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    try {
      if (newQty <= 0) {
        await api.removeFromCart(cartItemId);
        showToast("Item removed from cart", "info");
      } else {
        await api.updateCartItem(cartItemId, newQty);
      }
      await loadCart();
    } catch (err: any) {
      showToast(err.message || "Failed to update item", "error");
    }
  };

  const handleRemoveFromCart = async (cartItemId: number) => {
    try {
      await api.removeFromCart(cartItemId);
      await loadCart();
      showToast("Item removed from cart", "info");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Atomic Checkout
  const handleCheckout = async () => {
    try {
      setLoading(true);
      const order = await api.placeOrder();
      setCartOpen(false);
      setCheckoutModalOrder(order);
      await loadCart();
      await loadProducts();
      await loadUserOrders();
      if (user?.role === "admin") {
        await loadAllOrders();
      }
      showToast(`Order #${order.id} confirmed! Transaction committed.`, "success");
    } catch (err: any) {
      showToast(err.message || "Checkout failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // Product Admin Operations
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdName("");
    setProdDesc("");
    setProdPrice(99.0);
    setProdStock(15);
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdDesc(prod.description || "");
    setProdPrice(prod.price);
    setProdStock(prod.stock);
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, {
          name: prodName,
          description: prodDesc,
          price: prodPrice,
          stock: prodStock,
        });
        showToast(`Updated "${prodName}"`, "success");
      } else {
        await api.createProduct({
          name: prodName,
          description: prodDesc,
          price: prodPrice,
          stock: prodStock,
        });
        showToast(`Created new product "${prodName}"`, "success");
      }
      setProductModalOpen(false);
      await loadProducts();
    } catch (err: any) {
      showToast(err.message || "Failed to save product", "error");
    }
  };

  const handleDeleteProduct = async (id: number, name: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"?`)) return;
    try {
      await api.deleteProduct(id);
      showToast(`Deleted "${name}" from catalog`, "info");
      await loadProducts();
    } catch (err: any) {
      showToast(err.message || "Failed to delete product", "error");
    }
  };

  const handleCopyOrderId = (id: number) => {
    navigator.clipboard.writeText(String(id));
    setCopiedOrderId(id);
    showToast(`Order #${id} copied to clipboard`, "info");
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

        const meta = resolveProductMeta(p);
        let matchesCategory = true;
        if (selectedCategory === "timepieces") {
          matchesCategory = meta.category === "Horology";
        } else if (selectedCategory === "footwear") {
          matchesCategory = meta.category === "Footwear";
        } else if (selectedCategory === "tech") {
          matchesCategory = meta.category === "Audio" || meta.category === "Hardware";
        } else if (selectedCategory === "under100") {
          matchesCategory = p.price <= 100;
        }

        const matchesStock = inStockOnly ? p.stock > 0 : true;

        return matchesSearch && matchesCategory && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") return a.price - b.price;
        if (sortBy === "price_desc") return b.price - a.price;
        if (sortBy === "rating") return b.id - a.id;
        return a.id - b.id;
      });
  }, [products, searchQuery, selectedCategory, inStockOnly, sortBy]);

  const totalCartCount = useMemo(() => {
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Admin stats
  const adminStats = useMemo(() => {
    const totalRev = allOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
    const depletedCount = products.filter((p) => p.stock === 0).length;
    return {
      revenue: totalRev,
      ordersCount: allOrders.length,
      productCount: products.length,
      lowStockCount,
      depletedCount,
    };
  }, [allOrders, products]);

  // Customer stats
  const customerStats = useMemo(() => {
    const totalSpent = orders.reduce((sum, o) => sum + o.total_amount, 0);
    return {
      totalSpent,
      ordersCount: orders.length,
      wishlistCount: wishlist.length,
    };
  }, [orders, wishlist]);

  const freeShippingThreshold = 150;
  const freeShippingProgress = Math.min(100, (cart.total / freeShippingThreshold) * 100);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - cart.total);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ==========================================
          MAIN NAVIGATION HEADER (Neat & Clean)
          ========================================== */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          {/* Unique Brand Logo: MERIDIAN */}
          <div
            onClick={() => setCurrentView("home")}
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "var(--accent-primary)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "1.15rem",
              }}
            >
              M
            </div>
            <div>
              <div className="brand-font" style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                MERIDIAN
              </div>
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", marginTop: "-3px" }}>
                CURATED ESSENTIALS
              </div>
            </div>
          </div>

          {/* Navigation Links / Views */}
          <nav style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              onClick={() => setCurrentView("home")}
              className={`btn btn-sm ${currentView === "home" ? "btn-primary" : "btn-ghost"}`}
            >
              Catalog / Home
            </button>

            {/* Customer Portal Link */}
            <button
              onClick={() => {
                if (!user) {
                  setAuthModalOpen(true);
                  showToast("Sign in to access your customer dashboard", "info");
                } else {
                  setCurrentView("customer-dashboard");
                }
              }}
              className={`btn btn-sm ${currentView === "customer-dashboard" ? "btn-primary" : "btn-ghost"}`}
            >
              <Package size={14} />
              Customer Dashboard
              {user && orders.length > 0 && (
                <span
                  style={{
                    fontSize: "0.68rem",
                    padding: "1px 6px",
                    borderRadius: "999px",
                    background: currentView === "customer-dashboard" ? "rgba(255, 255, 255, 0.25)" : "var(--bg-tag)",
                    marginLeft: "2px",
                    fontWeight: 600,
                  }}
                >
                  {orders.length}
                </span>
              )}
            </button>

            {/* Admin Command Deck Link (RBAC demo) */}
            <button
              onClick={() => {
                if (!user) {
                  setAuthModalOpen(true);
                  showToast("Admin login required to open Command Deck", "info");
                } else {
                  setCurrentView("admin-deck");
                }
              }}
              className={`btn btn-sm ${
                currentView === "admin-deck" ? "btn-primary" : user?.role === "admin" ? "btn-secondary" : "btn-ghost"
              }`}
              style={{
                border: user?.role === "admin" && currentView !== "admin-deck" ? "1px solid var(--accent-primary)" : undefined,
              }}
            >
              <Shield size={14} />
              Admin Deck
              {user?.role === "admin" && (
                <span className="pill pill-admin" style={{ padding: "1px 6px", fontSize: "0.65rem" }}>
                  ADMIN
                </span>
              )}
            </button>
          </nav>

          {/* Fast Switch Persona Helper & Utility Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Quick Demo Switcher Pills */}
            <div
              style={{
                display: "flex",
                background: "var(--bg-subtle)",
                padding: "2px",
                borderRadius: "8px",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <button
                onClick={() => handleQuickSwitch("demo@example.com", "demo1234", "customer-dashboard")}
                className={`btn btn-sm ${user?.email === "demo@example.com" ? "btn-secondary" : "btn-ghost"}`}
                style={{ padding: "4px 8px", fontSize: "0.72rem" }}
                title="1-Click Login as Customer"
              >
                <UserIcon size={12} /> Customer
              </button>
              <button
                onClick={() => handleQuickSwitch("admin@example.com", "admin1234", "admin-deck")}
                className={`btn btn-sm ${user?.email === "admin@example.com" ? "btn-secondary" : "btn-ghost"}`}
                style={{ padding: "4px 8px", fontSize: "0.72rem" }}
                title="1-Click Login as Admin"
              >
                <Shield size={12} /> Admin
              </button>
            </div>

            {/* Dark / Light Mode Switch */}
            <button
              onClick={toggleTheme}
              className="btn btn-ghost btn-icon"
              style={{ border: "1px solid var(--border-subtle)" }}
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} color="#475569" />}
            </button>

            {/* Cart Drawer Trigger */}
            <button
              onClick={() => setCartOpen(true)}
              className="btn btn-secondary"
              style={{ position: "relative", padding: "8px 14px" }}
              aria-label="Open Cart"
            >
              <ShoppingBag size={16} />
              <span className="mono-font" style={{ fontWeight: 700 }}>
                ${cart.total.toFixed(2)}
              </span>
              {totalCartCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-6px",
                    background: "var(--accent-primary)",
                    color: "#ffffff",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    width: "19px",
                    height: "19px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Auth Info / Sign In */}
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px",
                    background: "var(--bg-subtle)",
                    borderRadius: "8px",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: "var(--accent-primary)",
                      color: "#fff",
                      fontSize: "0.7rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                    }}
                  >
                    {user.name[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{user.name.split(" ")[0]}</span>
                </div>
                <button onClick={handleLogout} className="btn btn-ghost btn-sm btn-icon" title="Sign Out">
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <button onClick={() => setAuthModalOpen(true)} className="btn btn-primary btn-sm">
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ==========================================
          MAIN CONTENT AREA
          ========================================== */}
      <main style={{ flex: 1, maxWidth: "1280px", width: "100%", margin: "0 auto", padding: "28px 20px" }}>
        {/* ==========================================
            VIEW 1: STORE FRONT / HOME PAGE
            ========================================== */}
        {currentView === "home" && (
          <div>
            {/* Clean Hero Banner */}
            <section
              className="card"
              style={{
                marginBottom: "32px",
                background: "var(--hero-gradient)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "18px",
                padding: "40px",
                display: "grid",
                gridTemplateColumns: "1.2fr 0.8fr",
                gap: "36px",
                alignItems: "center",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--accent-primary)",
                    display: "inline-block",
                    marginBottom: "12px",
                  }}
                >
                  NEW SEASON 2026 // MERIDIAN CURATION
                </span>

                <h1 style={{ marginBottom: "14px", fontWeight: 800 }}>
                  Essential Objects for Modern Living.
                </h1>

                <p
                  style={{
                    fontSize: "0.95rem",
                    color: "var(--text-secondary)",
                    maxWidth: "520px",
                    marginBottom: "24px",
                    lineHeight: 1.6,
                  }}
                >
                  Curated timepieces, minimalist footwear, and studio acoustics crafted with architectural restraint and
                  verified by PostgreSQL transactional safety.
                </p>

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "26px" }}>
                  <button
                    onClick={() => {
                      const el = document.getElementById("catalog-section");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="btn btn-primary"
                  >
                    Browse Catalog <ArrowRight size={15} />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCategory("timepieces");
                      const el = document.getElementById("catalog-section");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="btn btn-secondary"
                  >
                    Explore Timepieces
                  </button>
                </div>

                {/* Trust Badges (Clean & Readable) */}
                <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <ShieldCheck size={16} color="var(--accent-emerald)" />
                    <span>PostgreSQL ACID Certified</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Truck size={16} color="var(--accent-primary)" />
                    <span>Free Shipping on Orders $150+</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Star size={16} color="#f59e0b" fill="#f59e0b" />
                    <span>4.9/5 Rating (500+ Verified)</span>
                  </div>
                </div>
              </div>

              {/* Hero Showcase Card */}
              {products.length > 0 && (
                <div
                  className="card"
                  style={{
                    background: "var(--bg-surface)",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div style={{ position: "relative", borderRadius: "10px", overflow: "hidden", aspectRatio: "16/11" }}>
                    <img
                      src={resolveProductMeta(products[0]).image}
                      alt={products[0].name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <span
                      className="pill pill-stock-high"
                      style={{ position: "absolute", top: "10px", left: "10px" }}
                    >
                      Featured
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div>
                      <h3 style={{ fontSize: "1.1rem" }}>{products[0].name}</h3>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        {resolveProductMeta(products[0]).category} • SKU #{String(products[0].id).padStart(4, "0")}
                      </span>
                    </div>
                    <div className="mono-font" style={{ fontSize: "1.3rem", fontWeight: 700 }}>
                      ${products[0].price.toFixed(2)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddToCart(products[0])}
                    className="btn btn-primary"
                    style={{ width: "100%" }}
                  >
                    <ShoppingBag size={15} /> Add to Cart
                  </button>
                </div>
              )}
            </section>

            {/* 4 Pillars / Features Row (Neat & Clean) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
                marginBottom: "36px",
              }}
            >
              <div className="card" style={{ padding: "18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <Truck size={18} color="var(--accent-primary)" />
                  <h4 style={{ fontWeight: 600 }}>Free Express Delivery</h4>
                </div>
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Automatic free priority dispatch on all orders exceeding $150.
                </p>
              </div>

              <div className="card" style={{ padding: "18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <Lock size={18} color="var(--accent-emerald)" />
                  <h4 style={{ fontWeight: 600 }}>PostgreSQL ACID Safety</h4>
                </div>
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Database-level inventory locking and transaction rollbacks on error.
                </p>
              </div>

              <div className="card" style={{ padding: "18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <RefreshCw size={18} color="var(--accent-primary)" />
                  <h4 style={{ fontWeight: 600 }}>30-Day Effortless Returns</h4>
                </div>
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Try any timepiece or footwear at home with prepaid return packaging.
                </p>
              </div>

              <div className="card" style={{ padding: "18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <ShieldCheck size={18} color="var(--accent-amber)" />
                  <h4 style={{ fontWeight: 600 }}>2-Year Craft Guarantee</h4>
                </div>
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Comprehensive hardware warranty covering manufacturing tolerances.
                </p>
              </div>
            </div>

            {/* Catalog Section Header & Filter Controls */}
            <div id="catalog-section" style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  marginBottom: "16px",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <h2 style={{ fontSize: "1.6rem", fontWeight: 800 }}>Store Catalog</h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
                    Showing {filteredProducts.length} of {products.length} products
                  </p>
                </div>

                {/* Search Input */}
                <div style={{ position: "relative", minWidth: "260px" }}>
                  <Search
                    size={16}
                    color="var(--text-muted)"
                    style={{ position: "absolute", left: "12px", top: "11px" }}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by keyword, SKU, or specs..."
                    className="input-field"
                    style={{ paddingLeft: "36px" }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="btn btn-ghost btn-sm btn-icon-sm"
                      style={{ position: "absolute", right: "8px", top: "6px" }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Pills & Sort Controls */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                  borderBottom: "1px solid var(--border-subtle)",
                  paddingBottom: "14px",
                }}
              >
                {/* Category Pills */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {[
                    { id: "all", label: "All Items" },
                    { id: "timepieces", label: "Horology / Watches" },
                    { id: "footwear", label: "Footwear & Slides" },
                    { id: "tech", label: "Audio & Hardware" },
                    { id: "under100", label: "Under $100" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`btn btn-sm ${selectedCategory === cat.id ? "btn-primary" : "btn-secondary"}`}
                      style={{ borderRadius: "999px" }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Secondary Sort & In-Stock filter */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      style={{ cursor: "pointer" }}
                    />
                    <span>In Stock Only</span>
                  </label>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="input-field"
                    style={{ width: "auto", padding: "6px 10px", fontSize: "0.8rem", cursor: "pointer" }}
                  >
                    <option value="featured">Sort: Featured</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating">Sort: Best Rated</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Product Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "24px",
                marginBottom: "48px",
              }}
            >
              {filteredProducts.map((prod) => {
                const meta = resolveProductMeta(prod);
                const isOutOfStock = prod.stock <= 0;
                const isLowStock = prod.stock > 0 && prod.stock <= 5;
                const isFavorited = wishlist.includes(prod.id);

                return (
                  <div
                    key={prod.id}
                    className="product-card"
                    onClick={() => {
                      setQuickViewProduct(prod);
                      setQuickViewQty(1);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Image Area with badges & wishlist toggle */}
                    <div className="product-img-wrapper">
                      <img
                        src={meta.image}
                        alt={prod.name}
                        className="product-img"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = CURATED_IMAGE_PRESETS[0].url;
                        }}
                      />

                      {/* Stock Pill */}
                      <span
                        className={`pill ${
                          isOutOfStock ? "pill-stock-out" : isLowStock ? "pill-stock-low" : "pill-stock-high"
                        }`}
                        style={{ position: "absolute", top: "10px", left: "10px", zIndex: 2 }}
                      >
                        {isOutOfStock ? "Sold Out" : isLowStock ? `Only ${prod.stock} left` : "In Stock"}
                      </span>

                      {/* Wishlist Heart Button */}
                      <button
                        onClick={(e) => toggleWishlist(prod.id, e)}
                        className="wishlist-btn"
                        title={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
                        aria-label="Wishlist toggle"
                      >
                        <Heart
                          size={16}
                          color={isFavorited ? "var(--accent-rose)" : "var(--text-muted)"}
                          fill={isFavorited ? "var(--accent-rose)" : "none"}
                        />
                      </button>

                      {/* Quick View Button on Card Hover */}
                      <div className="quick-view-overlay">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuickViewProduct(prod);
                            setQuickViewQty(1);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ width: "100%", backdropFilter: "blur(8px)" }}
                        >
                          <Eye size={14} /> Quick Preview
                        </button>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div style={{ padding: "16px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                      <div>
                        {/* Category & Rating */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "0.74rem",
                            color: "var(--text-muted)",
                            marginBottom: "6px",
                          }}
                        >
                          <span>{meta.category.toUpperCase()}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                            <Star size={12} color="#f59e0b" fill="#f59e0b" />
                            <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{meta.rating}</span>
                            <span>({meta.reviewCount})</span>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "6px" }}>{prod.name}</h3>

                        {/* Short Description */}
                        <p
                          style={{
                            fontSize: "0.82rem",
                            color: "var(--text-secondary)",
                            lineHeight: 1.45,
                            marginBottom: "14px",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {prod.description || "Precision engineered lifestyle asset backed by our authenticity guarantee."}
                        </p>

                        {/* Stock Progress Bar */}
                        <div style={{ marginBottom: "16px" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "0.72rem",
                              color: "var(--text-subtle)",
                              marginBottom: "4px",
                            }}
                          >
                            <span>Remaining Stock</span>
                            <span>{prod.stock} units</span>
                          </div>
                          <div className="progress-bar-bg">
                            <div
                              className="progress-bar-fill"
                              style={{
                                width: `${Math.min(100, (prod.stock / 20) * 100)}%`,
                                background: isOutOfStock
                                  ? "var(--accent-rose)"
                                  : isLowStock
                                  ? "var(--accent-amber)"
                                  : "var(--accent-emerald)",
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Bottom Price & Add to Cart Action */}
                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            marginBottom: "12px",
                            paddingTop: "10px",
                            borderTop: "1px solid var(--border-subtle)",
                          }}
                        >
                          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Price</span>
                          <span className="mono-font" style={{ fontSize: "1.25rem", fontWeight: 700 }}>
                            ${prod.price.toFixed(2)}
                          </span>
                        </div>

                        <button
                          onClick={(e) => handleAddToCart(prod, 1, e)}
                          disabled={isOutOfStock}
                          className={`btn ${isOutOfStock ? "btn-secondary" : "btn-primary"}`}
                          style={{ width: "100%" }}
                        >
                          <ShoppingBag size={15} />
                          {isOutOfStock ? "Sold Out" : "Add to Cart"}
                        </button>

                        {/* Admin Inline Edit/Delete Quick Shortcuts */}
                        {user?.role === "admin" && (
                          <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                            <button
                              onClick={(e) => handleOpenEditProduct(prod, e)}
                              className="btn btn-ghost btn-sm"
                              style={{ flex: 1 }}
                            >
                              <Edit3 size={13} /> Edit
                            </button>
                            <button
                              onClick={(e) => handleDeleteProduct(prod.id, prod.name, e)}
                              className="btn btn-danger btn-sm"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Clean Newsletter Section */}
            <section
              className="card"
              style={{
                padding: "36px",
                background: "var(--bg-subtle)",
                textAlign: "center",
                maxWidth: "680px",
                margin: "0 auto 36px auto",
              }}
            >
              <h3 style={{ fontSize: "1.4rem", marginBottom: "8px" }}>Join the Meridian Collective</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "20px" }}>
                Receive private access to seasonal drops, unreleased timepieces, and 10% off your initial acquisition.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  showToast("Thank you for joining the Meridian collective!", "success");
                }}
                style={{ display: "flex", gap: "8px", maxWidth: "420px", margin: "0 auto" }}
              >
                <input
                  type="email"
                  required
                  placeholder="Enter your email address..."
                  className="input-field"
                  style={{ background: "var(--bg-surface)" }}
                />
                <button type="submit" className="btn btn-primary">
                  Subscribe
                </button>
              </form>
            </section>
          </div>
        )}

        {/* ==========================================
            VIEW 2: CUSTOMER DASHBOARD (RBAC: USER)
            ========================================== */}
        {currentView === "customer-dashboard" && (
          <div style={{ maxWidth: "980px", margin: "0 auto" }}>
            {/* Customer Greeting Header */}
            <div
              className="card"
              style={{
                padding: "28px",
                marginBottom: "24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <div>
                <span className="pill pill-user" style={{ marginBottom: "8px" }}>
                  Customer Portal (Role: {user?.role || "Guest"})
                </span>
                <h1 style={{ fontSize: "1.8rem", fontWeight: 800 }}>Welcome back, {user?.name || "Shopper"} 👋</h1>
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginTop: "4px" }}>
                  Manage your active deliveries, invoice history, and personal order receipts.
                </p>
              </div>

              <button onClick={() => setCurrentView("home")} className="btn btn-secondary">
                <ShoppingBag size={15} /> Continue Shopping
              </button>
            </div>

            {/* Customer KPI Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
                marginBottom: "28px",
              }}
            >
              <div className="kpi-card kpi-card-emerald">
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>Lifetime Purchases</span>
                <div className="mono-font" style={{ fontSize: "1.6rem", fontWeight: 700, margin: "6px 0", color: "var(--accent-emerald)" }}>
                  ${customerStats.totalSpent.toFixed(2)}
                </div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-subtle)" }}>Verified in PostgreSQL DB</span>
              </div>

              <div className="kpi-card kpi-card-blue">
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>Completed Orders</span>
                <div className="mono-font" style={{ fontSize: "1.6rem", fontWeight: 700, margin: "6px 0" }}>
                  {customerStats.ordersCount}
                </div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-subtle)" }}>Permanent ACID records</span>
              </div>

              <div className="kpi-card">
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>Saved Wishlist Items</span>
                <div className="mono-font" style={{ fontSize: "1.6rem", fontWeight: 700, margin: "6px 0", color: "var(--accent-rose)" }}>
                  {customerStats.wishlistCount}
                </div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-subtle)" }}>Saved to browser cache</span>
              </div>

              <div className="kpi-card kpi-card-amber">
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>Membership Tier</span>
                <div style={{ fontSize: "1.4rem", fontWeight: 700, margin: "6px 0", color: "var(--accent-amber)" }}>
                  Silver Elite
                </div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-subtle)" }}>Free Express Shipping Active</span>
              </div>
            </div>

            {/* Orders Tracking List */}
            <div style={{ marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "16px" }}>
                Orders & Live Tracking ({orders.length})
              </h2>

              {orders.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "60px 20px" }}>
                  <Layers size={44} color="var(--text-subtle)" style={{ marginBottom: "12px" }} />
                  <h3 style={{ marginBottom: "6px" }}>No orders recorded yet</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "20px" }}>
                    Your purchase receipts and line item details will appear here as soon as you checkout.
                  </p>
                  <button onClick={() => setCurrentView("home")} className="btn btn-primary">
                    Browse Catalog Now
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {orders.map((ord) => (
                    <div key={ord.id} className="card" style={{ padding: "24px" }}>
                      {/* Order Header */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderBottom: "1px solid var(--border-subtle)",
                          paddingBottom: "14px",
                          marginBottom: "18px",
                          flexWrap: "wrap",
                          gap: "10px",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span className="mono-font" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                              Order #{ord.id}
                            </span>
                            <button
                              onClick={() => handleCopyOrderId(ord.id)}
                              className="btn btn-ghost btn-sm btn-icon-sm"
                              title="Copy Order ID"
                            >
                              {copiedOrderId === ord.id ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
                            </button>
                            <span className="pill pill-stock-high">
                              <CheckCircle size={12} /> {ord.status.toUpperCase()}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "3px" }}>
                            Placed on {new Date(ord.created_at).toLocaleString()}
                          </div>
                        </div>

                        <div className="mono-font" style={{ fontSize: "1.3rem", fontWeight: 700 }}>
                          ${ord.total_amount.toFixed(2)}
                        </div>
                      </div>

                      {/* Visual Stepper / Delivery Timeline */}
                      <div style={{ marginBottom: "24px" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px" }}>
                          Shipment Progress
                        </div>
                        <div className="timeline-track">
                          <div className="timeline-line" />
                          <div className="timeline-line-active" style={{ width: "66%" }} />

                          <div className="timeline-node">
                            <div className="timeline-dot timeline-dot-active">
                              <Check size={13} />
                            </div>
                            <span className="timeline-label timeline-label-active">Confirmed</span>
                          </div>

                          <div className="timeline-node">
                            <div className="timeline-dot timeline-dot-active">
                              <Check size={13} />
                            </div>
                            <span className="timeline-label timeline-label-active">Processing</span>
                          </div>

                          <div className="timeline-node">
                            <div className="timeline-dot timeline-dot-active">
                              <Truck size={13} />
                            </div>
                            <span className="timeline-label timeline-label-active">In Transit</span>
                          </div>

                          <div className="timeline-node">
                            <div className="timeline-dot">
                              <Box size={13} />
                            </div>
                            <span className="timeline-label">Delivered</span>
                          </div>
                        </div>
                      </div>

                      {/* Items Purchased List */}
                      <div
                        style={{
                          background: "var(--bg-subtle)",
                          borderRadius: "10px",
                          padding: "14px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                        }}
                      >
                        {ord.items.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: "0.85rem",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <span
                                style={{
                                  background: "var(--bg-tag)",
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  fontWeight: 600,
                                  fontSize: "0.75rem",
                                }}
                              >
                                {item.quantity}x
                              </span>
                              <span>Product SKU #{item.product_id} ({item.product_name || "Catalog Item"})</span>
                            </div>
                            <div className="mono-font" style={{ fontWeight: 600 }}>
                              ${item.price.toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==========================================
            VIEW 3: ADMIN COMMAND DECK (RBAC: ADMIN)
            ========================================== */}
        {currentView === "admin-deck" && (
          <div style={{ maxWidth: "1140px", margin: "0 auto" }}>
            {/* RBAC Security Guard: If not admin, show 403 Forbidden screen */}
            {user?.role !== "admin" ? (
              <div className="card" style={{ padding: "60px 24px", textAlign: "center", maxWidth: "600px", margin: "40px auto" }}>
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    background: "var(--accent-rose-subtle)",
                    color: "var(--accent-rose)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px auto",
                  }}
                >
                  <Lock size={30} />
                </div>
                <span className="pill pill-stock-out" style={{ marginBottom: "12px" }}>
                  403 Forbidden // RBAC Enforced
                </span>
                <h2 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "8px" }}>
                  Admin Authorization Required
                </h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "24px" }}>
                  Your current session is authenticated as <strong>{user?.name || "Guest"}</strong> with role{" "}
                  <code>{user?.role || "anonymous"}</code>. This administrative console requires an authenticated JWT
                  with <code>role: 'admin'</code>.
                </p>

                <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                  <button
                    onClick={() => handleQuickSwitch("admin@example.com", "admin1234", "admin-deck")}
                    className="btn btn-primary"
                  >
                    <Shield size={15} /> Switch to Admin Persona
                  </button>
                  <button onClick={() => setCurrentView("home")} className="btn btn-secondary">
                    Return to Catalog
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Admin Welcome & Action Bar */}
                <div
                  className="card"
                  style={{
                    padding: "24px",
                    marginBottom: "24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "16px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span className="pill pill-admin">🔐 RBAC VERIFIED: ADMINISTRATOR</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>FastAPI JWT Authenticated</span>
                    </div>
                    <h1 style={{ fontSize: "1.8rem", fontWeight: 800 }}>Store Command & Analytics Deck</h1>
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={handleOpenAddProduct} className="btn btn-primary">
                      <Plus size={15} /> Create New Product
                    </button>
                    <button
                      onClick={() => {
                        loadProducts();
                        loadAllOrders();
                        showToast("Live inventory synced with PostgreSQL", "info");
                      }}
                      className="btn btn-secondary"
                    >
                      <RefreshCw size={14} /> Refresh Data
                    </button>
                  </div>
                </div>

                {/* Admin Business KPI Cards */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                    gap: "16px",
                    marginBottom: "28px",
                  }}
                >
                  <div className="kpi-card kpi-card-emerald">
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Total Gross Revenue</span>
                    <div className="mono-font" style={{ fontSize: "1.6rem", fontWeight: 700, margin: "6px 0", color: "var(--accent-emerald)" }}>
                      ${adminStats.revenue.toFixed(2)}
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-subtle)" }}>Calculated from {allOrders.length} orders</span>
                  </div>

                  <div className="kpi-card kpi-card-blue">
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Active Orders Stream</span>
                    <div className="mono-font" style={{ fontSize: "1.6rem", fontWeight: 700, margin: "6px 0" }}>
                      {adminStats.ordersCount}
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-subtle)" }}>All customer checkouts</span>
                  </div>

                  <div className="kpi-card">
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Total Catalog Assets</span>
                    <div className="mono-font" style={{ fontSize: "1.6rem", fontWeight: 700, margin: "6px 0" }}>
                      {adminStats.productCount}
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-subtle)" }}>Products in PostgreSQL</span>
                  </div>

                  <div className="kpi-card kpi-card-amber">
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Low Stock Warnings</span>
                    <div
                      className="mono-font"
                      style={{
                        fontSize: "1.6rem",
                        fontWeight: 700,
                        margin: "6px 0",
                        color: adminStats.lowStockCount > 0 ? "var(--accent-amber)" : "var(--accent-emerald)",
                      }}
                    >
                      {adminStats.lowStockCount} items
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-subtle)" }}>Under 5 units available</span>
                  </div>
                </div>

                {/* Catalog Management Table */}
                <div className="card" style={{ padding: "24px", marginBottom: "28px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "18px",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <h2 style={{ fontSize: "1.3rem", fontWeight: 700 }}>Inventory Catalog Management</h2>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                        Update unit pricing, stock levels, or delete listings directly from the backend.
                      </p>
                    </div>
                  </div>

                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-subtle)", textAlign: "left" }}>
                          <th style={{ padding: "10px 12px", color: "var(--text-muted)" }}>ITEM</th>
                          <th style={{ padding: "10px 12px", color: "var(--text-muted)" }}>CATEGORY</th>
                          <th style={{ padding: "10px 12px", color: "var(--text-muted)" }}>PRICE</th>
                          <th style={{ padding: "10px 12px", color: "var(--text-muted)" }}>STOCK</th>
                          <th style={{ padding: "10px 12px", color: "var(--text-muted)" }}>STATUS</th>
                          <th style={{ padding: "10px 12px", color: "var(--text-muted)", textAlign: "right" }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((prod) => {
                          const meta = resolveProductMeta(prod);
                          const isOutOfStock = prod.stock <= 0;
                          const isLowStock = prod.stock > 0 && prod.stock <= 5;

                          return (
                            <tr
                              key={prod.id}
                              style={{
                                borderBottom: "1px solid var(--border-subtle)",
                                transition: "background-color 0.15s ease",
                              }}
                            >
                              <td style={{ padding: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                                <img
                                  src={meta.image}
                                  alt={prod.name}
                                  style={{ width: "38px", height: "38px", borderRadius: "6px", objectFit: "cover" }}
                                />
                                <div>
                                  <div style={{ fontWeight: 600 }}>{prod.name}</div>
                                  <div style={{ fontSize: "0.72rem", color: "var(--text-subtle)" }}>SKU #{prod.id}</div>
                                </div>
                              </td>

                              <td style={{ padding: "12px", color: "var(--text-muted)" }}>{meta.category}</td>

                              <td style={{ padding: "12px" }}>
                                <span className="mono-font" style={{ fontWeight: 700 }}>
                                  ${prod.price.toFixed(2)}
                                </span>
                              </td>

                              <td style={{ padding: "12px" }}>
                                <span className="mono-font">{prod.stock} units</span>
                              </td>

                              <td style={{ padding: "12px" }}>
                                <span
                                  className={`pill ${
                                    isOutOfStock ? "pill-stock-out" : isLowStock ? "pill-stock-low" : "pill-stock-high"
                                  }`}
                                >
                                  {isOutOfStock ? "Depleted" : isLowStock ? "Low" : "Healthy"}
                                </span>
                              </td>

                              <td style={{ padding: "12px", textAlign: "right" }}>
                                <div style={{ display: "inline-flex", gap: "6px" }}>
                                  <button
                                    onClick={() => handleOpenEditProduct(prod)}
                                    className="btn btn-ghost btn-sm"
                                    title="Edit Product"
                                  >
                                    <Edit3 size={14} /> Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(prod.id, prod.name)}
                                    className="btn btn-danger btn-sm"
                                    title="Delete Product"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Global Orders Feed */}
                <div className="card" style={{ padding: "24px" }}>
                  <div style={{ marginBottom: "16px" }}>
                    <h2 style={{ fontSize: "1.3rem", fontWeight: 700 }}>All Customer Orders (Global Stream)</h2>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                      Fetched directly from <code>/orders/admin/orders</code> with RBAC token protection.
                    </p>
                  </div>

                  {allOrders.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
                      No customer orders have been placed yet.
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--border-subtle)", textAlign: "left" }}>
                            <th style={{ padding: "10px 12px", color: "var(--text-muted)" }}>ORDER ID</th>
                            <th style={{ padding: "10px 12px", color: "var(--text-muted)" }}>USER ID</th>
                            <th style={{ padding: "10px 12px", color: "var(--text-muted)" }}>DATE</th>
                            <th style={{ padding: "10px 12px", color: "var(--text-muted)" }}>ITEMS COUNT</th>
                            <th style={{ padding: "10px 12px", color: "var(--text-muted)" }}>TOTAL</th>
                            <th style={{ padding: "10px 12px", color: "var(--text-muted)" }}>STATUS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allOrders.map((ord) => (
                            <tr key={ord.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                              <td style={{ padding: "12px" }}>
                                <span className="mono-font" style={{ fontWeight: 700 }}>
                                  #{ord.id}
                                </span>
                              </td>
                              <td style={{ padding: "12px", color: "var(--text-muted)" }}>User #{ord.user_id}</td>
                              <td style={{ padding: "12px", color: "var(--text-muted)" }}>
                                {new Date(ord.created_at).toLocaleString()}
                              </td>
                              <td style={{ padding: "12px" }}>{ord.items.length} line item(s)</td>
                              <td style={{ padding: "12px" }}>
                                <span className="mono-font" style={{ fontWeight: 700, color: "var(--accent-emerald)" }}>
                                  ${ord.total_amount.toFixed(2)}
                                </span>
                              </td>
                              <td style={{ padding: "12px" }}>
                                <span className="pill pill-stock-high">{ord.status.toUpperCase()}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ==========================================
          FOOTER
          ========================================== */}
      <footer
        style={{
          borderTop: "1px solid var(--border-subtle)",
          background: "var(--bg-surface)",
          padding: "32px 20px",
          marginTop: "40px",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px",
            fontSize: "0.82rem",
            color: "var(--text-muted)",
          }}
        >
          <div>
            <span className="brand-font" style={{ fontWeight: 800, color: "var(--text-main)", fontSize: "1rem" }}>
              MERIDIAN // CURATED ESSENTIALS
            </span>
            <div style={{ marginTop: "4px" }}>
              FastAPI + PostgreSQL 18 + React Vite TypeScript. Simple, neat & responsive.
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <span style={{ color: "var(--accent-emerald)" }}>● PostgreSQL 18 Live Connected</span>
            <span>•</span>
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="btn btn-ghost btn-sm">
              Back to Top ↑
            </button>
          </div>
        </div>
      </footer>

      {/* ==========================================
          DRAWER: SLIDE-OUT SHOPPING CART
          ========================================== */}
      {cartOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setCartOpen(false)} />
          <div className="drawer-content">
            {/* Drawer Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--border-subtle)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShoppingBag size={18} />
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Your Shopping Bag</h3>
                <span className="pill pill-user">{totalCartCount} items</span>
              </div>
              <button onClick={() => setCartOpen(false)} className="btn btn-ghost btn-sm btn-icon">
                <X size={18} />
              </button>
            </div>

            {/* Dynamic Free Shipping Meter */}
            <div
              style={{
                padding: "14px 24px",
                background: "var(--bg-subtle)",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "6px" }}>
                <span>
                  {remainingForFreeShipping > 0
                    ? `Add $${remainingForFreeShipping.toFixed(2)} more for Free Express Shipping`
                    : "🎉 You've unlocked Complimentary Express Shipping!"}
                </span>
                <span style={{ fontWeight: 600 }}>{Math.round(freeShippingProgress)}%</span>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${freeShippingProgress}%`,
                    background: remainingForFreeShipping === 0 ? "var(--accent-emerald)" : "var(--accent-primary)",
                  }}
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              {cart.items.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <ShoppingBag size={48} color="var(--text-subtle)" style={{ marginBottom: "16px" }} />
                  <h4 style={{ marginBottom: "6px" }}>Your bag is empty</h4>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.84rem", marginBottom: "20px" }}>
                    Discover our collection of curated timepieces and lifestyle essentials.
                  </p>
                  <button onClick={() => setCartOpen(false)} className="btn btn-primary btn-sm">
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {cart.items.map((item) => {
                    const itemProduct = products.find((p) => p.id === item.product_id);
                    const meta = itemProduct ? resolveProductMeta(itemProduct) : resolveProductMeta({ id: item.product_id, name: item.product_name, price: item.price, stock: 10, created_at: "" });

                    return (
                      <div
                        key={item.id}
                        className="card"
                        style={{ padding: "12px", display: "flex", gap: "12px", alignItems: "center" }}
                      >
                        <img
                          src={meta.image}
                          alt={item.product_name}
                          style={{ width: "64px", height: "64px", borderRadius: "8px", objectFit: "cover" }}
                        />

                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{item.product_name}</div>
                          <div className="mono-font" style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                            ${item.price.toFixed(2)} each
                          </div>

                          {/* Stepper Controls */}
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                border: "1px solid var(--border-subtle)",
                                borderRadius: "6px",
                                background: "var(--bg-subtle)",
                              }}
                            >
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                                className="btn btn-ghost btn-sm"
                                style={{ padding: "2px 8px" }}
                              >
                                <Minus size={12} />
                              </button>
                              <span className="mono-font" style={{ padding: "0 8px", fontSize: "0.82rem", fontWeight: 700 }}>
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                                className="btn btn-ghost btn-sm"
                                style={{ padding: "2px 8px" }}
                              >
                                <Plus size={12} />
                              </button>
                            </div>

                            <button
                              onClick={() => handleRemoveFromCart(item.id)}
                              className="btn btn-ghost btn-sm btn-icon-sm"
                              title="Remove item"
                            >
                              <Trash2 size={13} color="var(--accent-rose)" />
                            </button>
                          </div>
                        </div>

                        <div className="mono-font" style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Drawer Footer & Checkout Button */}
            {cart.items.length > 0 && (
              <div
                style={{
                  padding: "20px 24px",
                  borderTop: "1px solid var(--border-subtle)",
                  background: "var(--bg-surface)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.88rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
                  <span className="mono-font" style={{ fontWeight: 700 }}>
                    ${cart.total.toFixed(2)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px", fontSize: "0.82rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Express Shipping</span>
                  <span style={{ color: remainingForFreeShipping === 0 ? "var(--accent-emerald)" : "var(--text-main)" }}>
                    {remainingForFreeShipping === 0 ? "FREE" : "$12.00"}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: "10px",
                    borderTop: "1px solid var(--border-subtle)",
                    marginBottom: "16px",
                  }}
                >
                  <span style={{ fontWeight: 700 }}>Estimated Total</span>
                  <span className="mono-font" style={{ fontSize: "1.3rem", fontWeight: 800 }}>
                    ${(cart.total + (remainingForFreeShipping === 0 ? 0 : 12)).toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "12px", fontSize: "0.95rem" }}
                >
                  <Lock size={15} />
                  {loading ? "Committing Transaction..." : "Proceed to Secure Checkout"}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ==========================================
          MODAL: QUICK VIEW PRODUCT DETAILS
          ========================================== */}
      {quickViewProduct && (
        <div className="modal-overlay" onClick={() => setQuickViewProduct(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: "720px", padding: "24px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
              <button onClick={() => setQuickViewProduct(null)} className="btn btn-ghost btn-sm btn-icon">
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "center" }}>
              <div style={{ borderRadius: "12px", overflow: "hidden", aspectRatio: "1/1", background: "var(--bg-subtle)" }}>
                <img
                  src={resolveProductMeta(quickViewProduct).image}
                  alt={quickViewProduct.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>

              <div>
                <span className="pill pill-user" style={{ marginBottom: "8px" }}>
                  {resolveProductMeta(quickViewProduct).category} • SKU #{quickViewProduct.id}
                </span>

                <h2 style={{ fontSize: "1.45rem", marginBottom: "8px" }}>{quickViewProduct.name}</h2>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px", fontSize: "0.82rem" }}>
                  <div style={{ display: "flex", color: "#f59e0b" }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />
                    ))}
                  </div>
                  <span style={{ fontWeight: 600 }}>{resolveProductMeta(quickViewProduct).rating}</span>
                  <span style={{ color: "var(--text-muted)" }}>
                    ({resolveProductMeta(quickViewProduct).reviewCount} reviews)
                  </span>
                </div>

                <div className="mono-font" style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "16px" }}>
                  ${quickViewProduct.price.toFixed(2)}
                </div>

                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.55, marginBottom: "20px" }}>
                  {quickViewProduct.description ||
                    "Individually inspected and calibrated. Sourced with highest material standards and lifetime support."}
                </p>

                {/* Stock info */}
                <div style={{ marginBottom: "18px" }}>
                  <span
                    className={`pill ${
                      quickViewProduct.stock <= 0
                        ? "pill-stock-out"
                        : quickViewProduct.stock <= 5
                        ? "pill-stock-low"
                        : "pill-stock-high"
                    }`}
                  >
                    {quickViewProduct.stock <= 0
                      ? "Out of Stock"
                      : `${quickViewProduct.stock} units available in warehouse`}
                  </span>
                </div>

                {/* Quantity picker + Add to cart */}
                <div style={{ display: "flex", gap: "10px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "8px",
                      background: "var(--bg-subtle)",
                    }}
                  >
                    <button
                      onClick={() => setQuickViewQty(Math.max(1, quickViewQty - 1))}
                      className="btn btn-ghost btn-sm"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="mono-font" style={{ padding: "0 10px", fontWeight: 700 }}>
                      {quickViewQty}
                    </span>
                    <button
                      onClick={() => setQuickViewQty(Math.min(quickViewProduct.stock, quickViewQty + 1))}
                      className="btn btn-ghost btn-sm"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      handleAddToCart(quickViewProduct, quickViewQty);
                      setQuickViewProduct(null);
                    }}
                    disabled={quickViewProduct.stock <= 0}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    <ShoppingBag size={16} /> Add {quickViewQty} to Bag
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: CHECKOUT CONFIRMATION RECEIPT
          ========================================== */}
      {checkoutModalOrder && (
        <div className="modal-overlay" onClick={() => setCheckoutModalOrder(null)}>
          <div className="modal-content" style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "var(--accent-emerald-subtle)",
                color: "var(--accent-emerald)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
              }}
            >
              <CheckCircle size={32} />
            </div>

            <h3 style={{ fontSize: "1.45rem", fontWeight: 700, marginBottom: "6px" }}>Order Confirmed!</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "20px" }}>
              PostgreSQL ACID transaction successfully committed. Inventory deducted and order receipt archived.
            </p>

            <div
              style={{
                background: "var(--bg-subtle)",
                borderRadius: "10px",
                padding: "16px",
                textAlign: "left",
                marginBottom: "20px",
                fontSize: "0.84rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "var(--text-muted)" }}>Order Reference:</span>
                <span className="mono-font" style={{ fontWeight: 700 }}>
                  #{checkoutModalOrder.id}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "var(--text-muted)" }}>Total Paid:</span>
                <span className="mono-font" style={{ fontWeight: 700, color: "var(--accent-emerald)" }}>
                  ${checkoutModalOrder.total_amount.toFixed(2)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Line Items:</span>
                <span>{checkoutModalOrder.items.length} item(s)</span>
              </div>
            </div>

            <button
              onClick={() => {
                setCheckoutModalOrder(null);
                setCurrentView("customer-dashboard");
              }}
              className="btn btn-primary"
              style={{ width: "100%" }}
            >
              Track in Customer Dashboard
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: ADMIN PRODUCT CREATE / EDIT
          ========================================== */}
      {productModalOpen && (
        <div className="modal-overlay" onClick={() => setProductModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                {editingProduct ? `Edit Product #${editingProduct.id}` : "Create New Catalog Product"}
              </h3>
              <button onClick={() => setProductModalOpen(false)} className="btn btn-ghost btn-sm btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "5px" }}>
                  Product Title
                </label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="e.g. Minimalist Chronograph 40mm"
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "5px" }}>
                  Description (Specifications & Details)
                </label>
                <textarea
                  rows={3}
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  placeholder="Features, materials, and origin..."
                  className="input-field"
                  style={{ resize: "vertical" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "5px" }}>
                    Price ($ USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(parseFloat(e.target.value) || 0)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "5px" }}>
                    Initial Stock Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={prodStock}
                    onChange={(e) => setProdStock(parseInt(e.target.value, 10) || 0)}
                    className="input-field"
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: "8px", width: "100%", padding: "11px" }}>
                {editingProduct ? "Save Changes" : "Create Product in Database"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: AUTHENTICATION (SIGN IN / REGISTER)
          ========================================== */}
      {authModalOpen && (
        <div className="modal-overlay" onClick={() => setAuthModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className={`btn btn-sm ${authMode === "login" ? "btn-primary" : "btn-ghost"}`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("register")}
                  className={`btn btn-sm ${authMode === "register" ? "btn-primary" : "btn-ghost"}`}
                >
                  Register
                </button>
              </div>
              <button onClick={() => setAuthModalOpen(false)} className="btn btn-ghost btn-sm btn-icon">
                <X size={18} />
              </button>
            </div>

            {authMode === "login" ? (
              <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "5px" }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "5px" }}>
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="input-field"
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: "6px", width: "100%", padding: "10px" }}>
                  Sign In with JWT
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "5px" }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="input-field"
                    placeholder="e.g. Jordan Lee"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "5px" }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="input-field"
                    placeholder="jordan@meridian.com"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "5px" }}>
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "5px" }}>
                    Role Assignment
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as "user" | "admin")}
                    className="input-field"
                    style={{ cursor: "pointer" }}
                  >
                    <option value="user">Customer (Default)</option>
                    <option value="admin">Store Administrator</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: "6px", width: "100%", padding: "10px" }}>
                  Create Account
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          FLOATING TOAST NOTIFICATIONS
          ========================================== */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === "success" && <CheckCircle size={16} color="var(--accent-emerald)" />}
            {toast.type === "error" && <AlertTriangle size={16} color="var(--accent-rose)" />}
            {toast.type === "info" && <CheckCircle size={16} color="var(--accent-primary)" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
