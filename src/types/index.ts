import { Role, ItemStatus } from '@prisma/client'

export { Role, ItemStatus }

export interface User {
  id: number
  name: string
  email: string
  role: Role
  createdAt: Date
  updatedAt: Date
}

export interface Item {
  id: number
  namaBarang: string
  fotoUrl: string
  jumlahStok: number
  hargaSatuan: number
  status: ItemStatus
  mitraId: number | null
  createdAt: Date
  updatedAt: Date
}

export interface Transaction {
  id: number
  kasirId: number
  totalHarga: number
  createdAt: Date
  details?: TransactionDetail[]
}

export interface TransactionDetail {
  id: number
  transactionId: number
  itemId: number
  quantity: number
  subtotal: number
}

export interface CreateItemInput {
  namaBarang: string
  fotoUrl: string
  jumlahStok: number
  hargaSatuan: number
  mitraId?: number
}

export interface CreateTransactionInput {
  items: {
    itemId: number
    quantity: number
  }[]
}
