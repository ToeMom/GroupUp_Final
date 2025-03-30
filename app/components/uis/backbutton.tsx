"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface BackButtonProps {
  urlstring: string
}

export default function BackButton({ urlstring }: BackButtonProps) {
  return (
    <Link
      href={urlstring}
      aria-label="Go back to previous page"
      className="rounded-full p-2 sm:p-3 bg-primary/10 hover:bg-primary/20 transition-colors fixed top-4 left-4 sm:top-20 sm:left-8 md:left-28 z-10"
    >
      <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
    </Link>
  )
}

