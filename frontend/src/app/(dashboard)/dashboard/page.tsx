"use client";
import { Row, Col, Card, Statistic, Typography, Spin, List, Tag, Empty } from "antd";
import {
  TeamOutlined, FileTextOutlined, RobotOutlined, CalendarOutlined, RiseOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { dashboardApi } from "@/lib/api";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

const { Title, Text } = Typography;

const CLASS_COLORS: Record<string, string> = {
  mel: "#9C27B0", bcc: "#FF4444", akiec: "#FF6B35",
  vasc: "#F44336", bkl: "#4CAF50", df: "#2196F3", nv: "#8BC34A",
};

export default function DashboardPage() {
  const { t } = useTranslation();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardApi.stats().then((r) => r.data),
  });

  const { data: classData } = useQuery({
    queryKey: ["dashboard-class"],
    queryFn: () => dashboardApi.byClass().then((r) => r.data),
  });

  const { data: ageData } = useQuery({
    queryKey: ["dashboard-age"],
    queryFn: () => dashboardApi.ageDistribution().then((r) => r.data),
  });

  const { data: activity } = useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: () => dashboardApi.recentActivity().then((r) => r.data),
  });

  const { data: todayAppts } = useQuery({
    queryKey: ["dashboard-today"],
    queryFn: () => dashboardApi.todayAppointments().then((r) => r.data),
  });

  const statCards = [
    { title: t("dashboard.totalPatients"), value: stats?.total_patients, icon: <TeamOutlined />, color: "#1890FF" },
    { title: t("dashboard.totalDiagnoses"), value: stats?.total_diagnoses, icon: <FileTextOutlined />, color: "#52c41a" },
    { title: t("dashboard.aiAnalyses"), value: stats?.total_ai_analyses, icon: <RobotOutlined />, color: "#722ed1" },
    { title: t("dashboard.todayAppointments"), value: stats?.today_appointments, icon: <CalendarOutlined />, color: "#fa8c16" },
    { title: t("dashboard.newThisMonth"), value: stats?.new_patients_this_month, icon: <RiseOutlined />, color: "#13c2c2" },
  ];

  const pieData = (classData || []).filter((d: any) => d.count > 0);

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24, color: "#262626" }}>
        {t("dashboard.title")}
      </Title>

      {/* Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card) => (
          <Col xs={24} sm={12} md={8} lg={8} xl={4} key={card.title}>
            <Card
              className="stat-card"
              style={{ borderRadius: 12, borderTop: `3px solid ${card.color}` }}
              bodyStyle={{ padding: "20px 24px" }}
            >
              {statsLoading ? (
                <Spin size="small" />
              ) : (
                <Statistic
                  title={<span style={{ fontSize: 12, color: "#8c8c8c" }}>{card.title}</span>}
                  value={card.value ?? 0}
                  prefix={<span style={{ color: card.color, fontSize: 18 }}>{card.icon}</span>}
                  valueStyle={{ color: "#262626", fontSize: 28, fontWeight: 700 }}
                />
              )}
            </Card>
          </Col>
        ))}
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* AI Class Distribution Pie */}
        <Col xs={24} lg={12}>
          <Card title={t("dashboard.classDist")} style={{ borderRadius: 12 }}>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="count"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      label={false}
                    >
                      {pieData.map((entry: any) => (
                        <Cell key={entry.class} fill={CLASS_COLORS[entry.class] || "#1890FF"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any, name: any) => [value, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 8, padding: "0 8px" }}>
                  {pieData.map((entry: any) => {
                    const total = pieData.reduce((s: number, d: any) => s + d.count, 0);
                    const pct = total > 0 ? ((entry.count / total) * 100).toFixed(0) : 0;
                    return (
                      <div key={entry.class} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 2, background: CLASS_COLORS[entry.class] || "#1890FF", flexShrink: 0 }} />
                        <span style={{ color: "#555" }}>{entry.label} <strong>{pct}%</strong></span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <Empty description="Ma'lumot yo'q" style={{ paddingTop: 40 }} />
            )}
          </Card>
        </Col>

        {/* Age Distribution Bar */}
        <Col xs={24} lg={12}>
          <Card title={t("dashboard.ageDist")} style={{ borderRadius: 12, height: 340 }}>
            {ageData?.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={ageData}>
                  <XAxis dataKey="age_group" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1890FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="Ma'lumot yo'q" style={{ paddingTop: 40 }} />
            )}
          </Card>
        </Col>
      </Row>

      {/* Bottom Row */}
      <Row gutter={[16, 16]}>
        {/* Today's Appointments */}
        <Col xs={24} lg={12}>
          <Card title={t("appointments.today")} style={{ borderRadius: 12 }}>
            {todayAppts?.length > 0 ? (
              <List
                size="small"
                dataSource={todayAppts}
                renderItem={(appt: any) => (
                  <List.Item>
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                      <Text>{new Date(appt.scheduled_at).toLocaleTimeString("uz", { hour: "2-digit", minute: "2-digit" })}</Text>
                      <Tag color={appt.status === "confirmed" ? "green" : "blue"}>{appt.status}</Tag>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="Bugun qabul yo'q" />
            )}
          </Card>
        </Col>

        {/* Recent Activity */}
        <Col xs={24} lg={12}>
          <Card title={t("dashboard.recentActivity")} style={{ borderRadius: 12 }}>
            {activity?.length > 0 ? (
              <List
                size="small"
                dataSource={activity.slice(0, 8)}
                renderItem={(item: any) => (
                  <List.Item>
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%", gap: 8 }}>
                      <Tag color="blue" style={{ fontSize: 11 }}>{item.action}</Tag>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {new Date(item.created_at).toLocaleString("uz")}
                      </Text>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description={t("common.noData")} />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
