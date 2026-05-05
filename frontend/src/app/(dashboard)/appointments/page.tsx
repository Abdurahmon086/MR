"use client";
import { Card, Typography, Table, Tag, Button, Modal, Form, Select, DatePicker, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { appointmentsApi, patientsApi, usersApi } from "@/lib/api";
import dayjs from "dayjs";

const { Title } = Typography;
const STATUS_COLORS: Record<string, string> = { scheduled: "blue", confirmed: "green", completed: "default", cancelled: "red", no_show: "orange" };

export default function AppointmentsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: appts, isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => appointmentsApi.list().then((r) => r.data),
  });
  const { data: patients } = useQuery({ queryKey: ["patients-select"], queryFn: () => patientsApi.list({ limit: 100 }).then((r) => r.data.items) });
  const { data: doctors } = useQuery({ queryKey: ["doctors"], queryFn: () => usersApi.doctors().then((r) => r.data) });

  const createMutation = useMutation({
    mutationFn: (values: any) => appointmentsApi.create({ ...values, scheduled_at: values.scheduled_at?.toISOString() }),
    onSuccess: () => { message.success(t("common.success")); queryClient.invalidateQueries({ queryKey: ["appointments"] }); setOpen(false); form.resetFields(); },
    onError: () => message.error(t("common.error")),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: any) => appointmentsApi.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });

  const columns = [
    { title: "Sana/Vaqt", dataIndex: "scheduled_at", render: (d: string) => dayjs(d).format("DD.MM.YYYY HH:mm") },
    { title: "Davomiyligi", dataIndex: "duration_mins", render: (d: number) => `${d} daqiqa` },
    { title: "Tur", dataIndex: "type", render: (t: string) => <Tag>{t}</Tag> },
    { title: "Holat", dataIndex: "status", render: (s: string) => <Tag color={STATUS_COLORS[s]}>{t(`appointments.${s}`)}</Tag> },
    {
      title: "Amal",
      render: (_: any, r: any) => r.status === "scheduled" ? (
        <Button size="small" type="link" onClick={() => statusMutation.mutate({ id: r.id, status: "confirmed" })}>Tasdiqlash</Button>
      ) : null,
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>{t("appointments.title")}</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>{t("appointments.add")}</Button>
      </div>

      <Card style={{ borderRadius: 12 }}>
        <Table columns={columns} dataSource={appts || []} rowKey="id" loading={isLoading} size="middle" pagination={{ pageSize: 20 }} />
      </Card>

      <Modal title={t("appointments.add")} open={open} onCancel={() => setOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={(v) => createMutation.mutate(v)}>
          <Form.Item name="patient_id" label="Bemor" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="children" placeholder="Bemorni tanlang">
              {patients?.map((p: any) => <Select.Option key={p.id} value={p.id}>{p.full_name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="doctor_id" label="Shifokor" rules={[{ required: true }]}>
            <Select>{doctors?.map((d: any) => <Select.Option key={d.id} value={d.id}>{d.full_name}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item name="scheduled_at" label="Sana va vaqt" rules={[{ required: true }]}>
            <DatePicker showTime format="DD.MM.YYYY HH:mm" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="type" label="Tur" initialValue="initial">
            <Select>
              <Select.Option value="initial">Dastlabki</Select.Option>
              <Select.Option value="follow_up">Takroriy</Select.Option>
              <Select.Option value="procedure">Protsedura</Select.Option>
            </Select>
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={createMutation.isPending}>{t("common.save")}</Button>
        </Form>
      </Modal>
    </div>
  );
}
