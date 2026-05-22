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

const SPECIALTIES: Record<string, string[]> = {
  doctor: [
    "Dermatolog", "Terapevt", "Xirurg", "Kardiolog", "Nevropatolog",
    "Endokrinolog", "Ginekolog", "Pediatr", "Oftalmolog", "Ortoped",
    "Onkolog", "Urolog", "Psixiatr", "Revmatolog", "Pulmonolog",
  ],
  nurse: [
    "Meditsina hamshirasi", "Jarrohlik hamshirasi", "Pediatriya hamshirasi",
    "Reanimatologiya hamshirasi", "Operatsion hamshira", "Qabul bo'limi hamshirasi",
  ],
  admin: [],
};

export default function AdminPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [form] = Form.useForm();

  if (user?.role !== "admin") {
    router.push("/dashboard");
    return null;
  }

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.list().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (v: any) => usersApi.create(v),
    onSuccess: () => {
      message.success("Foydalanuvchi qo'shildi");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
      form.resetFields();
      setSelectedRole("");
    },
    onError: (err: any) => message.error(err.response?.data?.detail || t("common.error")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      message.success("Foydalanuvchi o'chirildi");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => message.error(t("common.error")),
  });

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    form.setFieldValue("specialty", undefined);
  };

  const handleCancel = () => {
    setOpen(false);
    form.resetFields();
    setSelectedRole("");
  };

  const columns = [
    { title: "F.I.O.", dataIndex: "full_name", render: (n: string) => <strong>{n}</strong> },
    { title: "Email", dataIndex: "email" },
    {
      title: t("admin.role"),
      dataIndex: "role",
      render: (r: string) => <Tag color={ROLE_COLORS[r]}>{t(`admin.${r}`, { defaultValue: r })}</Tag>,
    },
    { title: "Mutaxassislik", dataIndex: "specialty", render: (s: string) => s || "—" },
    {
      title: "Holat",
      dataIndex: "is_active",
      render: (a: boolean) => <Tag color={a ? "green" : "red"}>{a ? "Faol" : "Nofaol"}</Tag>,
    },
    {
      title: "Amal",
      render: (_: any, record: User) =>
        record.id !== user?.id ? (
          <Popconfirm
            title="O'chirilsinmi?"
            description="Bu foydalanuvchi butunlay o'chiriladi!"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Ha"
            cancelText="Yo'q"
            okButtonProps={{ danger: true }}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={deleteMutation.isPending}
            />
          </Popconfirm>
        ) : null,
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>{t("admin.users")}</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          {t("admin.addUser")}
        </Button>
      </div>

      <Card style={{ borderRadius: 12 }}>
        <Table columns={columns} dataSource={users || []} rowKey="id" loading={isLoading} size="middle" />
      </Card>

      <Modal title={t("admin.addUser")} open={open} onCancel={handleCancel} footer={null} width={480}>
        <Form form={form} layout="vertical" onFinish={(v) => createMutation.mutate(v)} style={{ marginTop: 16 }}>
          <Form.Item name="last_name" label="Familiya" rules={[{ required: true, message: "Familiya kiriting" }]}>
            <Input placeholder="Karimov" />
          </Form.Item>
          <Form.Item name="first_name" label="Ismi" rules={[{ required: true, message: "Ism kiriting" }]}>
            <Input placeholder="Sardor" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email", message: "To'g'ri email kiriting" }]}>
            <Input placeholder="sardor@derm.uz" />
          </Form.Item>
          <Form.Item name="password" label="Parol" rules={[{ required: true, min: 8, message: "Kamida 8 ta belgi" }]}>
            <Input.Password placeholder="Kamida 8 ta belgi" />
          </Form.Item>

          <Form.Item name="role" label="Rol" rules={[{ required: true, message: "Rol tanlang" }]}>
            <Select placeholder="Rol tanlang" onChange={handleRoleChange}>
              <Select.Option value="doctor">Shifokor</Select.Option>
              <Select.Option value="nurse">Hamshira</Select.Option>
              <Select.Option value="admin">Admin</Select.Option>
            </Select>
          </Form.Item>

          {selectedRole && selectedRole !== "admin" && (
            <Form.Item
              name="specialty"
              label="Mutaxassislik"
              rules={[{ required: true, message: "Mutaxassislik tanlang" }]}
            >
              <Select placeholder="Mutaxassislikni tanlang" showSearch optionFilterProp="children">
                {SPECIALTIES[selectedRole]?.map((s) => (
                  <Select.Option key={s} value={s}>{s}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item name="phone" label="Telefon">
            <Input placeholder="+998 90 123 45 67" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block loading={createMutation.isPending} style={{ marginTop: 8 }}>
            {t("common.save")}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
