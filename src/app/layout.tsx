import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SearchProvider } from "@/lib/SearchContext";
import { CartProvider } from "@/lib/CartContext";
import CartSidebar from "@/components/CartSidebar";
import CartSyncIndicator from "@/components/CartSyncIndicator";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Fighter District - El Mejor Equipo de Combate en Costa Rica",
    template: "%s | Fighter District"
  },
  description: "Cada producto que ofrecemos está pensado para acompañarte en tu evolución como atleta. Encuentra el mejor equipo de combate, artes marciales y fitness en Costa Rica.",
  keywords: [
    "equipo de combate",
    "artes marciales",
    "fitness",
    "Costa Rica",
    "muay thai",
    "boxing",
    "MMA",
    "kickboxing",
    "equipamiento deportivo",
    "guantes de boxeo",
    "protectores",
    "supplements",
    "fighter district"
  ],
  authors: [{ name: "Fighter District Team" }],
  creator: "Fighter District",
  publisher: "Fighter District",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://fighterdistrict.com'),
  alternates: {
    canonical: '/',
    languages: {
      'es-CR': '/es-cr',
      'es': '/es',
    },
  },
  openGraph: {
    title: "Fighter District - El Mejor Equipo de Combate en Costa Rica",
    description: "Cada producto que ofrecemos está pensado para acompañarte en tu evolución como atleta. Encuentra el mejor equipo de combate, artes marciales y fitness en Costa Rica.",
    url: 'https://fighterdistrict.com',
    siteName: 'Fighter District',
    locale: 'es_CR',
    type: 'website',
    images: [
      {
        url: './favicon.ico',
        width: 1200,
        height: 630,
        alt: 'Fighter District - Equipo de Combate y Artes Marciales',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Fighter District - El Mejor Equipo de Combate en Costa Rica",
    description: "Cada producto que ofrecemos está pensado para acompañarte en tu evolución como atleta.",
    images: ['./favicon.ico'],
    creator: '@fighterdistrict',
    site: '@fighterdistrict',
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code',
    yandex: 'yandex-verification-code',
    yahoo: 'yahoo-site-verification-code',
  },
  category: 'Sports & Fitness',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Urbanist:ital,wght@0,100..900;1,100..900&display=swap" 
          rel="stylesheet" 
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#EC1D25" />
        <meta name="msapplication-TileColor" content="#EC1D25" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        
        {/* ONVO Pay SDK */}
        <script src="https://sdk.onvopay.com/sdk.js" defer></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-urbanist`}
      >
        <SearchProvider>
          <CartProvider>
            {children}
            <CartSidebar />
            <CartSyncIndicator />
          </CartProvider>
        </SearchProvider>
      </body>
    </html>
  );
}
