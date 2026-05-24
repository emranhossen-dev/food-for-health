import type { Metadata } from "next";
import { Inter, Hind_Siliguri } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import LoadingBar from "@/components/layout/LoadingBar";
import { CartProvider } from "@/contexts/CartContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  subsets: ["bengali"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Food for Health - Organic Food & Grocery Store",
  description: "Premium organic food, fresh vegetables, fruits, dairy products, tea, and healthy groceries for your wellbeing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${hindSiliguri.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <CartProvider>
          <LoadingBar />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'var(--color-primary)',
                color: 'var(--color-primary-foreground)',
              },
              success: {
                style: {
                  background: 'var(--color-primary)',
                  color: 'var(--color-primary-foreground)',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                  color: 'white',
                },
              },
            }}
          />
        </CartProvider>
      </body>
    </html>
  );
}
