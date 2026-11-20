import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "مسار AI | منصة التوجيه المهني الذكية بالوكلاء المتعددين",
  description: "منصة ويب ذكية قائمة على الوكلاء المتعددين (Multi-Agent AI System) لتحليل السير الذاتية وإعادة صياغتها والتحضير للمقابلات الشخصية.",
  keywords: ["Multi-Agent AI", "Career Coach", "ATS Resume", "Groq", "Llama 3.3", "AI Engineering"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased font-arabic selection:bg-teal-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
