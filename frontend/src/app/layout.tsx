import type { Metadata } from "next";
import "./globals.css";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import Providers from "@/components/common/Providers";

export const metadata: Metadata = {
  title: "Dermatologik Tashxis Axborot Tizimi",
  description: "Teri kasalliklari diagnostikasi uchun axborot tizimi",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body className="m-0">
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
