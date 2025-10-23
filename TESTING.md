# 🎯 TESTING GUIDE - Cafetaria Management System

## Prerequisites
- MySQL running di Laragon (port 3306)
- Database `cafetaria_db` sudah dibuat dan seeded
- Development server running di http://localhost:3000

## 🧪 Test Flow

### 1. Test Login & Role Access

#### a) Login sebagai PENGURUS
```
URL: http://localhost:3000/login
Email: pengurus@test.com
Password: password123
```

**Verifikasi:**
- ✅ Redirect ke `/dashboard/pengurus`
- ✅ Lihat tab "Pending Approval" dengan item status PENDING
- ✅ Lihat tab "Semua Stok" dengan semua item
- ✅ Lihat tab "Laporan Transaksi"
- ✅ Button "Setuju" dan "Tolak" untuk approve/reject items
- ✅ Button "Hapus" untuk delete items

**Actions to test:**
1. Approve item pending → Status berubah jadi TERSEDIA
2. Reject item pending → Status berubah jadi DITOLAK
3. Delete item dari tab "Semua Stok"

---

#### b) Login sebagai MITRA
```
Email: mitra@test.com
Password: password123
```

**Verifikasi:**
- ✅ Redirect ke `/dashboard/mitra`
- ✅ Button "+ Setor Barang Baru"
- ✅ Lihat daftar barang milik mitra dengan status

**Actions to test:**
1. Klik "+ Setor Barang Baru"
2. Isi form:
   - Nama Barang: "Soto Ayam"
   - Jumlah Stok: 15
   - Harga: 18000
   - Upload foto (JPG/PNG, max 5MB)
3. Submit → Item baru muncul dengan status PENDING
4. Logout dan login sebagai PENGURUS
5. Approve item baru dari mitra
6. Login kembali sebagai MITRA
7. Verifikasi item sudah status TERSEDIA

---

#### c) Login sebagai KASIR
```
Email: kasir@test.com
Password: password123
```

**Verifikasi:**
- ✅ Redirect ke `/dashboard/kasir`
- ✅ Lihat daftar menu di kiri
- ✅ Keranjang di kanan
- ✅ Hanya item dengan status TERSEDIA yang muncul

**Actions to test:**
1. Klik "+ Tambah" pada beberapa item
2. Verifikasi item masuk ke keranjang
3. Ubah quantity dengan button +/-
4. Verifikasi total harga otomatis update
5. Klik "Proses Transaksi"
6. Verifikasi:
   - ✅ Alert sukses
   - ✅ Keranjang kosong
   - ✅ Stok item berkurang
   - ✅ Jika stok = 0, status berubah HABIS
7. Login sebagai PENGURUS
8. Check tab "Laporan Transaksi"
9. Verifikasi transaksi muncul dengan detail items

---

#### d) Login sebagai USER
```
Email: user@test.com
Password: password123
```

**Verifikasi:**
- ✅ Redirect ke `/menu`
- ✅ Lihat daftar menu dengan foto dan harga
- ✅ Hanya item TERSEDIA yang ditampilkan
- ✅ View-only (tidak ada button transaksi)

---

### 2. Test API Endpoints dengan Postman/Thunder Client

#### Setup
1. Login dulu untuk mendapatkan session cookie
2. Atau gunakan NextAuth token

#### Test Items API

**GET /api/items**
```http
GET http://localhost:3000/api/items
Cookie: next-auth.session-token=...
```
Expected: List semua items (filtered by role)

**GET /api/items?status=TERSEDIA**
```http
GET http://localhost:3000/api/items?status=TERSEDIA
```
Expected: Only TERSEDIA items

**POST /api/items** (Login sebagai MITRA)
```http
POST http://localhost:3000/api/items
Content-Type: application/json

{
  "namaBarang": "Es Jeruk",
  "fotoUrl": "/uploads/placeholder.jpg",
  "jumlahStok": 25,
  "hargaSatuan": 6000
}
```
Expected: Item created dengan status PENDING

**PATCH /api/items/:id** (Login sebagai PENGURUS)
```http
PATCH http://localhost:3000/api/items/1
Content-Type: application/json

{
  "status": "TERSEDIA",
  "jumlahStok": 30
}
```

**POST /api/items/:id/approve** (Login sebagai PENGURUS)
```http
POST http://localhost:3000/api/items/4/approve
```
Expected: Status → TERSEDIA

**DELETE /api/items/:id** (Login sebagai PENGURUS)
```http
DELETE http://localhost:3000/api/items/1
```

#### Test Transactions API

**GET /api/transactions** (Login sebagai KASIR/PENGURUS)
```http
GET http://localhost:3000/api/transactions
```

**POST /api/transactions** (Login sebagai KASIR)
```http
POST http://localhost:3000/api/transactions
Content-Type: application/json

{
  "items": [
    { "itemId": 1, "quantity": 2 },
    { "itemId": 2, "quantity": 1 }
  ]
}
```
Expected: 
- Transaction created
- Stok items auto-reduce
- Total calculated automatically

#### Test Upload API

**POST /api/upload** (Login sebagai MITRA)
```http
POST http://localhost:3000/api/upload
Content-Type: multipart/form-data

file: [select image file]
```
Expected: Returns { url: "/uploads/filename.jpg" }

---

### 3. Test Edge Cases

#### a) Stok Insufficient
1. Login sebagai KASIR
2. Tambah item dengan quantity > stok available
3. Verifikasi: Error message "Insufficient stock"

#### b) Item Not Available
1. Set item status ke HABIS atau DITOLAK
2. Login sebagai KASIR
3. Verifikasi: Item tidak muncul di daftar

#### c) Role Protection
1. Login sebagai USER
2. Try akses `/dashboard/kasir` di URL
3. Verifikasi: Redirect ke `/unauthorized`

#### d) Upload Invalid File
1. Login sebagai MITRA
2. Try upload file > 5MB atau non-image
3. Verifikasi: Error message

#### e) Concurrent Transactions
1. Buka 2 browser (e.g., Chrome & Edge)
2. Login sebagai KASIR di kedua browser
3. Coba buat transaksi sama item di kedua browser bersamaan
4. Verifikasi: Salah satu gagal jika stok tidak cukup

---

### 4. Test Middleware & Auth

#### a) Unauthenticated Access
1. Clear cookies/logout
2. Try akses `/dashboard/kasir`
3. Verifikasi: Redirect ke `/login?callbackUrl=/dashboard/kasir`
4. Login → Redirect kembali ke `/dashboard/kasir`

#### b) Wrong Role Access
1. Login sebagai MITRA
2. Try akses `/dashboard/pengurus`
3. Verifikasi: Redirect ke `/unauthorized`

---

### 5. Test Database dengan Prisma Studio

```bash
npx prisma studio
```

1. Open browser: http://localhost:5555
2. Explore semua table:
   - User
   - Item
   - Transaction
   - TransactionDetail
3. Verifikasi:
   - Foreign keys relationship
   - Cascade delete (delete transaction → details terhapus)
   - On delete set null (delete user → item.mitraId = null)

---

## 📊 Test Checklist

- [ ] Login untuk semua 4 roles berhasil
- [ ] Pengurus bisa approve/reject items
- [ ] Mitra bisa setor barang baru
- [ ] Kasir bisa buat transaksi
- [ ] Stok otomatis berkurang setelah transaksi
- [ ] Status item berubah HABIS ketika stok = 0
- [ ] User hanya bisa view menu
- [ ] Middleware protect routes sesuai role
- [ ] Upload foto berhasil
- [ ] API endpoints return correct data
- [ ] Error handling untuk edge cases
- [ ] Database relationships bekerja dengan benar

---

## 🐛 Known Issues & Limitations

1. **Placeholder Image**: Butuh replace dengan real image atau download dari internet
2. **No Email Notification**: Belum ada notifikasi email untuk approval
3. **No Audit Log**: Belum ada tracking siapa yang edit/delete
4. **Basic UI**: UI masih sederhana, bisa dipercantik
5. **No Pagination**: Untuk data banyak, perlu pagination

---

## 🚀 Next Features to Implement

1. **Real-time Updates**: Socket.io untuk live notification
2. **Export Reports**: Export laporan ke PDF/Excel
3. **Advanced Filters**: Filter by date range, mitra, dll
4. **Dashboard Analytics**: Chart & statistics
5. **User Management**: Register, reset password, edit profile
6. **Image Optimization**: Compress & resize images
7. **Search & Sort**: Search items, sort by price/name
8. **Order History**: User bisa lihat history order
9. **Cart Persistence**: Save cart to database
10. **Multi-language Support**: i18n untuk Bahasa & English

---

## ✅ Success Criteria

Aplikasi dianggap sukses jika:
- ✅ Semua 4 roles bisa login dan akses dashboard masing-masing
- ✅ Flow setor barang → approval → transaksi berjalan lancar
- ✅ Stok management akurat dan real-time
- ✅ No critical bugs atau security issues
- ✅ Response time < 2 detik untuk semua actions
- ✅ UI responsive di mobile & desktop

---

**Happy Testing! 🎉**
