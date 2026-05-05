"use client";
import { Card, Descriptions, Tag, Tabs, Button, Typography, Spin, Empty, Timeline, Space } from "antd";
import { EditOutlined, FileAddOutlined, CameraOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { patientsApi, diagnosesApi } from "@/lib/api";
import type { Diagnosis } from "@/types";

const { Title, Text } = Typography;

const SEVERITY_COLORS: Record<string, string> = {
  mild: "green", moderate: "orange", severe: "red", critical: "purple",
};

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { t } = useTranslation();
  const router = useRouter();

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => patientsApi.get(id).then((r) => r.data),
  });

  const { data: diagnosesData } = useQuery({
    queryKey: ["patient-diagnoses", id],
    queryFn: () => diagnosesApi.list({ patient_id: id, limit: 50 }).then((r) => r.data),
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
            {patient.allergies?.length ? patient.allergies.map((a: string) => <Tag key={a} color="red">{a}</Tag>) : "—"}
          </Descriptions.Item>
          <Descriptions.Item label={t("patients.chronicDiseases")}>
            {patient.chronic_diseases?.length ? patient.chronic_diseases.map((c: string) => <Tag key={c} color="orange">{c}</Tag>) : "—"}
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
          <Button type="primary" icon={<FileAddOutlined />} onClick={() => router.push(`/diagnoses/new?patient_id=${id}`)} style={{ marginBottom: 16 }}>
            {t("diagnoses.add")}
          </Button>
          {diagnosesData?.items?.length > 0 ? (
            <Timeline
              items={diagnosesData.items.map((d: Diagnosis) => ({
                color: SEVERITY_COLORS[d.severity || "mild"],
                children: (
                  <Card size="small" style={{ marginBottom: 8, cursor: "pointer" }} onClick={() => router.push(`/diagnoses/${d.id}`)}>
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
                    {d.chief_complaint && <Text type="secondary" style={{ fontSize: 12 }}>Shikoyat: {d.chief_complaint}</Text>}
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
          <Button icon={<CameraOutlined />} onClick={() => router.push(`/ai-analysis?patient_id=${id}`)}>AI Tahlil</Button>
          <Button icon={<EditOutlined />} onClick={() => router.push(`/patients/${id}/edit`)}>Tahrirlash</Button>
        </Space>
      </div>
      <Card style={{ borderRadius: 12 }}>
        <Tabs items={tabItems} defaultActiveKey="info" />
      </Card>
    </div>
  );
}
