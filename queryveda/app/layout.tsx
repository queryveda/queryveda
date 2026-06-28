import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/components/auth/auth-provider";
import { AppShell } from "@/components/layout/app-shell";
import { ScrollToTop } from "@/components/layout/scroll-to-top";
import { PlatformTour } from "@/components/layout/platform-tour";
import { ProtectionWrapper } from "@/components/layout/protection-wrapper";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "QueryVeda — Master SQL by Doing",
  description: "Practice 75 PostgreSQL problems in your browser. No server needed.",
  icons: {
    icon: `${basePath}/favicon.png`,
    apple: `${basePath}/favicon.png`,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            <ProtectionWrapper />
            <AppShell>{children}</AppShell>
            <ScrollToTop />
            <PlatformTour />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
