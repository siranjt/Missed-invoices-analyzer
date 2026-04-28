import "./globals.css";
import type { Metadata } from "next";
import { Montserrat, JetBrains_Mono } from "next/font/google";
import AuthProvider from "@/components/auth-provider";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
  display: "swap"
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Missed invoice tracker · Zoca",
  description: "Live view of unpaid Chargebee invoices for Zoca",
  icons: {
    icon: "https://cdn.prod.website-files.com/68137618ce08fc7361daa786/682d76ff41bf56335a5d136c_zoca-favicon.png",
    apple:
      "https://cdn.prod.website-files.com/68137618ce08fc7361daa786/682d77073e8b3f0d12d28a2a_zoca-favicon2.png"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${mono.variable}`}>
      <body className="bg-zoca-canvas text-zoca-text font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
