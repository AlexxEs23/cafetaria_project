'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import LoadingModal from './LoadingModal'

export default function NavigationLoader() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const prevPathnameRef = useRef(pathname)
  const isInitialMount = useRef(true)

  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false
      prevPathnameRef.current = pathname
      return
    }

    // Show loading only when pathname actually changes
    if (pathname !== prevPathnameRef.current) {
      setLoading(true)
      prevPathnameRef.current = pathname
      
      // Hide loading after a short delay
      const timer = setTimeout(() => {
        setLoading(false)
      }, 200)

      return () => {
        clearTimeout(timer)
        setLoading(false)
      }
    }
  }, [pathname])

  return <LoadingModal isOpen={loading} message="Memuat Halaman" />
}
