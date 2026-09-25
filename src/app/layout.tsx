import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
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
  title: "Clause",
  description:
    "Clause explains the legal documents in your life. It never gives legal advice.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <VisuallyHidden.Root asChild>
          <a
            href="#main-content"
            className="focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-black"
          >
            Skip to main content
          </a>
        </VisuallyHidden.Root>
        {children}
      </body>
    </html>
  );
}
