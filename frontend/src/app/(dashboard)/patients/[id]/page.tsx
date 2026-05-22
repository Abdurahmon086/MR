"use client";
import {
  Card, Descriptions, Tag, Tabs, Button, Typography, Spin, Empty,
  Timeline, Space, Progress, Alert, Divider
} from "antd";
import {
  EditOutlined, FileAddOutlined, CameraOutlined,
  RobotOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { patientsApi, diagnosesApi, aiApi } from "@/lib/api";
import type { Diagnosis } from "@/types";

const { Title, Text } = Typography;

const SEVERITY_COLORS: Record<string, string> = {
  mild: "green", moderate: "orange", severe: "red", critical: "purple",
};
const RISK_CONFIG: Record<string, { color: string; label: string }> = {
  critical: { color: "#9C27B0", label: "JUDA XAVFLI" },
  high:     { color: "#FF4444", label: "Xavfli" },
  medium:   { color: "#FF9800", label: "O'rtacha" },
  low:      { color: "#4CAF50", label: "Past xavf" },
};
const CLASS_COLORS: Record<string, string> = {
  mel: "#9C27B0", bcc: "#FF4444", akiec: "#FF6B35",
  vasc: "#F44336", bkl: "#4CAF50", df: "#2196F3", nv: "#8BC34A",
};

function PatientDetailContent({ params }: { params: { id: string } }) {
  const { id } = params;
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "info";

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => patientsApi.get(id).then((r) => r.data),
  });

  const { data: diagnosesData } = useQuery({
    queryKey: ["patient-diagnoses", id],
    queryFn: () => diagnosesApi.list({ patient_id: id, limit: 50 }).then((r) => r.data),
    enabled: !!id,
  });

  const { data: aiResults } = useQuery({
    queryKey: ["patient-ai-results", id],
    queryFn: () => aiApi.patientResults(id).then((r) => r.data),
    enabled: !!id,
  });

  if (isLoading) return <div style={{ textAlign: "center", padding: 60 }}><Spin size="large" /></div>;
  if (!patient) return <Empty description="Bemor topilmadi" />;

  const tabItems = [
    {
      key: "info",
      label: t("patients.info"),
      children: (
        <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }} size="middle">
          <Descriptions.Item label="Bemor kodi"><Tag color="blue">{patient.patient_code}</Tag></Descriptions.Item>
          <Descriptions.Item label="F.I.O.">{patient.full_name}</Descriptions.Item>
          <Descriptions.Item label="Yoshi">{patient.age} yosh</Descriptions.Item>
          <Descriptions.Item label="Tug'ilgan sana">{patient.birth_date}</Descriptions.Item>
          <Descriptions.Item label="Jinsi">
            <Tag color={patient.gender === "male" ? "geekblue" : "magenta"}>
              {patient.gender === "male" ? "Erkak" : "Ayol"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Qon guruhi">{patient.blood_type || "—"}</Descriptions.Item>
          <Descriptions.Item label="Telefon">{patient.phone || "—"}</Descriptions.Item>
          <Descriptions.Item label="Email">{patient.email || "—"}</Descriptions.Item>
          <Descriptions.Item label="Viloyat">{patient.region || "—"}</Descriptions.Item>
          <Descriptions.Item label="Tuman">{patient.district || "—"}</Descriptions.Item>
          <Descriptions.Item label="Manzil" span={2}>{patient.address || "—"}</Descriptions.Item>
          <Descriptions.Item label={t("patients.allergies")}>
            {patient.allergies?.length
              ? patient.allergies.map((a: string) => <Tag key={a} color="red">{a}</Tag>)
              : "—"}
          </Descriptions.Item>
          <Descriptions.Item label={t("patients.chronicDiseases")}>
            {patient.chronic_diseases?.length
              ? patient.chronic_diseases.map((c: string) => <Tag key={c} color="orange">{c}</Tag>)
              : "—"}
          </Descriptions.Item>
          <Descriptions.Item label={t("patients.notes")} span={3}>{patient.notes || "—"}</Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: "diagnoses",
      label: `${t("diagnoses.title")} (${diagnosesData?.total || 0})`,
      children: (
        <div>
          <Button
            type="primary"
            icon={<FileAddOutlined />}
            onClick={() => router.push(`/diagnoses/new?patient_id=${id}`)}
            style={{ marginBottom: 16 }}
          >
            {t("diagnoses.add")}
          </Button>
          {diagnosesData?.items?.length > 0 ? (
            <Timeline
              items={diagnosesData.items.map((d: Diagnosis) => ({
                color: SEVERITY_COLORS[d.severity || "mild"],
                children: (
                  <Card
                    size="small"
                    style={{ marginBottom: 8, cursor: "pointer" }}
                    onClick={() => router.push(`/diagnoses/${d.id}`)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <Tag color="blue">{d.diagnosis_code}</Tag>
                        <Text strong>{d.diagnosis_text}</Text>
                        {d.icd10_code && <Tag style={{ marginLeft: 8 }}>{d.icd10_code}</Tag>}
                        {d.is_ai_assisted && <Tag color="purple">🤖 AI</Tag>}
                      </div>
                      <Space>
                        <Text type="secondary">{d.visit_date}</Text>
                        {d.severity && <Tag color={SEVERITY_COLORS[d.severity]}>{t(`diagnoses.${d.severity}`)}</Tag>}
                        <Tag color={d.status === "confirmed" ? "green" : "default"}>{t(`diagnoses.${d.status}`)}</Tag>
                      </Space>
                    </div>
                    {d.chief_complaint && (
                      <Text type="secondary" style={{ fontSize: 12 }}>Shikoyat: {d.chief_complaint}</Text>
                    )}
                  </Card>
                ),
              }))}
            />
          ) : (
            <Empty description="Tashxislar yo'q" />
          )}
        </div>
      ),
    },
    {
      key: "ai",
      label: (
        <span>
          <RobotOutlined style={{ marginRight: 4, color: "#1890FF" }} />
          AI Tahlillar {aiResults?.length ? `(${aiResults.length})` : ""}
        </span>
      ),
      children: (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Text type="secondary">Ushbu bemor uchun barcha AI tahlil natijalari</Text>
            <Button
              type="primary"
              icon={<CameraOutlined />}
              onClick={() => router.push(`/ai-analysis?patient_id=${id}`)}
            >
              Yangi tahlil
            </Button>
          </div>

          {!aiResults?.length ? (
            <Empty
              image={<RobotOutlined style={{ fontSize: 60, color: "#d9d9d9" }} />}
              description={
                <span>
                  Hali tahlil yo'q.{" "}
                  <a onClick={() => router.push(`/ai-analysis?patient_id=${id}`)}>Tahlil qilish</a>
                </span>
              }
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {aiResults.map((r: any) => {
                const risk = RISK_CONFIG[r.risk_level] || RISK_CONFIG.low;
                return (
                  <Card
                    key={r.id}
                    style={{ borderRadius: 10, borderLeft: `4px solid ${risk.color}` }}
                    size="small"
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                      <div>
                        <Tag color={risk.color} style={{ fontSize: 12 }}>{risk.label}</Tag>
                        <Text strong style={{ fontSize: 16, color: risk.color, marginLeft: 8 }}>
                          {r.predicted_label}
                        </Text>
                        <Tag style={{ marginLeft: 8 }}>{r.predicted_class?.toUpperCase()}</Tag>
                      </div>
                      <Space>
                        {r.is_reviewed ? (
                          r.doctor_agreement ? (
                            <Tag icon={<CheckCircleOutlined />} color="success">Tasdiqlangan</Tag>
                          ) : (
                            <Tag icon={<CloseCircleOutlined />} color="error">Rad etilgan</Tag>
                          )
                        ) : (
                          <Tag icon={<ClockCircleOutlined />} color="warning">Ko'rib chiqilmagan</Tag>
                        )}
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {r.created_at ? new Date(r.created_at).toLocaleString("uz-UZ") : ""}
                        </Text>
                      </Space>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <Text style={{ fontSize: 12, minWidth: 80 }}>Ishonch:</Text>
                      <Progress
                        percent={Math.round(r.confidence * 100)}
                        strokeColor={risk.color}
                        size="small"
                        style={{ flex: 1, maxWidth: 200 }}
                      />
                      <Text strong style={{ color: risk.color, fontSize: 12 }}>
                        {(r.confidence * 100).toFixed(1)}%
                      </Text>
                    </div>

                    {r.all_probabilities && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                        {Object.entries(r.all_probabilities as Record<string, number>)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 4)
                          .map(([cls, prob]) => (
                            <Tag key={cls} color={CLASS_COLORS[cls] || "default"} style={{ fontSize: 11 }}>
                              {cls.toUpperCase()}: {(prob * 100).toFixed(0)}%
                            </Tag>
                          ))}
                      </div>
                    )}

                    {r.is_reviewed && r.doctor_notes && (
                      <Alert
                        message={`Doktor izohi: ${r.doctor_notes}`}
                        type={r.doctor_agreement ? "success" : "error"}
                        showIcon
                        style={{ marginTop: 8, borderRadius: 6 }}
                      />
                    )}

                    <Divider style={{ margin: "8px 0" }} />
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Model: {r.model_version} · {r.processing_time_ms}ms
                    </Text>
                    {!r.is_reviewed && (
                      <Button
                        size="small"
                        type="link"
                        icon={<RobotOutlined />}
                        onClick={() => router.push(`/ai-analysis?patient_id=${id}`)}
                        style={{ marginLeft: 8, padding: 0 }}
                      >
                        Ko'rib chiqish
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Button onClick={() => router.back()}>← {t("common.back")}</Button>
          <Title level={3} style={{ margin: 0 }}>{patient.full_name}</Title>
          <Tag color="blue" style={{ fontSize: 13 }}>{patient.patient_code}</Tag>
        </div>
        <Space>
          <Button icon={<CameraOutlined />} onClick={() => router.push(`/ai-analysis?patient_id=${id}`)}>
            AI Tahlil
          </Button>
          <Button icon={<EditOutlined />} onClick={() => router.push(`/patients/${id}/edit`)}>
            Tahrirlash
          </Button>
        </Space>
      </div>
      <Card style={{ borderRadius: 12 }}>
        <Tabs items={tabItems} defaultActiveKey={defaultTab} />
      </Card>
    </div>
  );
}

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  return <Suspense fallback={<div style={{ textAlign: "center", padding: 60 }}><Spin size="large" /></div>}><PatientDetailContent params={params} /></Suspense>;
}
