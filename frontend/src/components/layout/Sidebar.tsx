"use client";
import { Layout, Menu } from "antd";
import {
  DashboardOutlined, TeamOutlined, FileTextOutlined,
  RobotOutlined, BarChartOutlined, CalendarOutlined, SettingOutlined,
} from "@ant-design/icons";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";

const { Sider } = Layout;

export default function Sidebar() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();

  const menuItems = [
    { key: "/dashboard", icon: <DashboardOutlined />, label: t("menu.dashboard") },
    { key: "/patients", icon: <TeamOutlined />, label: t("menu.patients") },
    { key: "/diagnoses", icon: <FileTextOutlined />, label: t("menu.diagnoses") },
    ...(user?.role !== "nurse" ? [{ key: "/ai-analysis", icon: <RobotOutlined />, label: t("menu.aiAnalysis") }] : []),
    { key: "/reports", icon: <BarChartOutlined />, label: t("menu.reports") },
    { key: "/appointments", icon: <CalendarOutlined />, label: t("menu.appointments") },
    ...(user?.role === "admin" ? [{ key: "/admin", icon: <SettingOutlined />, label: t("menu.admin") }] : []),
  ];

  const selectedKey = "/" + pathname.split("/")[1];

  return (
    <Sider width={240} theme="dark" style={{ position: "fixed", height: "100vh", left: 0, top: 0, zIndex: 100 }}>
      <div className="flex flex-col items-center py-6 px-4 border-b border-white/10">
        <div className="text-white font-bold text-base leading-tight text-center">
          🔬 {t("app.title")}
        </div>
        <div className="text-gray-400 text-xs mt-1 text-center">{t("app.subtitle")}</div>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={({ key }) => router.push(key)}
        style={{ marginTop: 8, border: "none" }}
      />
    </Sider>
  );
}
