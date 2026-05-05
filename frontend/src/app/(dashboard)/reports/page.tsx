"use client";
import { useState } from "react";
import { Card, Button, Select, Typography, Table, Tag, Space, Row, Col, DatePicker, message } from "antd";
import { FilePdfOutlined, DownloadOutlined, PlusOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { reportsApi, patientsApi } from "@/lib/api";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const STATUS_COLORS: Record<string, string> = {
  pending: "default", generating: "processing", ready: "success", failed: "error",
};

export default function ReportsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [reportType, setReportType] = useState("patient_summary");
  const [patientId, setPatientId] = useState<string | undefined>();

  const { data: reports, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: () => reportsApi.list().then((r) => r.data),
    refetchInterval: 5000,
  });

  const { data: patients } = useQuery({
    queryKey: ["patients-select"],
    queryFn: () => patientsApi.list({ limit: 100 }).then((r) => r.data.items),
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      reportsApi.generate({
        report_type: reportType,
        title: reportType === "patient_summary" ? "Bemor xulosasi" : "Statistika hisoboti",
        patient_id: patientId,
      }),
    onSuccess: () => {
      message.success("Hisobot yaratilmoqda...");
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: () => message.error(t("common.error")),
  });

  const columns = [
    { title: "Sarlavha", dataIndex: "title" },
    { title: "Tur", dataIndex: "report_type", render: (t: string) => <Tag>{t}</Tag> },
    {
      title: "Holat",
      dataIndex: "status",
      render: (s: string) => <Tag color={STATUS_COLORS[s]}>{t(`reports.${s}`)}</Tag>,
    },
    {
      title: "Sana",
      dataIndex: "created_at",
      render: (d: string) => new Date(d).toLocaleString("uz"),
    },
    {
      title: "Amal",
      render: (_: any, record: any) =>
        record.status === "ready" ? (
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => reportsApi.download(record.id, `hisobot_${record.id}.pdf`).catch(() => message.error("Yuklab olishda xatolik"))}
          >
            {t("reports.download")}
          </Button>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.status === "generating" ? "Kutilmoqda..." : "—"}
          </Text>
        ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>{t("reports.title")}</Title>

      <Card title={t("reports.generate")} style={{ borderRadius: 12, marginBottom: 20 }}>
        <Row gutter={[12, 12]} align="bottom">
          <Col xs={24} md={8}>
            <div>
              <Text strong style={{ display: "block", marginBottom: 4 }}>{t("reports.type")}</Text>
              <Select value={reportType} onChange={setReportType} style={{ width: "100%" }}>
                <Select.Option value="patient_summary">
                  <FilePdfOutlined style={{ marginRight: 8 }} />{t("reports.patientSummary")}
                </Select.Option>
                <Select.Option value="statistics">{t("reports.statistics")}</Select.Option>
              </Select>
            </div>
          </Col>
          {reportType === "patient_summary" && (
            <Col xs={24} md={8}>
              <div>
                <Text strong style={{ display: "block", marginBottom: 4 }}>{t("reports.selectPatient")}</Text>
                <Select
                  showSearch
                  optionFilterProp="children"
                  placeholder="Bemorni tanlang"
                  style={{ width: "100%" }}
                  allowClear
                  onChange={setPatientId}
                >
                  {patients?.map((p: any) => (
                    <Select.Option key={p.id} value={p.id}>{p.full_name} ({p.patient_code})</Select.Option>
                  ))}
                </Select>
              </div>
            </Col>
          )}
          <Col xs={24} md={4}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => generateMutation.mutate()}
              loading={generateMutation.isPending}
              disabled={reportType === "patient_summary" && !patientId}
              block
            >
              {t("reports.generate")}
            </Button>
          </Col>
        </Row>
      </Card>

      <Card style={{ borderRadius: 12 }}>
        <Table
          columns={columns}
          dataSource={reports || []}
          rowKey="id"
          loading={isLoading}
          size="middle"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
