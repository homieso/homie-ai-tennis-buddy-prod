import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "AI网球搭子 - 你的专属网球学长",
  description: "你的专属网球学长，陪伴你的网球成长之旅",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 全局品牌标识 */}
        <header className="fixed top-0 left-0 right-0 z-50 px-6 py-3 backdrop-blur-md bg-white/30 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🎾</div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">AI网球搭子</h1>
              <p className="text-xs text-gray-600">你的专属网球学长</p>
            </div>
          </div>
        </header>

        {/* 主要内容区域，为头部留出空间 */}
        <div className="pt-16">
          {children}
        </div>

        {/* 部署版本标识（用于调试） */}
        <div hidden data-deploy-version={process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'local'} />
      </body>
    </html>
  );
}
