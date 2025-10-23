# ☕ Cafetaria Management System

Sistem manajemen cafetaria fullstack dengan Next.js, TypeScript, Prisma, dan NextAuth. Aplikasi ini mendukung multi-role (Pengurus, Kasir, Mitra, User) dengan fitur manajemen stok, transaksi, dan approval system.

## 🎯 Fitur Utama

### 🔐 Multi-Role Authentication
- **Pengurus**: Kelola stok, approve/reject barang mitra, lihat laporan
- **Kasir**: Buat transaksi dengan auto-reduce stok
- **Mitra**: Setor barang baru dengan upload foto
- **User**: View menu tersedia

### 📦 Manajemen Stok
- CRUD barang (Create, Read, Update, Delete)
- Approval system untuk barang dari mitra (PENDING → TERSEDIA/DITOLAK)
- Auto-update status menjadi HABIS ketika stok = 0
- Upload foto barang ke local storage

### 💰 Sistem Transaksi
- Kasir dapat membuat transaksi dengan keranjang
- Auto-calculate total harga
- Stok otomatis berkurang setelah transaksi
- Laporan transaksi lengkap dengan detail items

### 🛡️ Security & Middleware
- Route protection berdasarkan role
- Password hashing dengan bcrypt
- JWT-based authentication

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: MySQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5 (Beta)
- **Styling**: TailwindCSS
- **File Upload**: Local Storage (public/uploads)

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- MySQL (via Laragon atau standalone)
- npm/yarn/pnpm

### 1. Clone & Install

```bash
git clone <repo-url>
cd cafetaria_project
npm install
```

### 2. Environment Variables

File `.env` sudah tersedia. Pastikan konfigurasi sesuai:

```env
# Database Connection (MySQL via Laragon)
DATABASE_URL="mysql://root:@localhost:3306/cafetaria_db"

# NextAuth Configuration
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Database Setup

Pastikan MySQL running di Laragon, kemudian:

```bash
# Push database schema ke MySQL
npx prisma db push

# Seed database dengan data demo
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di: **http://localhost:3000**

## 👥 Demo Accounts

Setelah seeding, gunakan akun berikut untuk testing:

| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| **Pengurus** | pengurus@test.com | password123 | `/dashboard/pengurus` |
| **Kasir** | kasir@test.com | password123 | `/dashboard/kasir` |
| **Mitra** | mitra@test.com | password123 | `/dashboard/mitra` |
| **User** | user@test.com | password123 | `/menu` |

## 📂 Struktur Project

```
cafetaria_project/
├── prisma/
│   ├── schema.prisma          # Database schema (User, Item, Transaction)
│   └── seed.ts                # Seed data untuk testing
├── public/
│   └── uploads/               # Folder untuk uploaded images
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/  # NextAuth API routes
│   │   │   ├── items/               # Items CRUD API
│   │   │   │   ├── route.ts         # GET all, POST create
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts     # GET, PATCH, DELETE
│   │   │   │       ├── approve/     # POST approve (Pengurus)
│   │   │   │       └── reject/      # POST reject (Pengurus)
│   │   │   ├── transactions/        # Transactions API
│   │   │   │   ├── route.ts         # GET all, POST create
│   │   │   │   └── [id]/route.ts    # GET single
│   │   │   └── upload/              # POST upload image
│   │   ├── dashboard/
│   │   │   ├── pengurus/page.tsx    # Dashboard Pengurus
│   │   │   ├── kasir/page.tsx       # Dashboard Kasir
│   │   │   └── mitra/page.tsx       # Dashboard Mitra
│   │   ├── menu/page.tsx            # Menu page (User)
│   │   ├── login/page.tsx           # Login page
│   │   ├── unauthorized/page.tsx    # Unauthorized access
│   │   ├── layout.tsx               # Root layout dengan SessionProvider
│   │   └── page.tsx                 # Home (redirect to login)
│   ├── components/
│   │   └── SessionProvider.tsx      # Client-side SessionProvider
│   ├── lib/
│   │   └── prisma.ts                # Prisma Client singleton
│   ├── types/
│   │   ├── index.ts                 # Type definitions
│   │   └── next-auth.d.ts           # NextAuth type extensions
│   └── middleware.ts                # Route protection middleware
├── .env                             # Environment variables
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── README.md                        # This file
└── TESTING.md                       # Testing guide
```

## 🔐 Role & Permissions

### 1. Pengurus (Admin)
**Access:** `/dashboard/pengurus`

**Permissions:**
- ✅ Lihat semua stok barang (semua status)
- ✅ Approve barang dari mitra (PENDING → TERSEDIA)
- ✅ Reject barang dari mitra (PENDING → DITOLAK)
- ✅ Edit dan hapus semua barang
- ✅ Lihat laporan transaksi semua kasir
- ✅ Filter laporan by date range

**API Access:**
- `GET /api/items` (all items)
- `POST /api/items/:id/approve`
- `POST /api/items/:id/reject`
- `DELETE /api/items/:id`
- `GET /api/transactions` (all)

### 2. Kasir
**Access:** `/dashboard/kasir`

**Permissions:**
- ✅ Lihat daftar barang TERSEDIA
- ✅ Tambah items ke keranjang
- ✅ Buat transaksi (auto-reduce stok)
- ✅ Lihat riwayat transaksi sendiri

**API Access:**
- `GET /api/items?status=TERSEDIA`
- `POST /api/transactions`
- `GET /api/transactions?kasirId={id}`

### 3. Mitra
**Access:** `/dashboard/mitra`

**Permissions:**
- ✅ Setor barang baru (status awal: PENDING)
- ✅ Upload foto barang
- ✅ Lihat barang milik sendiri
- ✅ Edit barang milik sendiri
- ✅ Lihat status approval (Pending/Tersedia/Ditolak)

**API Access:**
- `POST /api/items`
- `POST /api/upload`
- `GET /api/items?mitraId={id}`
- `PATCH /api/items/:id` (own items only)

### 4. User
**Access:** `/menu`

**Permissions:**
- ✅ Lihat daftar menu TERSEDIA
- ✅ View-only (tidak ada transaksi)

**API Access:**
- `GET /api/items?status=TERSEDIA`

## 🔌 API Documentation

### Authentication

#### Login
```http
POST /api/auth/signin
Content-Type: application/json

{
  "email": "kasir@test.com",
  "password": "password123"
}
```

#### Logout
```http
POST /api/auth/signout
```

### Items API

#### Get All Items
```http
GET /api/items
Query Params:
  - status: ItemStatus (TERSEDIA|HABIS|PENDING|DITOLAK)
  - mitraId: number

Authorization: Required (cookie)
```

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "namaBarang": "Nasi Goreng",
      "fotoUrl": "/uploads/placeholder.jpg",
      "jumlahStok": 20,
      "hargaSatuan": 15000,
      "status": "TERSEDIA",
      "mitraId": 3,
      "mitra": {
        "id": 3,
        "name": "Mitra Supplier",
        "email": "mitra@test.com"
      },
      "createdAt": "2025-10-16T01:03:39.000Z"
    }
  ]
}
```

#### Create Item
```http
POST /api/items
Content-Type: application/json
Authorization: Required (MITRA or PENGURUS)

{
  "namaBarang": "Soto Ayam",
  "fotoUrl": "/uploads/soto.jpg",
  "jumlahStok": 15,
  "hargaSatuan": 18000
}
```

#### Update Item
```http
PATCH /api/items/:id
Content-Type: application/json
Authorization: Required (PENGURUS or MITRA-owner)

{
  "jumlahStok": 25,
  "hargaSatuan": 20000,
  "status": "TERSEDIA"
}
```

#### Delete Item
```http
DELETE /api/items/:id
Authorization: Required (PENGURUS only)
```

#### Approve Item
```http
POST /api/items/:id/approve
Authorization: Required (PENGURUS only)
```

#### Reject Item
```http
POST /api/items/:id/reject
Authorization: Required (PENGURUS only)
```

### Transactions API

#### Get All Transactions
```http
GET /api/transactions
Query Params:
  - startDate: ISO date
  - endDate: ISO date
  - kasirId: number

Authorization: Required (KASIR|PENGURUS)
```

**Response:**
```json
{
  "transactions": [
    {
      "id": 1,
      "kasirId": 2,
      "totalHarga": 42000,
      "createdAt": "2025-10-16T02:15:30.000Z",
      "kasir": {
        "id": 2,
        "name": "Kasir 1",
        "email": "kasir@test.com"
      },
      "details": [
        {
          "id": 1,
          "itemId": 1,
          "quantity": 2,
          "subtotal": 30000,
          "item": {
            "id": 1,
            "namaBarang": "Nasi Goreng",
            "hargaSatuan": 15000
          }
        }
      ]
    }
  ]
}
```

#### Create Transaction
```http
POST /api/transactions
Content-Type: application/json
Authorization: Required (KASIR only)

{
  "items": [
    { "itemId": 1, "quantity": 2 },
    { "itemId": 3, "quantity": 1 }
  ]
}
```

**Response:**
```json
{
  "transaction": { /* transaction object */ },
  "message": "Transaction created successfully"
}
```

**Error Cases:**
- Item not found
- Item not TERSEDIA
- Insufficient stock
- Invalid quantity

### Upload API

#### Upload Image
```http
POST /api/upload
Content-Type: multipart/form-data
Authorization: Required (MITRA|PENGURUS)

Body:
  file: [image file]
```

**Response:**
```json
{
  "url": "/uploads/1729042512345-abc123.jpg",
  "filename": "1729042512345-abc123.jpg",
  "message": "File uploaded successfully"
}
```

**Validation:**
- Max size: 5MB
- Allowed types: image/jpeg, image/png, image/webp

## 🗄️ Database Schema

### User Model
```prisma
model User {
  id            Int           @id @default(autoincrement())
  name          String
  email         String        @unique
  password      String        // Bcrypt hashed
  role          Role          @default(USER)
  items         Item[]        @relation("MitraItems")
  transactions  Transaction[]
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}

enum Role {
  USER
  KASIR
  PENGURUS
  MITRA
}
```

### Item Model
```prisma
model Item {
  id                  Int                 @id @default(autoincrement())
  namaBarang          String
  fotoUrl             String
  jumlahStok          Int
  hargaSatuan         Float
  status              ItemStatus          @default(PENDING)
  mitraId             Int?
  mitra               User?               @relation("MitraItems")
  transactionDetails  TransactionDetail[]
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt
}

enum ItemStatus {
  TERSEDIA
  HABIS
  MENUNGGU_KONFIRMASI
  DITOLAK
  PENDING
}
```

### Transaction Model
```prisma
model Transaction {
  id          Int                 @id @default(autoincrement())
  kasirId     Int
  kasir       User                @relation(...)
  totalHarga  Float
  createdAt   DateTime            @default(now())
  details     TransactionDetail[]
}

model TransactionDetail {
  id            Int         @id @default(autoincrement())
  transactionId Int
  itemId        Int
  quantity      Int
  subtotal      Float
  transaction   Transaction @relation(...)
  item          Item        @relation(...)
}
```

## 🚀 Scripts & Commands

### Development
```bash
npm run dev          # Start development server (Turbopack)
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

### Database
```bash
npx prisma studio           # Open Prisma Studio (DB GUI)
npx prisma db push          # Push schema changes to DB
npx prisma generate         # Generate Prisma Client
npm run db:seed             # Seed database dengan demo data
npx prisma db pull          # Pull schema from existing DB
npx prisma migrate dev      # Create migration (production)
```

### Testing
```bash
npm run dev                 # Start server
# Then manually test atau lihat TESTING.md
```

## 🧪 Testing

Lihat file **[TESTING.md](./TESTING.md)** untuk panduan testing lengkap:
- Test flow untuk setiap role
- API endpoint testing
- Edge cases & error handling
- Database validation

## 🔧 Configuration

### NextAuth Config
File: `src/app/api/auth/[...nextauth]/route.ts`

```typescript
export const authOptions: NextAuthConfig = {
  providers: [CredentialsProvider],
  callbacks: {
    jwt: // Add role to token
    session: // Add role to session
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
}
```

### Middleware
File: `src/middleware.ts`

Protected routes:
- `/dashboard/pengurus/*` → PENGURUS only
- `/dashboard/kasir/*` → KASIR only
- `/dashboard/mitra/*` → MITRA only
- `/menu` → All authenticated users

## 🐛 Troubleshooting

### Database Connection Error
```
Error: P1001: Can't reach database server
```
**Solution:**
- Pastikan MySQL running di Laragon
- Check port (default: 3306)
- Verify `DATABASE_URL` di `.env`

### NextAuth Session Error
```
Error: [next-auth][error][JWT_SESSION_ERROR]
```
**Solution:**
- Generate new `NEXTAUTH_SECRET`
- Restart development server
- Clear browser cookies

### Upload Error
```
Error: ENOENT: no such file or directory
```
**Solution:**
- Pastikan folder `public/uploads` exists
- Check write permissions

### Build Error
```
Module not found: Can't resolve '@/...'
```
**Solution:**
- Check `tsconfig.json` paths configuration
- Run `npm install` again

## 📈 Performance Tips

1. **Prisma Connection Pooling**
```typescript
// lib/prisma.ts already configured
// Uses singleton pattern for dev
```

2. **Image Optimization**
- Use Next.js `<Image>` component (already implemented)
- Consider adding image compression before upload

3. **Database Indexing**
- Schema already includes indexes on foreign keys
- Add more indexes if needed for specific queries

## 🔒 Security Considerations

### Current Implementation
- ✅ Password hashing dengan bcrypt
- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Middleware route protection
- ✅ File upload validation

### Recommendations for Production
- [ ] Add rate limiting untuk API endpoints
- [ ] Implement CSRF protection
- [ ] Use HTTPS in production
- [ ] Add input sanitization
- [ ] Implement audit logging
- [ ] Add email verification
- [ ] Use environment-specific secrets

## 📄 License

MIT License - Feel free to use for learning purposes

## 👨‍💻 Development

Built with ❤️ using:
- GitHub Copilot for AI-assisted coding
- Next.js for fullstack framework
- Prisma for type-safe database access
- NextAuth for authentication
- TailwindCSS for styling

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

## 📞 Support

Jika ada pertanyaan atau issue:
1. Check [TESTING.md](./TESTING.md) untuk troubleshooting
2. Review error logs di terminal
3. Check Prisma Studio untuk database issues
4. Open GitHub issue

---

**Happy Coding! ☕🚀**
