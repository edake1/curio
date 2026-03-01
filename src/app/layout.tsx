import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Curio — Thought-Provoking Mini-Apps",
  description: "A collection of 10 interactive micro-experiences designed to spark curiosity, debate, and self-reflection.",
  keywords: ["curiosity", "mini-apps", "moral dilemma", "life stats", "interactive", "viral", "thought experiment"],
  authors: [{ name: "Curio" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Curio",
    description: "10 thought-provoking mini-apps. Spark curiosity, debate, and self-reflection.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Curio",
    description: "10 thought-provoking mini-apps. Spark curiosity, debate, and self-reflection.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark" data-theme="midnight">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased transition-colors duration-300`}
        style={{ backgroundColor: 'var(--curio-bg)', color: 'var(--curio-text)' }}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
