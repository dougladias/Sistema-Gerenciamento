"use client"

import { Inter } from 'next/font/google'
import '../app/globals.css'
import ChatWebSocket from '@/components/layout/ChatWebSocket'
import { AuthProvider } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import SideNav from '@/components/ui/SideNav';


const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  
  // Verifica se é uma rota pública
  const isPublicRoute = ['/login', '/register', '/'].some(
    route => pathname === route || pathname.startsWith(route + '?')
  );

  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          <div id="root">
            {!isPublicRoute && <SideNav />}
            {<ChatWebSocket />}
            <main>
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}