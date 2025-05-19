import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../app/globals.css'
import SideNav from '@/components/ui/SideNav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Globoo RH',
  description: 'Sistema de Gestão de Recursos Humanos da Globoo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>        
      <SideNav />
          {children}        
      </body>
    </html>
  )
}