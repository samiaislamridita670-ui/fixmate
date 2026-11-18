import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import PublicChrome from "@/components/PublicChrome";
import { ToastProvider } from "@/components/Toast";

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
    default: "FixMate | Smart Device & Home Appliance Repair",
    template: "%s | FixMate",
  },
  description:
    "FixMate connects households with verified technicians for smartphone, laptop and home appliance repairs — book online, track the job and pay securely after service.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white text-slate-900">
        <ToastProvider>
          <Navbar />
          <PublicChrome>{children}</PublicChrome>
        </ToastProvider>
      </body>
    </html>
  );
}
