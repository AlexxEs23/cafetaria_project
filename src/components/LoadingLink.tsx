'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MouseEvent, ReactNode } from 'react'

interface LoadingLinkProps {
  href: string
  children: ReactNode
  className?: string
  onClick?: () => void
}

export default function LoadingLink({ href, children, className, onClick }: LoadingLinkProps) {
  const router = useRouter()

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    
    if (onClick) {
      onClick()
    }

    // Navigate using router to trigger loading
    router.push(href)
  }

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  )
}
