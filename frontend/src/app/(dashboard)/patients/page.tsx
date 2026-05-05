"use client";
import { useState } from "react";
import { Table, Button, Input, Space, Tag, Typography, Popconfirm, Tooltip, Card, Select, Row, Col } from "antd";
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { patientsApi } from "@/lib/api";
import type { Patient } from "@/types";

const { Title } = Typography;

const UZBEK_REGIONS = ["Toshkent", "Samarqand", "Buxoro", "Namangan", "Andijon", "Farg'ona", "Xorazm", "Qashqadaryo", "Surxondaryo", "Jizzax", "Sirdaryo", "Navoiy", "Qoraqalpog'iston"];

export default function PatientsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState("");
  const [region, setRegion] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["patients", page, search, gender, region],
    queryFn: () => patientsApi.list({ page, limit: 20, search, gender, region }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => patientsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["patients"] }),
  });

  const columns = [
    {
      title: t("patients.code"),
      dataIndex: "patient_code",
      width: 130,
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: t("patients.fullName"),
      dataIndex: "full_name",
      render: (name: string, record: Patient) => (
        <a onClick={() => router.push(`/patients/${record.id}`)} style={{ color: "#1890FF", fontWeight: 500 }}>{name}</a>
      ),
    },
    {
      title: t("patients.birthDate"),
      dataIndex: "birth_date",
      width: 120,
      render: (d: string) => d?.slice(0, 10),
    },
    {
      title: t("patients.age"),
      dataIndex: "age",
      width: 70,
      render: (age: number) => `${age} yosh`,
    },
    {
      title: t("patients.gender"),
      dataIndex: "gender",
      width: 90,
      render: (g: string) => (
        <Tag color={g === "male" ? "geekblue" : "magenta"}>
          {g === "male" ? t("patients.male") : t("patients.female")}
        </Tag>
      ),
    },
    { title: t("patients.phone"), dataIndex: "phone", width: 130 },
    { title: t("patients.region"), dataIndex: "region", width: 120 },
    {
      title: t("patients.actions"),
      width: 120,
      render: (_: any, record: Patient) => (
        <Space>
          <Tooltip title={t("common.view")}>
            <Button size="small" icon={<EyeOutlined />} onClick={() => router.push(`/patients/${record.id}`)} />
          </Tooltip>
          <Tooltip title={t("patients.edit")}>
            <Button size="small" icon={<EditOutlined />} onClick={() => router.push(`/patients/${record.id}/edit`)} />
          </Tooltip>
          <Tooltip title={t("patients.delete")}>
            <Popconfirm title={t("patients.deleteConfirm")} onConfirm={() => deleteMutation.mutate(record.id)} okText={t("common.confirm")} cancelText={t("common.cancel")}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>{t("patients.title")}</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push("/patients/new")}>
          {t("patients.add")}
        </Button>
      </div>

      <Card style={{ borderRadius: 12, marginBottom: 16 }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} md={10}>
            <Input
              prefix={<SearchOutlined />}
              placeholder={t("patients.search")}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6} md={5}>
            <Select placeholder={t("patients.gender")} style={{ width: "100%" }} allowClear onChange={(v) => { setGender(v || ""); setPage(1); }}>
              <Select.Option value="male">{t("patients.male")}</Select.Option>
              <Select.Option value="female">{t("patients.female")}</Select.Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={5}>
            <Select placeholder={t("patients.region")} style={{ width: "100%" }} allowClear onChange={(v) => { setRegion(v || ""); setPage(1); }}>
              {UZBEK_REGIONS.map((r) => <Select.Option key={r} value={r}>{r}</Select.Option>)}
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
          locale={{ emptyText: t("patients.noPatients") }}
          pagination={{
            current: page,
            pageSize: 20,
            total: data?.total || 0,
            onChange: setPage,
            showTotal: (total) => `${t("common.total")}: ${total}`,
            showSizeChanger: false,
          }}
          scroll={{ x: 900 }}
          size="middle"
        />
      </Card>
    </div>
  );
}
