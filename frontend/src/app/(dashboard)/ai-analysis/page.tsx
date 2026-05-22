"use client";
import { useState, Suspense } from "react";
import { Card, Button, Select, Upload, Typography, Alert, Progress, Tag, Space, Divider, Row, Col, Spin, message } from "antd";
import { InboxOutlined, RobotOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSearchParams, useRouter } from "next/navigation";
import { patientsApi, imagesApi, aiApi } from "@/lib/api";
import type { AIResult } from "@/types";

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

const RISK_CONFIG = {
  critical: { color: "#9C27B0", bg: "#F3E5F5", label: "JUDA XAVFLI" },
  high: { color: "#FF4444", bg: "#FFEBEE", label: "Xavfli" },
  medium: { color: "#FF9800", bg: "#FFF3E0", label: "O'rtacha xavf" },
  low: { color: "#4CAF50", bg: "#E8F5E9", label: "Past xavf" },
};

const CLASS_COLORS: Record<string, string> = {
  mel: "#9C27B0", bcc: "#FF4444", akiec: "#FF6B35",
  vasc: "#F44336", bkl: "#4CAF50", df: "#2196F3", nv: "#8BC34A",
};

function AIAnalysisContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const defaultPatientId = searchParams.get("patient_id") || undefined;

  const [patientId, setPatientId] = useState<string | undefined>(defaultPatientId);
  const [fileList, setFileList] = useState<any[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [result, setResult] = useState<(AIResult & { description_uz?: string; icd10?: string }) | null>(null);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [reviewed, setReviewed] = useState<{ agreement: boolean; notes: string } | null>(null);
  const [modelInfo, setModelInfo] = useState<{ loaded: boolean } | null>(null);

  const { data: patients } = useQuery({
    queryKey: ["patients-select"],
    queryFn: () => patientsApi.list({ limit: 100 }).then((r) => r.data.items),
  });

  useQuery({
    queryKey: ["model-info"],
    queryFn: () => aiApi.modelInfo().then((r) => { setModelInfo(r.data); return r.data; }),
  });

  const uploadAndAnalyze = useMutation({
    mutationFn: async () => {
      if (!patientId || fileList.length === 0) throw new Error("Bemor va rasm tanlang");
      const file = fileList[0].originFileObj;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("patient_id", patientId);
      const { data: imgData } = await imagesApi.upload(formData);
      const { data: aiData } = await aiApi.analyze(imgData.id);
      return aiData;
    },
    onSuccess: (data) => {
      setResult({ ...data, id: data.result_id });
      setReviewed(null);
      setDoctorNotes("");
    },
    onError: (err: any) => message.error(err.message || t("common.error")),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ agreement }: { agreement: boolean }) =>
      aiApi.review(result!.id, { doctor_agreement: agreement, doctor_notes: doctorNotes }),
    onSuccess: (_, variables) => {
      setReviewed({ agreement: variables.agreement, notes: doctorNotes });
      message.success(variables.agreement ? "✓ Natija tasdiqlandi" : "✗ Natija rad etildi");
    },
    onError: () => message.error(t("common.error")),
  });

  const riskCfg = result ? RISK_CONFIG[result.risk_level as keyof typeof RISK_CONFIG] : null;

  return (
    <div>
      <Title level={3} style={{ marginBottom: 12 }}>
        <RobotOutlined style={{ color: "#1890FF", marginRight: 8 }} />
        {t("ai.title")}
      </Title>

      {modelInfo && !modelInfo.loaded && !(modelInfo as any).mode?.includes("real") && (
        <Alert
          type="warning"
          showIcon
          message="Demo rejim — AI model fayli yuklanmagan"
          description="Natijalar tasodifiy generatsiya qilinmoqda. Real natijalar uchun ai_models/efficientnet_ham10000.pth faylini joylashtiring."
          style={{ marginBottom: 16, borderRadius: 8 }}
          closable
        />
      )}

      <Row gutter={[20, 20]}>
        {/* Left: Upload Panel */}
        <Col xs={24} lg={10}>
          <Card title="Rasm yuklash" style={{ borderRadius: 12 }}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Bemor:</Text>
              <Select
                showSearch
                optionFilterProp="children"
                placeholder={t("ai.selectPatient")}
                style={{ width: "100%", marginTop: 8 }}
                value={patientId}
                onChange={setPatientId}
              >
                {patients?.map((p: any) => (
                  <Select.Option key={p.id} value={p.id}>{p.full_name} ({p.patient_code})</Select.Option>
                ))}
              </Select>
            </div>

            <Dragger
              accept="image/jpeg,image/png,image/bmp"
              fileList={fileList}
              beforeUpload={(file) => {
                setFileList([{ ...file, originFileObj: file }]);
                const url = URL.createObjectURL(file);
                setPreviewUrl(url);
                return false;
              }}
              onRemove={() => { setFileList([]); setPreviewUrl(""); }}
              style={{ marginBottom: 16 }}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="preview" style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 8, objectFit: "contain" }} />
              ) : (
                <div>
                  <p className="ant-upload-drag-icon"><InboxOutlined style={{ fontSize: 40, color: "#1890FF" }} /></p>
                  <p style={{ fontWeight: 500 }}>{t("ai.uploadImage")}</p>
                  <p style={{ color: "#888", fontSize: 12 }}>{t("ai.uploadHint")}</p>
                </div>
              )}
            </Dragger>

            <Button
              type="primary"
              block
              size="large"
              icon={<RobotOutlined />}
              loading={uploadAndAnalyze.isPending}
              disabled={!patientId || fileList.length === 0}
              onClick={() => uploadAndAnalyze.mutate()}
              style={{ borderRadius: 8 }}
            >
              {uploadAndAnalyze.isPending ? t("ai.analyzing") : t("ai.analyze")}
            </Button>
          </Card>
        </Col>

        {/* Right: Results Panel */}
        <Col xs={24} lg={14}>
          {uploadAndAnalyze.isPending && (
            <Card style={{ borderRadius: 12, textAlign: "center", padding: "40px 0" }}>
              <Spin size="large" />
              <div style={{ marginTop: 16, color: "#888" }}>{t("ai.analyzing")}</div>
            </Card>
          )}

          {result && riskCfg && (
            <Card
              title={t("ai.result")}
              style={{ borderRadius: 12, borderTop: `3px solid ${riskCfg.color}` }}
              extra={
                <Tag color={riskCfg.color} style={{ fontSize: 13, padding: "4px 12px" }}>
                  {riskCfg.label}
                </Tag>
              }
            >
              {/* Main Prediction */}
              <div style={{ background: riskCfg.bg, borderRadius: 10, padding: "16px 20px", marginBottom: 20 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: riskCfg.color, marginBottom: 4 }}>
                  {result.predicted_label}
                </div>
                <div style={{ fontSize: 13, color: "#555", marginBottom: 8 }}>
                  {t("ai.icd10")}: <strong>{(result as any).icd10 || "—"}</strong>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 12 }}>{t("ai.confidence")}: </Text>
                  <Progress
                    percent={Math.round(result.confidence * 100)}
                    strokeColor={riskCfg.color}
                    size="small"
                    style={{ maxWidth: 200, display: "inline-block", verticalAlign: "middle", marginLeft: 8 }}
                  />
                  <Text strong style={{ color: riskCfg.color, marginLeft: 8 }}>{(result.confidence * 100).toFixed(1)}%</Text>
                </div>
                {(result as any).description_uz && (
                  <Alert message={(result as any).description_uz} type={result.risk_level === "low" ? "info" : "warning"} showIcon />
                )}
              </div>

              {/* All Class Probabilities */}
              <Divider orientation="left" plain style={{ fontSize: 13 }}>{t("ai.allProbs")}</Divider>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(result.all_probabilities)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cls, prob]) => (
                    <div key={cls}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <Text style={{ fontSize: 12, fontWeight: cls === result.predicted_class ? 700 : 400 }}>
                          {t(`ai.classes.${cls}`, { defaultValue: cls.toUpperCase() })}
                        </Text>
                        <Text style={{ fontSize: 12, color: CLASS_COLORS[cls] }}>{(prob * 100).toFixed(1)}%</Text>
                      </div>
                      <div className="confidence-bar">
                        <div className="confidence-fill" style={{ width: `${prob * 100}%`, background: CLASS_COLORS[cls] || "#1890FF" }} />
                      </div>
                    </div>
                  ))}
              </div>

              {/* Doctor Review */}
              <Divider />
              <div>
                <Text strong style={{ display: "block", marginBottom: 8 }}>Doktor baholashi:</Text>

                {reviewed ? (
                  <div>
                    <Alert
                      type={reviewed.agreement ? "success" : "error"}
                      showIcon
                      icon={reviewed.agreement ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                      message={reviewed.agreement ? "✓ Natija tasdiqlandi" : "✗ Natija rad etildi"}
                      description={reviewed.notes ? `Izoh: ${reviewed.notes}` : undefined}
                      style={{ borderRadius: 8, marginBottom: 12 }}
                      action={
                        <Button size="small" onClick={() => setReviewed(null)}>
                          O'zgartirish
                        </Button>
                      }
                    />
                    <Button
                      type="primary"
                      block
                      onClick={() => router.push(`/patients/${patientId}?tab=ai`)}
                      style={{ borderRadius: 8 }}
                    >
                      Bemorning barcha AI tahlillarini ko'rish →
                    </Button>
                  </div>
                ) : (
                  <>
                    <Input.TextArea
                      rows={2}
                      placeholder={t("ai.doctorNotes")}
                      value={doctorNotes}
                      onChange={(e) => setDoctorNotes(e.target.value)}
                      style={{ marginBottom: 12 }}
                    />
                    <Space>
                      <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={() => reviewMutation.mutate({ agreement: true })}
                        loading={reviewMutation.isPending}
                        style={{ background: "#52c41a", borderColor: "#52c41a" }}
                      >
                        {t("ai.agreeBtn")}
                      </Button>
                      <Button
                        danger
                        icon={<CloseCircleOutlined />}
                        onClick={() => reviewMutation.mutate({ agreement: false })}
                        loading={reviewMutation.isPending}
                      >
                        {t("ai.disagreeBtn")}
                      </Button>
                    </Space>
                  </>
                )}
              </div>
            </Card>
          )}

          {!result && !uploadAndAnalyze.isPending && (
            <Card style={{ borderRadius: 12, textAlign: "center", padding: "60px 0", color: "#bbb" }}>
              <RobotOutlined style={{ fontSize: 60 }} />
              <div style={{ marginTop: 16, fontSize: 14 }}>Rasm yuklang va tahlil qiling</div>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}

// Need Input for review textarea
import { Input } from "antd";

export default function AIAnalysisPage() {
  return <Suspense><AIAnalysisContent /></Suspense>;
}
