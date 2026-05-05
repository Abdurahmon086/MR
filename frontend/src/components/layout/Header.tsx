"use client";
import { Layout, Avatar, Dropdown, Space, Typography, Tag } from "antd";
import { UserOutlined, LogoutOutlined, GlobalOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

const { Header: AntHeader } = Layout;
const { Text } = Typography;

const ROLE_COLORS: Record<string, string> = {
  admin: "red",
  doctor: "blue",
  nurse: "green",
  patient: "default",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin", doctor: "Shifokor", nurse: "Hamshira", patient: "Bemor",
};

export default function Header() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const changeLang = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang);
  };

  const langMenu = {
    items: [
      { key: "uz", label: "🇺🇿 O'zbek" },
      { key: "ru", label: "🇷🇺 Русский" },
      { key: "en", label: "🇬🇧 English" },
    ],
    onClick: ({ key }: { key: string }) => changeLang(key),
  };

  const userMenu = {
    items: [
      { key: "logout", label: t("auth.logout"), icon: <LogoutOutlined />, danger: true },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === "logout") handleLogout();
    },
  };

  return (
    <AntHeader style={{
      background: "#fff",
      padding: "0 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      boxShadow: "0 1px 4px rgba(0,21,41,0.08)",
      position: "sticky",
      top: 0,
      zIndex: 99,
      gap: 16,
    }}>
      <Dropdown menu={langMenu} trigger={["click"]}>
        <Space style={{ cursor: "pointer", color: "#666" }}>
          <GlobalOutlined />
          <Text style={{ fontSize: 13 }}>
            {{ uz: "O'zbek", ru: "Русский", en: "English" }[i18n.language] || "O'zbek"}
          </Text>
        </Space>
      </Dropdown>

      {user && (
        <Dropdown menu={userMenu} trigger={["click"]}>
          <Space style={{ cursor: "pointer" }}>
            <Avatar size={34} icon={<UserOutlined />} style={{ background: "#1890FF" }} />
            <div style={{ lineHeight: 1.3 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#262626" }}>{user.full_name}</div>
              <Tag color={ROLE_COLORS[user.role]} style={{ fontSize: 10, margin: 0 }}>
                {ROLE_LABELS[user.role]}
              </Tag>
            </div>
          </Space>
        </Dropdown>
      )}
    </AntHeader>
  );
}
