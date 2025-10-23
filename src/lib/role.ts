import { Role } from '@prisma/client'

export const getRoleBasedRedirect = (role: Role | string): string => {
  switch (role) {
    case 'PENGURUS':
      return '/dashboard/pengurus'
    case 'KASIR':
      return '/dashboard/kasir'
    case 'MITRA':
      return '/dashboard/mitra'
    case 'USER':
      return '/menu'
    default:
      return '/menu'
  }
}

export const getRoleName = (role: Role | string): string => {
  switch (role) {
    case 'PENGURUS':
      return 'Pengurus'
    case 'KASIR':
      return 'Kasir'
    case 'MITRA':
      return 'Mitra'
    case 'USER':
      return 'User'
    default:
      return 'User'
  }
}
