import { ClientSecurityShield } from "@/components/ClientSecurityShield";
import type { Metadata } from 'next'
import { Inter, Outfit, Cairo } from 'next/font/google'
import './globals.css'
import { getLocale } from '@/dictionaries'
import { RegisterServiceWorker } from '@/components/RegisterServiceWorker'

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] })
const outfit = Outfit({ variable: '--font-outfit', subsets: ['latin'] })
const cairo = Cairo({ variable: '--font-cairo', subsets: ['arabic', 'latin'] })

export const metadata: Metadata = {
  title: 'D-Ferme — Gestion Agro-Pastorale Intégrée',
  description: 'Logiciel tout-en-un pour exploitations agro-pastorales : élevage avicole, bovin, ovin, caprin, porcin et productions végétales avec mode hors-ligne.',
  manifest: '/manifest.json'
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const isRtl = locale === 'ar'

  return (
    <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'} suppressHydrationWarning className={`${inter.variable} ${outfit.variable} ${cairo.variable} h-full antialiased`}>
      <body className="antialiased min-h-screen bg-background text-foreground font-sans">
        <ClientSecurityShield />
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  )
}
