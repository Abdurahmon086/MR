"use client";
import { useState } from "react";
import {
  Card, Descriptions, Tag, Button, Typography, Spin, Empty, Space,
  Divider, Modal, Form, Input, Select, message, Image, Row, Col, Alert
} from "antd";
import {
  EditOutlined, RobotOutlined, FilePdfOutlined, CheckCircleOutlined,
  CloseCircleOutlined, ExclamationCircleOutlined
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { diagnosesApi, aiApi, reportsApi, imagesApi } from "@/lib/api";
import type { AIResult, SkinImage } from "@/types";

const { Title, Text, Paragraph } = Typography;

const SEVERITY_COLORS: Record<string, string> = {
  mild: "green", moderate: "orange", severe: "red", critical: "purple",
};
const STATUS_COLORS: Record<string, string> = {
  initial: "default", confirmed: "green", revised: "orange", closed: "gray",
};
const RISK_COLORS: Record<string, string> = {
  low: "#52c41a", medium: "#faad14", high: "#ff7a45", critical: "#f5222d",
};

function ConfidenceBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <Text style={{ fontSize: 12 }}>{label}</Text>
        <Text style={{ fontSize: 12, color }}>{(value * 100).toFixed(1)}%</Text>
      </div>
      <div style={{ background: "#f0f0f0", borderRadius: 4, height: 8, overflow: "hidden" }}>
        <div style={{ width: `${value * 100}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

export default function DiagnosisDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editModal, setEditModal] = useState(false);
  const [form] = Form.useForm();

  const { data: diagnosis, isLoading } = useQuery({
    queryKey: ["diagnosis", id],
    queryFn: () => diagnosesApi.get(id).then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: (values: any) => diagnosesApi.update(id, values),
    onSuccess: () => {
      message.success("Tashxis yangilandi");
      queryClient.invalidateQueries({ queryKey: ["diagnosis", id] });
      queryClient.invalidateQueries({ queryKey: ["diagnoses"] });
      setEditModal(false);
    },
    onError: () => message.error(t("common.error")),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ resultId, agree, notes }: { resultId: string; agree: boolean; notes?: string }) =>
      aiApi.review(resultId, { doctor_agreement: agree, doctor_notes: notes }),
    onSuccess: () => {
      message.success("AI natijasi tasdiqlandi");
      queryClient.invalidateQueries({ queryKey: ["diagnosis", id] });
    },
    onError: () => message.error(t("common.error")),
  });

  const reportMutation = useMutation({
    mutationFn: () => reportsApi.generate({
      report_type: "patient_summary",
      title: `Bemor xulosasi — ${diagnosis?.diagnosis_code || ""}`,
      patient_id: diagnosis?.patient_id,
    }),
    onSuccess: async (res) => {
      const reportId = res.data?.report_id || res.data?.id;
      if (!reportId) { message.info("Hisobot tayyorlanmoqda..."); return; }
      message.loading({ content: "PDF tayyorlanmoqda...", key: "pdf", duration: 0 });
      // Background task tugashini kutamiz
      await new Promise((r) => setTimeout(r, 2500));
      try {
        await reportsApi.download(reportId, `tashxis_${diagnosis?.diagnosis_code}.pdf`);
        message.success({ content: "PDF yuklandi", key: "pdf" });
      } catch {
        message.error({ content: "PDF yuklab olishda xatolik", key: "pdf" });
      }
    },
    onError: () => message.error("PDF yaratishda xatolik"),
  });

  if (isLoading) return <div style={{ textAlign: "center", padding: 60 }}><Spin size="large" /></div>;
  if (!diagnosis) return <Empty description="Tashxis topilmadi" />;

  const images: SkinImage[] = diagnosis.images || [];
  // Collect all AI results from all images linked to this diagnosis
  const aiResults: AIResult[] = images.flatMap((img: any) => img.ai_results || []);

  const openEdit = () => {
    form.setFieldsValue({
      diagnosis_text: diagnosis.diagnosis_text,
      icd10_code: diagnosis.icd10_code,
      icd10_name: diagnosis.icd10_name,
      severity: diagnosis.severity,
      status: diagnosis.status,
      treatment_plan: diagnosis.treatment_plan,
      chief_complaint: diagnosis.chief_complaint,
      anamnesis: diagnosis.anamnesis,
      objective_data: diagnosis.objective_data,
      follow_up_date: diagnosis.follow_up_date,
    });
    setEditModal(true);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Button onClick={() => router.back()}>← {t("common.back")}</Button>
          <Title level={3} style={{ margin: 0 }}>
            <Tag color="blue" style={{ fontSize: 14 }}>{diagnosis.diagnosis_code}</Tag>
            {diagnosis.diagnosis_text}
          </Title>
        </div>
        <Space wrap>
          <Button icon={<FilePdfOutlined />} onClick={() => reportMutation.mutate()} loading={reportMutation.isPending}>
            PDF Hisobot
          </Button>
          <Button icon={<EditOutlined />} type="primary" onClick={openEdit}>
            {t("common.edit")}
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        {/* Main Info */}
        <Col xs={24} lg={14}>
          <Card title="Tashxis Ma'lumotlari" style={{ borderRadius: 12, marginBottom: 16 }}>
            <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="Tashxis kodi">
                <Tag color="blue">{diagnosis.diagnosis_code}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Qabul sanasi">{diagnosis.visit_date}</Descriptions.Item>
              <Descriptions.Item label="ICD-10 kod">
                {diagnosis.icd10_code ? <Tag>{diagnosis.icd10_code}</Tag> : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="ICD-10 nomi">{diagnosis.icd10_name || "—"}</Descriptions.Item>
              <Descriptions.Item label="Og'irlik darajasi">
                {diagnosis.severity ? (
                  <Tag color={SEVERITY_COLORS[diagnosis.severity]}>{t(`diagnoses.${diagnosis.severity}`)}</Tag>
                ) : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Holati">
                <Tag color={STATUS_COLORS[diagnosis.status]}>{t(`diagnoses.${diagnosis.status}`)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="AI yordami" span={2}>
                {diagnosis.is_ai_assisted ? <Tag color="purple">🤖 AI Yordamida</Tag> : <Tag>Yo'q</Tag>}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            {diagnosis.chief_complaint && (
              <div style={{ marginBottom: 12 }}>
                <Text strong>Shikoyat:</Text>
                <Paragraph style={{ marginTop: 4, marginBottom: 0, color: "#555" }}>{diagnosis.chief_complaint}</Paragraph>
              </div>
            )}
            {diagnosis.anamnesis && (
              <div style={{ marginBottom: 12 }}>
                <Text strong>Anamnez:</Text>
                <Paragraph style={{ marginTop: 4, marginBottom: 0, color: "#555" }}>{diagnosis.anamnesis}</Paragraph>
              </div>
            )}
            {diagnosis.objective_data && (
              <div style={{ marginBottom: 12 }}>
                <Text strong>Ob'ektiv ma'lumotlar:</Text>
                <Paragraph style={{ marginTop: 4, marginBottom: 0, color: "#555" }}>{diagnosis.objective_data}</Paragraph>
              </div>
            )}
            {diagnosis.treatment_plan && (
              <div style={{ marginBottom: 12 }}>
                <Text strong>Davolash rejasi:</Text>
                <Paragraph style={{ marginTop: 4, marginBottom: 0, color: "#555" }}>{diagnosis.treatment_plan}</Paragraph>
              </div>
            )}
            {diagnosis.follow_up_date && (
              <div>
                <Text strong>Keyingi qabul: </Text>
                <Tag color="geekblue">{diagnosis.follow_up_date}</Tag>
              </div>
            )}
          </Card>

          {/* Images */}
          {images.length > 0 && (
            <Card title={`Teri Rasmlari (${images.length})`} style={{ borderRadius: 12 }}>
              <Image.PreviewGroup>
                <Row gutter={[8, 8]}>
                  {images.map((img) => (
                    <Col key={img.id} xs={8} sm={6} md={4}>
                      <Image
                        src={imagesApi.imageUrl(img.file_path)}
                        alt={img.body_location || "Teri rasmi"}
                        style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 6, border: "1px solid #f0f0f0" }}
                        fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3PTWBSGcbGzM6GCKqlIBRV0dHRJFareCb2oMQqmpLPALCHamXSGUELDQiOFoGxICYKiLKFiHQmVlbhAWCR8QQLYfFGneMsGnfhAL8AAAAAASUVORK5CYII="
                      />
                    </Col>
                  ))}
                </Row>
              </Image.PreviewGroup>
            </Card>
          )}
        </Col>

        {/* AI Results */}
        <Col xs={24} lg={10}>
          {aiResults.length > 0 ? (
            aiResults.map((result) => (
              <Card
                key={result.id}
                title={<Space><RobotOutlined style={{ color: "#722ed1" }} /><Text strong>AI Tahlil Natijasi</Text></Space>}
                style={{ borderRadius: 12, marginBottom: 16 }}
                extra={
                  result.is_reviewed ? (
                    <Tag color={result.doctor_agreement ? "green" : "red"}>
                      {result.doctor_agreement ? "✓ Tasdiqlangan" : "✗ Rad etilgan"}
                    </Tag>
                  ) : (
                    <Tag color="orange">Tekshirilmagan</Tag>
                  )
                }
              >
                {/* Main prediction */}
                <Alert
                  type={result.risk_level === "critical" ? "error" : result.risk_level === "high" ? "warning" : "info"}
                  message={
                    <Space>
                      <Text strong style={{ fontSize: 15 }}>{result.predicted_label}</Text>
                      <Tag color={result.risk_level === "critical" ? "red" : result.risk_level === "high" ? "orange" : "blue"} style={{ fontSize: 13 }}>
                        {(result.confidence * 100).toFixed(1)}% ishonch
                      </Tag>
                    </Space>
                  }
                  description={`Xavf darajasi: ${result.risk_level?.toUpperCase()}`}
                  showIcon
                  style={{ marginBottom: 16 }}
                />

                {/* All probabilities */}
                {result.all_probabilities && Object.keys(result.all_probabilities).length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>Barcha sinf ehtimolliklari:</Text>
                    {Object.entries(result.all_probabilities)
                      .sort(([, a], [, b]) => b - a)
                      .map(([cls, prob]) => (
                        <ConfidenceBar
                          key={cls}
                          label={cls.toUpperCase()}
                          value={prob}
                          color={prob === result.confidence ? RISK_COLORS[result.risk_level] || "#1890ff" : "#8c8c8c"}
                        />
                      ))}
                  </div>
                )}

                <Divider style={{ margin: "12px 0" }} />

                {/* Doctor review */}
                {!result.is_reviewed ? (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
                      <ExclamationCircleOutlined /> Doktor AI natijasini tasdiqlashi kerak
                    </Text>
                    <Space>
                      <Button
                        size="small"
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={() => reviewMutation.mutate({ resultId: result.id, agree: true })}
                        loading={reviewMutation.isPending}
                        style={{ background: "#52c41a", borderColor: "#52c41a" }}
                      >
                        Tasdiqlayman
                      </Button>
                      <Button
                        size="small"
                        danger
                        icon={<CloseCircleOutlined />}
                        onClick={() => reviewMutation.mutate({ resultId: result.id, agree: false })}
                        loading={reviewMutation.isPending}
                      >
                        Rozi emasman
                      </Button>
                    </Space>
                  </div>
                ) : (
                  result.doctor_notes && (
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>Doktor izohi: </Text>
                      <Text style={{ fontSize: 12 }}>{result.doctor_notes}</Text>
                    </div>
                  )
                )}

                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Model: {result.model_version} | {result.processing_time_ms ? `${result.processing_time_ms}ms` : ""}
                  </Text>
                </div>
              </Card>
            ))
          ) : (
            <Card title="AI Tahlil" style={{ borderRadius: 12 }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="AI tahlil natijalari yo'q"
              >
                <Button
                  type="primary"
                  icon={<RobotOutlined />}
                  onClick={() => router.push(`/ai-analysis?patient_id=${diagnosis.patient_id}&diagnosis_id=${id}`)}
                >
                  AI Tahlil qilish
                </Button>
              </Empty>
            </Card>
          )}
        </Col>
      </Row>

      {/* Edit Modal */}
      <Modal
        title="Tashxisni Tahrirlash"
        open={editModal}
        onCancel={() => setEditModal(false)}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={(v) => updateMutation.mutate(v)}>
          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item name="diagnosis_text" label="Tashxis matni" rules={[{ required: true }]}>
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="icd10_code" label="ICD-10 Kod">
                <Input placeholder="L57.0" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="icd10_name" label="ICD-10 Nomi">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="severity" label="Og'irlik darajasi">
                <Select allowClear>
                  {["mild", "moderate", "severe", "critical"].map((s) => (
                    <Select.Option key={s} value={s}>
                      <Tag color={SEVERITY_COLORS[s]}>{t(`diagnoses.${s}`)}</Tag>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="status" label="Holati" rules={[{ required: true }]}>
                <Select>
                  {["initial", "confirmed", "revised", "closed"].map((s) => (
                    <Select.Option key={s} value={s}>{t(`diagnoses.${s}`)}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="chief_complaint" label="Shikoyat">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="anamnesis" label="Anamnez">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="objective_data" label="Ob'ektiv ma'lumotlar">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="treatment_plan" label="Davolash rejasi">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="follow_up_date" label="Keyingi qabul sanasi">
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <Button onClick={() => setEditModal(false)}>{t("common.cancel")}</Button>
            <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>{t("common.save")}</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
