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
  createdAt: string;
}

export default function MitraDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [namaBarang, setNamaBarang] = useState("");
  const [jumlahStok, setJumlahStok] = useState("");
  const [hargaSatuan, setHargaSatuan] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/items");
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setUploading(true);

    try {
      let fotoUrl = editingItem?.fotoUrl || "";

      // Upload foto baru jika ada
      if (file) {
        // Validasi file sebelum upload
        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
        ];
        if (!allowedTypes.includes(file.type)) {
          alert(
            "Tipe file tidak valid. Hanya JPEG, PNG, dan WebP yang diperbolehkan."
          );
          setUploading(false);
          return;
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          alert("Ukuran file terlalu besar. Maksimal 5MB.");
          setUploading(false);
          return;
        }

        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "Gagal upload foto");
        }

        fotoUrl = uploadData.url;
      } else if (!editingItem) {
        alert("Silakan pilih foto barang");
        setUploading(false);
        return;
      }

      // Create or Update item
      const url = editingItem ? `/api/items/${editingItem.id}` : "/api/items";
      const method = editingItem ? "PATCH" : "POST";

      const itemRes = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          namaBarang,
          fotoUrl,
          jumlahStok: parseInt(jumlahStok),
          hargaSatuan: parseFloat(hargaSatuan),
        }),
      });

      const itemData = await itemRes.json();

      if (!itemRes.ok) {
        throw new Error(
          itemData.error ||
            (editingItem ? "Gagal mengupdate item" : "Gagal membuat item")
        );
      }

      alert(
        editingItem
          ? "Barang berhasil diupdate!"
          : "Barang berhasil disetor! Menunggu persetujuan pengurus."
      );

      // Reset form
      setNamaBarang("");
      setJumlahStok("");
      setHargaSatuan("");
      setFile(null);
      setShowForm(false);
      setEditingItem(null);

      // Refresh list
      fetchItems();
    } catch (error) {
      console.error("Error submitting item:", error);
      alert("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setNamaBarang(item.namaBarang);
    setJumlahStok(item.jumlahStok.toString());
    setHargaSatuan(item.hargaSatuan.toString());
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus barang ini?")) {
      return;
    }

    try {
      const res = await fetch(`/api/items/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menghapus item");
      }

      alert("Barang berhasil dihapus!");
      fetchItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan. Silakan coba lagi."
      );
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setNamaBarang("");
    setJumlahStok("");
    setHargaSatuan("");
    setFile(null);
    setShowForm(false);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3">
            {/* Title Section */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                  Dashboard Mitra
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  Selamat datang, {session?.user?.name}
                </p>
              </div>
            </div>

            {/* Buttons Section */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => router.push("/dashboard/mitra/laporan")}
                className="flex items-center justify-center gap-1 px-3 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors whitespace-nowrap"
              >
                📊 Laporan
              </button>
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

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Item Button */}
        <div className="mb-6">
          <button
            onClick={() => {
              if (showForm && editingItem) {
                handleCancelEdit();
              } else {
                setShowForm(!showForm);
              }
            }}
            className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700"
          >
            {showForm ? "Tutup Form" : "+ Setor Barang Baru"}
          </button>
        </div>

        {/* Form Setor Barang */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">
              {editingItem ? "Edit Barang" : "Setor Barang Baru"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Nama Barang
                </label>
                <input
                  type="text"
                  value={namaBarang}
                  onChange={(e) => setNamaBarang(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: Nasi Goreng"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jumlah Stok
                  </label>
                  <input
                    type="number"
                    value={jumlahStok}
                    onChange={(e) => setJumlahStok(e.target.value)}
                    required
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Harga Satuan (Rp)
                  </label>
                  <input
                    type="number"
                    value={hargaSatuan}
                    onChange={(e) => setHargaSatuan(e.target.value)}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="15000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto Barang
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  required={!editingItem}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: JPEG, PNG, WebP (Max: 5MB)
                </p>
                {file && (
                  <p className="text-sm text-gray-600 mt-2">
                    File: {file.name}
                  </p>
                )}
                {editingItem && !file && (
                  <p className="text-sm text-gray-600 mt-2">
                    Foto saat ini: {editingItem.fotoUrl.split("/").pop()}
                  </p>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading
                    ? "Memproses..."
                    : editingItem
                    ? "Update Barang"
                    : "Setor Barang"}
                </button>
                {editingItem && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-6 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Daftar Barang Mitra */}
        <div>
          <h2 className="text-xl font-bold mb-4">Barang Saya</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.length === 0 ? (
              <p className="col-span-full text-center text-gray-500 py-8">
                Belum ada barang. Setor barang baru untuk memulai!
              </p>
            ) : (
              items.map((item) => (
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
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Stok: {item.jumlahStok}</p>
                      <p>
                        Harga: Rp {item.hargaSatuan.toLocaleString("id-ID")}
                      </p>
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
                              : item.status === "HABIS"
                              ? "text-gray-600"
                              : ""
                          }`}
                        >
                          {item.status}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Disetor:{" "}
                        {new Date(item.createdAt).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleEdit(item)}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 text-sm"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
