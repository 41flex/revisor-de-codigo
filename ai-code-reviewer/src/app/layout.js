import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'AI Code Reviewer | Feedback Inteligente',
  description: 'Receba feedbacks instantâneos sobre seu código usando Inteligência Artificial de ponta.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
