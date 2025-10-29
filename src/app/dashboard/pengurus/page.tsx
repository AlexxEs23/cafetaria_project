"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Item {
  id: number;
  namaBarang: string;
  fotoUrl: string;
  jumlahStok: number;
  hargaSatuan: number;
  status: string;
  mitra?: {
    id: number;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface Transaction {
  id: number;
  userId: number;
  totalHarga: number;
  createdAt: string;
  user: {
    name: string;
    role: string;
  };
  details: Array<{
    jumlah: number;
    subtotal: number;
    item: {
      namaBarang: string;
    };
  }>;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function PengurusDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "items" | "pending" | "transactions" | "users"
  >("pending");
  const [userRole, setUserRole] = useState<"MITRA" | "KASIR" | "USER" | "ALL">(
    "ALL"
  );
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "MITRA",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === "transactions") {
          const res = await fetch("/api/transactions");
          const data = await res.json();
          setTransactions(data.transactions || []);
        } else if (activeTab === "users") {
          const roleParam = userRole !== "ALL" ? `?role=${userRole}` : "";
          const res = await fetch(`/api/users${roleParam}`);
          const data = await res.json();
          setUsers(data.users || []);
        } else {
          const status = activeTab === "pending" ? "PENDING" : "";
          const res = await fetch(
            `/api/items${status ? `?status=${status}` : ""}`
          );
          const data = await res.json();
          setItems(data.items || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, userRole]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "transactions") {
        const res = await fetch("/api/transactions");
        const data = await res.json();
        setTransactions(data.transactions || []);
      } else if (activeTab === "users") {
        const roleParam = userRole !== "ALL" ? `?role=${userRole}` : "";
        const res = await fetch(`/api/users${roleParam}`);
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        const status = activeTab === "pending" ? "PENDING" : "";
        const res = await fetch(
          `/api/items${status ? `?status=${status}` : ""}`
        );
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (itemId: number) => {
    try {
      const res = await fetch(`/api/items/${itemId}/approve`, {
        method: "POST",
      });
      if (res.ok) {
        fetchData();
        alert("Item disetujui!");
      }
    } catch (error) {
      console.error("Error approving item:", error);
    }
  };

  const handleReject = async (itemId: number) => {
    try {
      const res = await fetch(`/api/items/${itemId}/reject`, {
        method: "POST",
      });
      if (res.ok) {
        fetchData();
        alert("Item ditolak!");
      }
    } catch (error) {
      console.error("Error rejecting item:", error);
    }
  };

  const handleDelete = async (itemId: number) => {
    if (!confirm("Yakin ingin menghapus item ini?")) return;

    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchData();
        alert("Item dihapus!");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        alert("User berhasil dibuat!");
        setShowUserForm(false);
        setFormData({ name: "", email: "", password: "", role: "MITRA" });
        fetchData();
      } else {
        alert(data.error || "Gagal membuat user");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Error creating user");
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        alert("User berhasil diupdate!");
        setShowUserForm(false);
        setEditingUser(null);
        setFormData({ name: "", email: "", password: "", role: "MITRA" });
        fetchData();
      } else {
        alert(data.error || "Gagal update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Error updating user");
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Yakin ingin menghapus user ini?")) return;

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert("User berhasil dihapus!");
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menghapus user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Error deleting user");
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setShowUserForm(true);
  };

  const handleCancelForm = () => {
    setShowUserForm(false);
    setEditingUser(null);
    setFormData({ name: "", email: "", password: "", role: "MITRA" });
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
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3">
            {/* Title Section */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                  Dashboard Pengurus
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  Selamat datang, {session?.user?.name}
                </p>
              </div>
            </div>

            {/* Buttons Section */}
            <div className="flex gap-2 flex-wrap">
              <a
                href="/dashboard/pengurus/laporan"
                className="flex items-center justify-center gap-1 px-3 py-2 text-xs sm:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors whitespace-nowrap"
              >
                📊 <span className="hidden sm:inline">Laporan Penjualan</span>
                <span className="sm:hidden">Laporan</span>
              </a>
              <a
                href="/dashboard/pengurus/settings"
                className="flex items-center justify-center gap-1 px-3 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors whitespace-nowrap"
              >
                ⚙️ Pengaturan
              </a>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center justify-center gap-1 px-3 py-2 text-xs sm:text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors whitespace-nowrap"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("pending")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "pending"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Pending Approval
            </button>
            <button
              onClick={() => setActiveTab("items")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "items"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Semua Stok
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "transactions"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Laporan Transaksi
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "users"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Kelola Users
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "users" ? (
          <div className="space-y-6">
            {/* Header with Add Button and Filter */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Kelola Akun Users
                </h2>
                <select
                  value={userRole}
                  onChange={(e) =>
                    setUserRole(
                      e.target.value as "MITRA" | "KASIR" | "USER" | "ALL"
                    )
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Semua Role</option>
                  <option value="MITRA">Mitra</option>
                  <option value="KASIR">Kasir</option>
                  <option value="USER">User</option>
                </select>
              </div>
              <button
                onClick={() => setShowUserForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                + Tambah User Baru
              </button>
            </div>

            {/* User Form Modal */}
            {showUserForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {editingUser ? "Edit User" : "Tambah User Baru"}
                  </h3>
                  <form
                    onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nama
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password{" "}
                        {editingUser && "(kosongkan jika tidak ingin mengubah)"}
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required={!editingUser}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) =>
                          setFormData({ ...formData, role: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="MITRA">Mitra</option>
                        <option value="KASIR">Kasir</option>
                        <option value="USER">User</option>
                        <option value="PENGURUS">Pengurus</option>
                      </select>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium"
                      >
                        {editingUser ? "Update" : "Buat Akun"}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelForm}
                        className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 font-medium"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Nama
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Bergabung
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        {userRole === "ALL"
                          ? "Belum ada user terdaftar"
                          : `Belum ada ${userRole} terdaftar`}
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          #{user.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === "MITRA"
                                ? "bg-purple-100 text-purple-800"
                                : user.role === "KASIR"
                                ? "bg-green-100 text-green-800"
                                : user.role === "PENGURUS"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString("id-ID")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-blue-600 hover:text-blue-800 font-medium mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === "transactions" ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Kasir
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Items
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      #{transaction.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.user.name} ({transaction.user.role})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Rp {transaction.totalHarga.toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.createdAt).toLocaleDateString(
                        "id-ID"
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {transaction.details.map((d, i) => (
                        <div key={i}>
                          {d.item.namaBarang} x{d.jumlah}
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="relative h-48">
                  <Image
                    src={item.fotoUrl}
                    alt={item.namaBarang}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {item.namaBarang}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600 mb-4">
                    <p>Stok: {item.jumlahStok}</p>
                    <p>Harga: Rp {item.hargaSatuan.toLocaleString("id-ID")}</p>
                    <p>
                      Status:{" "}
                      <span
                        className={`font-semibold ${
                          item.status === "PENDING"
                            ? "text-yellow-600"
                            : item.status === "TERSEDIA"
                            ? "text-green-600"
                            : item.status === "DITOLAK"
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        {item.status}
                      </span>
                    </p>
                    {item.mitra && <p>Mitra: {item.mitra.name}</p>}
                  </div>

                  {item.status === "PENDING" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(item.id)}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 text-sm"
                      >
                        Setuju
                      </button>
                      <button
                        onClick={() => handleReject(item.id)}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 text-sm"
                      >
                        Tolak
                      </button>
                    </div>
                  )}

                  {activeTab === "items" && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 text-sm mt-2"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
