import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session?.user) {
    const role = (session.user as { role: string }).role

    // Redirect based on role
    switch (role) {
      case 'PENGURUS':
        redirect('/dashboard/pengurus')
      case 'KASIR':
        redirect('/dashboard/kasir')
      case 'MITRA':
        redirect('/dashboard/mitra')
      case 'USER':
        redirect('/menu')
      default:
        redirect('/menu')
    }
  }

  // If not logged in, redirect to guest landing page
  redirect('/guest')
}
