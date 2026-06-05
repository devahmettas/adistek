import { ReactNode } from 'react'

interface CardProps {
  title: string
  children: ReactNode
}

export default function Card({ title, children }: CardProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-800">{title}</h2>
      {children}
    </section>
  )
}
