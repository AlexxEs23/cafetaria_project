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
  const [previewUrl, setPreviewUrl] = useState<string>("");
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

  // Cleanup preview URL saat component unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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

  // Fungsi untuk resize gambar jika lebih dari 5MB
  const resizeImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = (event) => {
        const img = document.createElement("img");
        img.src = event.target?.result as string;

        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
          }

          // Hitung ukuran baru dengan menjaga aspect ratio
          let width = img.width;
          let height = img.height;
          const maxDimension = 1920; // Max width atau height

          if (width > height && width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }

          canvas.width = width;
          canvas.height = height;

          // Draw image dengan kualitas yang dikurangi
          ctx.drawImage(img, 0, 0, width, height);

          // Convert ke blob dengan quality 0.8
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Failed to create blob"));
                return;
              }

              // Buat File baru dari blob
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });

              resolve(resizedFile);
            },
            file.type,
            0.8 // Quality 80%
          );
        };

        img.onerror = () => {
          reject(new Error("Failed to load image"));
        };
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      let selectedFile = e.target.files[0];

      // Validasi tipe file
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!allowedTypes.includes(selectedFile.type)) {
        alert(
          "Tipe file tidak valid. Hanya JPEG, PNG, dan WebP yang diperbolehkan."
        );
        return;
      }

      // Cek ukuran file
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (selectedFile.size > maxSize) {
        alert("⚠️ File lebih dari 5MB, sedang di-resize otomatis...");
        try {
          selectedFile = await resizeImage(selectedFile);
          alert(
            `✅ File berhasil di-resize dari ${(
              e.target.files[0].size /
              1024 /
              1024
            ).toFixed(2)}MB menjadi ${(selectedFile.size / 1024 / 1024).toFixed(
              2
            )}MB`
          );
        } catch (error) {
          console.error("Error resizing image:", error);
          alert("❌ Gagal resize gambar. Silakan pilih file yang lebih kecil.");
          return;
        }
      }

      setFile(selectedFile);

      // Buat preview URL
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setUploading(true);

    try {
      let fotoUrl = editingItem?.fotoUrl || "";

      // Upload foto baru jika ada
      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
          const errorMsg =
            uploadData.error || uploadData.details || "Gagal upload foto";
          alert(`❌ Upload Foto Gagal\n\n${errorMsg}`);
          setUploading(false);
          return;
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
        const errorMsg =
          itemData.error ||
          itemData.message ||
          (editingItem ? "Gagal mengupdate item" : "Gagal membuat item");
        alert(
          `❌ ${editingItem ? "Update" : "Setor"} Barang Gagal\n\n${errorMsg}`
        );
        setUploading(false);
        return;
      }

      alert(
        editingItem
          ? "✅ Barang berhasil diupdate!"
          : "✅ Barang berhasil disetor! Menunggu persetujuan pengurus."
      );

      // Reset form
      setNamaBarang("");
      setJumlahStok("");
      setHargaSatuan("");
      setFile(null);
      setPreviewUrl("");
      setShowForm(false);
      setEditingItem(null);

      // Refresh list
      fetchItems();
    } catch (error) {
      console.error("Error submitting item:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan yang tidak diketahui";
      alert(`❌ Terjadi Kesalahan\n\n${errorMessage}\n\nSilakan coba lagi.`);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setNamaBarang(item.namaBarang);
    setJumlahStok(item.jumlahStok.toString());
    setHargaSatuan(item.hargaSatuan.toString());
    setFile(null);
    setPreviewUrl(""); // Clear preview, akan tampilkan foto existing
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
    setPreviewUrl("");
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
                  Format: JPEG, PNG, WebP (Max: 5MB, akan di-resize otomatis
                  jika lebih besar)
                </p>

                {/* Preview Gambar */}
                {previewUrl && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Preview:
                    </p>
                    <div className="relative w-full h-48 border-2 border-gray-300 rounded-lg overflow-hidden">
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    {file && (
                      <p className="text-xs text-gray-600 mt-2">
                        File: {file.name} (
                        {(file.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                )}

                {/* Foto existing saat edit */}
                {editingItem && !previewUrl && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Foto saat ini:
                    </p>
                    <div className="relative w-full h-48 border-2 border-gray-300 rounded-lg overflow-hidden">
                      <Image
                        src={editingItem.fotoUrl}
                        alt={editingItem.namaBarang}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      {editingItem.fotoUrl.split("/").pop()}
                    </p>
                  </div>
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
