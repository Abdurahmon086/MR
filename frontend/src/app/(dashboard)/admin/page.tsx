"use client";
import { Card, Typography, Table, Tag, Button, Modal, Form, Input, Select, Popconfirm, message } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { usersApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import type { User } from "@/types";

const { Title } = Typography;
const ROLE_COLORS: Record<string, string> = { admin: "red", doctor: "blue", nurse: "green", patient: "default" };

export default function AdminPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  if (user?.role !== "admin") {
    router.push("/dashboard");
    return null;
  }

  const { data: users, isLoading } = useQuery({ queryKey: ["users"], queryFn: () => usersApi.list().then((r) => r.data) });

  const createMutation = useMutation({
    mutationFn: (v: any) => usersApi.create(v),
    onSuccess: () => { message.success(t("common.success")); queryClient.invalidateQueries({ queryKey: ["users"] }); setOpen(false); form.resetFields(); },
    onError: () => message.error(t("common.error")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => { message.success(t("common.success")); queryClient.invalidateQueries({ queryKey: ["users"] }); },
  });

  const columns = [
    { title: "F.I.O.", dataIndex: "full_name", render: (n: string) => <strong>{n}</strong> },
    { title: "Email", dataIndex: "email" },
    { title: t("admin.role"), dataIndex: "role", render: (r: string) => <Tag color={ROLE_COLORS[r]}>{t(`admin.${r}`, { defaultValue: r })}</Tag> },
    { title: "Mutaxassislik", dataIndex: "specialty", render: (s: string) => s || "—" },
    { title: "Holat", dataIndex: "is_active", render: (a: boolean) => <Tag color={a ? "green" : "red"}>{a ? "Faol" : "Nofaol"}</Tag> },
    {
      title: "Amal",
      render: (_: any, record: User) => record.id !== user?.id ? (
        <Popconfirm title="O'chirilsinmi?" onConfirm={() => deleteMutation.mutate(record.id)}>
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ) : null,
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>{t("admin.users")}</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>{t("admin.addUser")}</Button>
      </div>

      <Card style={{ borderRadius: 12 }}>
        <Table columns={columns} dataSource={users || []} rowKey="id" loading={isLoading} size="middle" />
      </Card>

      <Modal title={t("admin.addUser")} open={open} onCancel={() => setOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={(v) => createMutation.mutate(v)}>
          <Form.Item name="last_name" label="Familiya" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="first_name" label="Ismi" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}><Input /></Form.Item>
          <Form.Item name="password" label="Parol" rules={[{ required: true, min: 8 }]}><Input.Password /></Form.Item>
          <Form.Item name="role" label={t("admin.role")} rules={[{ required: true }]}>
            <Select>
              <Select.Option value="doctor">{t("admin.doctor")}</Select.Option>
              <Select.Option value="nurse">{t("admin.nurse")}</Select.Option>
              <Select.Option value="admin">{t("admin.admin")}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="specialty" label="Mutaxassislik"><Input /></Form.Item>
          <Button type="primary" htmlType="submit" block loading={createMutation.isPending}>{t("common.save")}</Button>
        </Form>
      </Modal>
    </div>
  );
}
