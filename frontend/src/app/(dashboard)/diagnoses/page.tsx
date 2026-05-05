"use client";
import { useState } from "react";
import { Table, Button, Tag, Typography, Card, Select, Row, Col } from "antd";
import { PlusOutlined, EyeOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { diagnosesApi } from "@/lib/api";
import type { Diagnosis } from "@/types";

const { Title } = Typography;

const SEVERITY_COLORS: Record<string, string> = {
  mild: "green", moderate: "orange", severe: "red", critical: "purple",
};
const STATUS_COLORS: Record<string, string> = {
  initial: "default", confirmed: "green", revised: "orange", closed: "gray",
};

export default function DiagnosesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["diagnoses", page, severity, status],
    queryFn: () => diagnosesApi.list({ page, limit: 20, severity, status }).then((r) => r.data),
  });

  const columns = [
    {
      title: t("diagnoses.code"),
      dataIndex: "diagnosis_code",
      width: 130,
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: t("diagnoses.visitDate"),
      dataIndex: "visit_date",
      width: 120,
    },
    {
      title: t("diagnoses.diagnosisText"),
      dataIndex: "diagnosis_text",
      render: (text: string, record: Diagnosis) => (
        <a onClick={() => router.push(`/diagnoses/${record.id}`)} style={{ color: "#1890FF" }}>
          {text}
          {record.is_ai_assisted && <Tag color="purple" style={{ marginLeft: 8, fontSize: 10 }}>🤖 AI</Tag>}
        </a>
      ),
    },
    {
      title: "ICD-10",
      dataIndex: "icd10_code",
      width: 100,
      render: (code: string) => code ? <Tag>{code}</Tag> : "—",
    },
    {
      title: t("diagnoses.severity"),
      dataIndex: "severity",
      width: 110,
      render: (s: string) => s ? <Tag color={SEVERITY_COLORS[s]}>{t(`diagnoses.${s}`)}</Tag> : "—",
    },
    {
      title: t("diagnoses.status"),
      dataIndex: "status",
      width: 120,
      render: (s: string) => <Tag color={STATUS_COLORS[s]}>{t(`diagnoses.${s}`)}</Tag>,
    },
    {
      title: t("patients.actions"),
      width: 80,
      render: (_: any, record: Diagnosis) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => router.push(`/diagnoses/${record.id}`)} />
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>{t("diagnoses.title")}</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push("/diagnoses/new")}>
          {t("diagnoses.add")}
        </Button>
      </div>

      <Card style={{ borderRadius: 12, marginBottom: 16 }}>
        <Row gutter={[12, 12]}>
          <Col xs={12} md={6}>
            <Select placeholder={t("diagnoses.severity")} style={{ width: "100%" }} allowClear onChange={(v) => { setSeverity(v || ""); setPage(1); }}>
              {["mild", "moderate", "severe", "critical"].map((s) => (
                <Select.Option key={s} value={s}><Tag color={SEVERITY_COLORS[s]}>{t(`diagnoses.${s}`)}</Tag></Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} md={6}>
            <Select placeholder={t("diagnoses.status")} style={{ width: "100%" }} allowClear onChange={(v) => { setStatus(v || ""); setPage(1); }}>
              {["initial", "confirmed", "revised", "closed"].map((s) => (
                <Select.Option key={s} value={s}>{t(`diagnoses.${s}`)}</Select.Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      <Card style={{ borderRadius: 12 }}>
        <Table
          columns={columns}
          dataSource={data?.items || []}
          rowKey="id"
          loading={isLoading}
          pagination={{ current: page, pageSize: 20, total: data?.total || 0, onChange: setPage, showTotal: (t) => `Jami: ${t}` }}
          scroll={{ x: 800 }}
          size="middle"
        />
      </Card>
    </div>
  );
}
