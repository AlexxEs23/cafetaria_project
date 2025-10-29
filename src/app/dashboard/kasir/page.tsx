"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Modal from "@/components/Modal";
import LoadingModal from "@/components/LoadingModal";
import SkeletonCard from "@/components/SkeletonCard";
import Toast from "@/components/Toast";

interface Item {
  id: number;
  namaBarang: string;
  fotoUrl: string;
  jumlahStok: number;
  hargaSatuan: number;
}

interface CartItem {
  item: Item;
  quantity: number;
}

interface TransactionDetailWithItem {
  id: number;
  transactionId: number;
  itemId: number;
  jumlah: number;
  hargaSatuan: number;
  subtotal: number;
  item?: {
    id: number;
    namaBarang: string;
    hargaSatuan: number;
  };
}

interface PendingTransaction {
  id: number;
  totalHarga: number;
  status: string;
  customerName: string | null;
  customerLocation: string | null;
  notes: string | null;
  createdAt: Date;
  details?: TransactionDetailWithItem[];
  kasir?: {
    id: number;
    name: string;
    email: string;
  };
}

interface TransactionResponse {
  transaction: {
    id: number;
    kasirId: number;
    totalHarga: number;
    status: string;
    tanggal?: Date;
    createdAt: Date;
    details?: TransactionDetailWithItem[];
  };
}

export default function KasirDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingTransaction[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"menu" | "orders">("menu");
  const [transactionResult, setTransactionResult] =
    useState<TransactionResponse | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/items?status=TERSEDIA", {
        cache: "no-store",
        next: { revalidate: 0 },
      });
      if (!res.ok) throw new Error("Failed to fetch items");
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error("Error fetching items:", error);
      alert("Gagal memuat data menu. Silakan refresh halaman.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPendingOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/transactions?status=PENDING", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch pending orders");
      const data = await res.json();
      setPendingOrders(data.transactions || []);
    } catch (error) {
      console.error("Error fetching pending orders:", error);
    }
  }, []);

  useEffect(() => {
    fetchItems();
    fetchPendingOrders();
  }, [fetchItems, fetchPendingOrders]);

  const addToCart = useCallback(
    (item: Item) => {
      const existingItem = cart.find((c) => c.item.id === item.id);

      if (existingItem) {
        if (existingItem.quantity >= item.jumlahStok) {
          setToast({ message: "Stok tidak cukup!", type: "error" });
          return;
        }
        setCart(
          cart.map((c) =>
            c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
          )
        );
      } else {
        setCart([...cart, { item, quantity: 1 }]);
      }
      setToast({
        message: `${item.namaBarang} ditambahkan ke keranjang`,
        type: "success",
      });
    },
    [cart]
  );

  const removeFromCart = useCallback(
    (itemId: number) => {
      setCart(cart.filter((c) => c.item.id !== itemId));
    },
    [cart]
  );

  const updateQuantity = useCallback(
    (itemId: number, quantity: number) => {
      const item = items.find((i) => i.id === itemId);

      if (quantity <= 0) {
        removeFromCart(itemId);
        return;
      }

      if (item && quantity > item.jumlahStok) {
        setToast({ message: "Stok tidak cukup!", type: "error" });
        return;
      }

      setCart(cart.map((c) => (c.item.id === itemId ? { ...c, quantity } : c)));
    },
    [cart, items, removeFromCart]
  );

  const calculateTotal = useMemo(() => {
    return cart.reduce(
      (total, c) => total + c.item.hargaSatuan * c.quantity,
      0
    );
  }, [cart]);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setToast({ message: "Keranjang masih kosong!", type: "error" });
      return;
    }

    setProcessing(true);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cart.map((c) => ({
            itemId: c.item.id,
            quantity: c.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses transaksi");
      }

      setTransactionResult(data);
      setShowModal(true);
      setCart([]);
      fetchItems(); // Refresh items untuk update stok
    } catch (error) {
      console.error("Error processing transaction:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan. Silakan coba lagi.";
      setToast({ message: errorMessage, type: "error" });
    } finally {
      setProcessing(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setTransactionResult(null);
  };

  const handleApproveOrder = async (transactionId: number) => {
    if (!confirm("Apakah Anda yakin ingin menyetujui pesanan ini?")) return;

    setProcessing(true);
    try {
      const res = await fetch(`/api/transactions/${transactionId}/approve`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menyetujui pesanan");
      }

      setToast({ message: "Pesanan berhasil disetujui!", type: "success" });
      fetchPendingOrders();
      fetchItems(); // Refresh items untuk update stok
    } catch (error) {
      console.error("Error approving order:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan. Silakan coba lagi.";
      setToast({ message: errorMessage, type: "error" });
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectOrder = async (transactionId: number) => {
    const reason = prompt("Alasan penolakan (opsional):");
    if (reason === null) return; // User cancelled

    setProcessing(true);
    try {
      const res = await fetch(`/api/transactions/${transactionId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menolak pesanan");
      }

      setToast({ message: "Pesanan berhasil ditolak", type: "info" });
      fetchPendingOrders();
    } catch (error) {
      console.error("Error rejecting order:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan. Silakan coba lagi.";
      setToast({ message: errorMessage, type: "error" });
    } finally {
      setProcessing(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-teal-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3">
            {/* Title Section */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-white">
                  Dashboard Kasir
                </h1>
                <p className="text-xs sm:text-sm text-teal-100">
                  Selamat datang, {session?.user?.name}
                </p>
              </div>
            </div>

            {/* Buttons Section */}
            <div className="flex gap-2 flex-wrap">
              <a
                href="/dashboard/kasir/laporan"
                className="flex items-center justify-center gap-1 px-3 py-2 text-xs sm:text-sm bg-white text-teal-700 rounded-lg hover:bg-teal-50 font-medium transition-colors whitespace-nowrap"
              >
                📊 Laporan
              </a>
              <a
                href="/dashboard/kasir/settings"
                className="flex items-center justify-center gap-1 px-3 py-2 text-xs sm:text-sm bg-white text-teal-700 rounded-lg hover:bg-teal-50 font-medium transition-colors whitespace-nowrap"
              >
                ⚙️ <span className="hidden sm:inline">Pengaturan WA</span>
                <span className="sm:hidden">Pengaturan</span>
              </a>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center justify-center gap-1 px-3 py-2 text-xs sm:text-sm bg-white text-teal-700 rounded-lg hover:bg-teal-50 font-medium transition-colors whitespace-nowrap"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("menu")}
              className={`py-4 px-6 font-medium border-b-2 transition-colors ${
                activeTab === "menu"
                  ? "border-teal-700 text-teal-700"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Menu Kasir
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`py-4 px-6 font-medium border-b-2 transition-colors relative ${
                activeTab === "orders"
                  ? "border-teal-700 text-teal-700"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Pesanan Menunggu
              {pendingOrders.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingOrders.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-black">
        {activeTab === "menu" ? (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Items List */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold mb-4">Daftar Menu</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {loading ? (
                  <>
                    {[...Array(4)].map((_, i) => (
                      <SkeletonCard key={i} />
                    ))}
                  </>
                ) : items.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    Tidak ada menu tersedia saat ini
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-lg shadow-md overflow-hidden"
                    >
                      <div className="flex">
                        <div className="relative w-32 h-32 flex-shrink-0 bg-gray-100">
                          <Image
                            src={item.fotoUrl}
                            alt={item.namaBarang}
                            fill
                            sizes="128px"
                            className="object-cover"
                            loading="lazy"
                            placeholder="blur"
                            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
                          />
                        </div>
                        <div className="p-4 flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {item.namaBarang}
                          </h3>
                          <p className="text-sm text-gray-900 font-medium mb-2">
                            Rp {item.hargaSatuan.toLocaleString("id-ID")}
                          </p>
                          <p className="text-xs text-gray-900 mb-3">
                            Stok: {item.jumlahStok}
                          </p>
                          <button
                            onClick={() => addToCart(item)}
                            disabled={item.jumlahStok === 0}
                            className="bg-teal-700 text-white py-2 px-4 rounded-lg text-sm hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                          >
                            + Tambah
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Cart */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h2 className="text-xl font-bold mb-4">Keranjang</h2>

                {cart.length === 0 ? (
                  <p className="text-center text-gray-900 py-8">
                    Keranjang kosong
                  </p>
                ) : (
                  <>
                    <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                      {cart.map((cartItem) => (
                        <div key={cartItem.item.id} className="border-b pb-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-sm text-gray-900">
                              {cartItem.item.namaBarang}
                            </h4>
                            <button
                              onClick={() => removeFromCart(cartItem.item.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              ✕
                            </button>
                          </div>
                          <p className="text-sm text-gray-900 mb-2">
                            Rp{" "}
                            {cartItem.item.hargaSatuan.toLocaleString("id-ID")}
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  cartItem.item.id,
                                  cartItem.quantity - 1
                                )
                              }
                              className="bg-gray-200 px-3 py-1 rounded-lg text-sm hover:bg-gray-300 font-medium transition-colors"
                            >
                              -
                            </button>
                            <span className="text-sm font-medium">
                              {cartItem.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  cartItem.item.id,
                                  cartItem.quantity + 1
                                )
                              }
                              className="bg-gray-200 px-3 py-1 rounded-lg text-sm hover:bg-gray-300 font-medium transition-colors"
                            >
                              +
                            </button>
                            <span className="ml-auto text-sm font-medium text-teal-700">
                              Rp{" "}
                              {(
                                cartItem.item.hargaSatuan * cartItem.quantity
                              ).toLocaleString("id-ID")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-bold text-lg">Total:</span>
                        <span className="font-bold text-lg text-teal-700">
                          Rp {calculateTotal.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <button
                        onClick={handleCheckout}
                        disabled={processing}
                        className="w-full bg-teal-700 text-white py-3 px-4 rounded-lg hover:bg-teal-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {processing ? "Memproses..." : "Proses Transaksi"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Pending Orders Tab */
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-4">
              Pesanan Menunggu Persetujuan
            </h2>

            {pendingOrders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-500">
                  Tidak ada pesanan yang menunggu persetujuan
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-lg shadow-md p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          Pesanan #{order.id}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">
                        PENDING
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Nama Pembeli:</p>
                        <p className="font-semibold text-gray-900">
                          {order.customerName || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Lokasi:</p>
                        <p className="font-semibold text-gray-900">
                          {order.customerLocation || "-"}
                        </p>
                      </div>
                    </div>

                    {order.notes && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">Catatan:</p>
                        <p className="text-gray-900 bg-gray-50 p-2 rounded">
                          {order.notes}
                        </p>
                      </div>
                    )}

                    <div className="border-t pt-4 mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Detail Pesanan:
                      </h4>
                      <div className="space-y-2">
                        {order.details?.map((detail) => (
                          <div
                            key={detail.id}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-gray-900">
                              {detail.item?.namaBarang || "Item"} x{" "}
                              {detail.jumlah}
                            </span>
                            <span className="text-gray-900 font-medium">
                              Rp {detail.subtotal.toLocaleString("id-ID")}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t mt-3">
                        <span className="font-bold text-gray-900">Total:</span>
                        <span className="font-bold text-teal-700 text-lg">
                          Rp {order.totalHarga.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApproveOrder(order.id)}
                        disabled={processing}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                      >
                        ✓ Setujui
                      </button>
                      <button
                        onClick={() => handleRejectOrder(order.id)}
                        disabled={processing}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                      >
                        ✕ Tolak
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Loading Modal */}
      <LoadingModal isOpen={processing} message="Memproses Transaksi" />

      {/* Modal Transaksi Berhasil */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title="Transaksi Berhasil"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="mx-auto w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-teal-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Pembayaran Berhasil!
            </h3>
            <p className="text-gray-900">Transaksi telah diproses</p>
          </div>

          {transactionResult && (
            <div className="bg-gray-50 rounded-lg p-6 space-y-3">
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-gray-900 font-medium">ID Transaksi</span>
                <span className="text-gray-900 font-semibold">
                  #{transactionResult.transaction.id}
                </span>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 mb-3">
                  Detail Pembelian:
                </h4>
                {transactionResult.transaction.details?.map(
                  (detail: TransactionDetailWithItem, index: number) => {
                    const itemName = detail.item?.namaBarang || "Item";
                    const quantity = detail.jumlah || 0;
                    const price = detail.hargaSatuan || 0;
                    const subtotal = detail.subtotal || price * quantity;

                    return (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-900">
                          {itemName} x {quantity}
                        </span>
                        <span className="text-gray-900 font-medium">
                          Rp {subtotal.toLocaleString("id-ID")}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>

              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-lg font-bold text-gray-900">
                  Total Pembayaran
                </span>
                <span className="text-lg font-bold text-teal-700">
                  Rp{" "}
                  {(
                    transactionResult.transaction.totalHarga || 0
                  ).toLocaleString("id-ID")}
                </span>
              </div>

              <div className="text-sm text-gray-900 pt-2">
                <p>
                  Tanggal:{" "}
                  {transactionResult.transaction.tanggal
                    ? new Date(
                        transactionResult.transaction.tanggal
                      ).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "N/A"}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={closeModal}
              className="flex-1 bg-teal-700 text-white py-3 px-4 rounded-lg hover:bg-teal-800 font-medium transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={() => {
                window.print();
              }}
              className="flex-1 bg-gray-200 text-gray-900 py-3 px-4 rounded-lg hover:bg-gray-300 font-medium transition-colors"
            >
              Cetak Struk
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
