"use client";
import { Layout, Spin } from "antd";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const { Content } = Layout;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, _hydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, _hydrated, router]);

  // Hydration kutilmoqda — bo'sh oq ekran o'rniga spinner ko'rsat
  if (!_hydrated) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout style={{ marginLeft: 240 }}>
        <Header />
        <Content style={{ margin: "24px", minHeight: "calc(100vh - 112px)" }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
