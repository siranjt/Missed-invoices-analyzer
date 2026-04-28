import "./globals.css";
import type { Metadata } from "next";
import AuthProvider from "@/components/auth-provider";

export const metadata: Metadata = {
  title: "Missed Invoice Tracker",
  description: "Live view of unpaid Chargebee invoices for Zoca"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
