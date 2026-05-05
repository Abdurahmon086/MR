"use client";
import { useEffect } from "react";
import { Card, Form, Input, Button, Select, DatePicker, Row, Col, Typography, message, Spin } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { patientsApi, usersApi } from "@/lib/api";
import dayjs from "dayjs";

const { Title } = Typography;

const UZBEK_REGIONS = [
  "Toshkent", "Samarqand", "Buxoro", "Namangan", "Andijon", "Farg'ona",
  "Xorazm", "Qashqadaryo", "Surxondaryo", "Jizzax", "Sirdaryo", "Navoiy", "Qoraqalpog'iston",
];

export default function EditPatientPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => patientsApi.get(id).then((r) => r.data),
  });

  const { data: doctors } = useQuery({
    queryKey: ["doctors"],
    queryFn: () => usersApi.doctors().then((r) => r.data),
  });

  useEffect(() => {
    if (patient) {
      form.setFieldsValue({
        ...patient,
        birth_date: patient.birth_date ? dayjs(patient.birth_date) : null,
      });
    }
  }, [patient, form]);

  const mutation = useMutation({
    mutationFn: (values: any) =>
      patientsApi.update(id, {
        ...values,
        birth_date: values.birth_date ? values.birth_date.format("YYYY-MM-DD") : undefined,
      }),
    onSuccess: () => {
      message.success(t("patients.saveSuccess"));
      queryClient.invalidateQueries({ queryKey: ["patient", id] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      router.push(`/patients/${id}`);
    },
    onError: () => message.error(t("common.error")),
  });

  if (isLoading) return <div style={{ textAlign: "center", padding: 60 }}><Spin size="large" /></div>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Button onClick={() => router.back()}>← {t("common.back")}</Button>
        <Title level={3} style={{ margin: 0 }}>
          {t("patients.edit")}: {patient?.full_name}
        </Title>
      </div>

      <Card style={{ borderRadius: 12, maxWidth: 900 }}>
        <Form form={form} layout="vertical" onFinish={(v) => mutation.mutate(v)}>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="last_name" label="Familiya" rules={[{ required: true }]}>
                <Input placeholder="Karimov" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="first_name" label="Ismi" rules={[{ required: true }]}>
                <Input placeholder="Ali" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="middle_name" label="Otasining ismi">
                <Input placeholder="Valiyevich" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="birth_date" label={t("patients.birthDate")} rules={[{ required: true }]}>
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD.MM.YYYY"
                  disabledDate={(d) => d.isAfter(dayjs())}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="gender" label={t("patients.gender")} rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="male">{t("patients.male")}</Select.Option>
                  <Select.Option value="female">{t("patients.female")}</Select.Option>
                  <Select.Option value="other">Boshqa</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="blood_type" label="Qon guruhi">
                <Select allowClear>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => (
                    <Select.Option key={b} value={b}>{b}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="phone" label={t("patients.phone")}>
                <Input placeholder="+998901234567" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="email" label="Email">
                <Input placeholder="ali@example.com" type="email" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="region" label={t("patients.region")}>
                <Select showSearch allowClear placeholder="Viloyatni tanlang">
                  {UZBEK_REGIONS.map((r) => (
                    <Select.Option key={r} value={r}>{r}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="district" label="Tuman">
                <Input placeholder="Chilonzor tumani" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="passport_number" label="Pasport seriya raqami">
                <Input placeholder="AB1234567" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="inn" label="INN">
                <Input placeholder="12345678901234" maxLength={14} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="address" label="Manzil">
                <Input.TextArea rows={2} placeholder="To'liq manzil" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="assigned_doctor_id" label={t("patients.assignedDoctor")}>
                <Select allowClear showSearch optionFilterProp="children" placeholder="Shifokorni tanlang">
                  {doctors?.map((d: any) => (
                    <Select.Option key={d.id} value={d.id}>{d.full_name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="notes" label={t("patients.notes")}>
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <Button onClick={() => router.back()}>{t("common.cancel")}</Button>
            <Button type="primary" htmlType="submit" loading={mutation.isPending}>
              {t("common.save")}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
