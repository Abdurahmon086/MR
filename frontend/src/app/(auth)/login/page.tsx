"use client";
import { useState } from "react";
import { Form, Input, Button, Typography, Alert } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/lib/api";

const { Title, Text } = Typography;

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await authApi.login(values.email, values.password);
      setTokens(data.access_token, data.refresh_token);
      const { data: user } = await authApi.me();
      setUser(user);
      router.push("/dashboard");
    } catch {
      setError(t("auth.loginError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Left Panel */}
      <div style={{
        flex: 1,
        background: "linear-gradient(145deg, #0a2342 0%, #1a3a6b 40%, #1677ff 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 48px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ position: "absolute", bottom: -100, right: -60, width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ position: "absolute", top: "40%", right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 420 }}>
          {/* Logo */}
          <div style={{
            width: 90, height: 90, borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 28px",
            border: "2px solid rgba(255,255,255,0.2)",
            fontSize: 44,
          }}>🔬</div>

          <Title level={2} style={{ color: "#fff", margin: "0 0 12px", fontWeight: 700, letterSpacing: -0.5 }}>
            Dermatologik Tashxis
          </Title>
          <Title level={2} style={{ color: "#60a5fa", margin: "0 0 20px", fontWeight: 700, letterSpacing: -0.5 }}>
            Axborot Tizimi
          </Title>
          <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 15, lineHeight: 1.6, display: "block", marginBottom: 48 }}>
            Teri kasalliklari diagnostikasi uchun zamonaviy tibbiy axborot tizimi
          </Text>

          {/* Feature list */}
          {[
            { icon: "🤖", text: "AI asosida dermoskopik tahlil" },
            { icon: "📋", text: "Bemor ma'lumotlarini boshqarish" },
            { icon: "📊", text: "Statistika va PDF hisobotlar" },
            { icon: "🔒", text: "Xavfsiz rol asosida kirish" },
          ].map((f) => (
            <div key={f.text} style={{
              display: "flex", alignItems: "center", gap: 14,
              marginBottom: 16, textAlign: "left",
              padding: "12px 16px",
              background: "rgba(255,255,255,0.06)",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.08)",
            }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{f.icon}</span>
              <Text style={{ color: "rgba(255,255,255,0.82)", fontSize: 14 }}>{f.text}</Text>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div style={{
        width: "100%",
        maxWidth: 480,
        background: "#f8faff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 48px",
      }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <Title level={3} style={{ margin: "0 0 6px", color: "#0a2342", fontWeight: 700 }}>
              Tizimga kirish
            </Title>
            <Text style={{ color: "#6b7280", fontSize: 14 }}>
              Davom etish uchun hisobingizga kiring
            </Text>
          </div>

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              style={{ marginBottom: 20, borderRadius: 10 }}
            />
          )}

          <Form layout="vertical" onFinish={onFinish} size="large">
            <Form.Item
              name="email"
              label={<span style={{ color: "#374151", fontWeight: 500, fontSize: 14 }}>Elektron pochta</span>}
              rules={[{ required: true, message: "Email kiriting" }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: "#9ca3af" }} />}
                placeholder="admin@derm.uz"
                style={{ borderRadius: 10, height: 48, border: "1.5px solid #e5e7eb", background: "#fff" }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span style={{ color: "#374151", fontWeight: 500, fontSize: 14 }}>Parol</span>}
              rules={[{ required: true, message: "Parol kiriting" }]}
              style={{ marginBottom: 24 }}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#9ca3af" }} />}
                placeholder="••••••••"
                style={{ borderRadius: 10, height: 48, border: "1.5px solid #e5e7eb", background: "#fff" }}
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{
                height: 50,
                borderRadius: 10,
                fontSize: 16,
                fontWeight: 600,
                background: "linear-gradient(90deg, #1677ff, #0a52cc)",
                border: "none",
                boxShadow: "0 4px 14px rgba(22,119,255,0.35)",
                marginBottom: 24,
              }}
            >
              {loading ? "Kirish..." : "Kirish →"}
            </Button>
          </Form>

          {/* Demo credentials */}
          <div style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "16px 20px",
          }}>
            <Text style={{ fontSize: 12, fontWeight: 600, color: "#1677ff", display: "block", marginBottom: 10 }}>
              🔑 Demo hisoblar:
            </Text>
            {[
              { role: "Admin", email: "admin@derm.uz", pass: "Admin1234!", color: "#7c3aed" },
              { role: "Shifokor", email: "doctor1@derm.uz", pass: "Doctor123!", color: "#059669" },
              { role: "Hamshira", email: "nurse1@derm.uz", pass: "Nurse123!", color: "#d97706" },
            ].map((acc) => (
              <div key={acc.role} style={{
                display: "flex", alignItems: "center", gap: 10,
                marginBottom: 6, padding: "6px 10px",
                background: "#f9fafb", borderRadius: 8,
              }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: acc.color,
                  background: acc.color + "18", padding: "2px 8px", borderRadius: 20,
                  minWidth: 60, textAlign: "center",
                }}>
                  {acc.role}
                </span>
                <Text style={{ fontSize: 12, color: "#374151", fontFamily: "monospace" }}>
                  {acc.email}
                </Text>
                <Text style={{ fontSize: 12, color: "#9ca3af", marginLeft: "auto", fontFamily: "monospace" }}>
                  {acc.pass}
                </Text>
              </div>
            ))}
          </div>

          <Text style={{ display: "block", textAlign: "center", marginTop: 24, fontSize: 12, color: "#d1d5db" }}>
            © 2026 Dermatologik Tashxis Axborot Tizimi
          </Text>
        </div>
      </div>
    </div>
  );
}
