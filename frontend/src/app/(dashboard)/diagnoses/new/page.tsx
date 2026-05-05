"use client";
import { Card, Form, Input, Button, Select, DatePicker, Row, Col, Typography, Switch, message } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useRouter, useSearchParams } from "next/navigation";
import { diagnosesApi, patientsApi } from "@/lib/api";
import { Suspense } from "react";

const { Title } = Typography;
const { TextArea } = Input;

const ICD10_DERM = [
  { code: "L20", name: "Atopik dermatit" }, { code: "L40", name: "Psoriaz" },
  { code: "L30.0", name: "Ekzema" }, { code: "L50", name: "Urtikáriya" },
  { code: "L70.0", name: "Akné vulgaris" }, { code: "L21", name: "Seborey dermatiti" },
  { code: "B35", name: "Qo'ziqorin kasalligi" }, { code: "C43", name: "Melanoma" },
  { code: "C44", name: "Bazal hujayra karsinomasi" }, { code: "D22", name: "Melanositar nevus" },
  { code: "D23", name: "Dermatofibroma" }, { code: "L57.0", name: "Aktinik keratoz" },
];

function NewDiagnosisForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patient_id");
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const { data: patients } = useQuery({
    queryKey: ["patients-list"],
    queryFn: () => patientsApi.list({ limit: 100 }).then((r) => r.data.items),
  });

  const mutation = useMutation({
    mutationFn: (values: any) => {
      const icd = ICD10_DERM.find((i) => i.code === values.icd10_code);
      return diagnosesApi.create({
        ...values,
        visit_date: values.visit_date?.format("YYYY-MM-DD"),
        follow_up_date: values.follow_up_date?.format("YYYY-MM-DD"),
        icd10_name: icd?.name,
      });
    },
    onSuccess: () => {
      message.success(t("common.success"));
      queryClient.invalidateQueries({ queryKey: ["diagnoses"] });
      router.push("/diagnoses");
    },
    onError: () => message.error(t("common.error")),
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Button onClick={() => router.back()}>← {t("common.back")}</Button>
        <Title level={3} style={{ margin: 0 }}>{t("diagnoses.add")}</Title>
      </div>
      <Card style={{ borderRadius: 12, maxWidth: 900 }}>
        <Form form={form} layout="vertical" onFinish={(v) => mutation.mutate(v)} initialValues={{ patient_id: patientId, is_ai_assisted: false }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="patient_id" label="Bemor" rules={[{ required: true }]}>
                <Select showSearch optionFilterProp="children" placeholder="Bemorni tanlang">
                  {patients?.map((p: any) => <Select.Option key={p.id} value={p.id}>{p.full_name} ({p.patient_code})</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="visit_date" label={t("diagnoses.visitDate")} rules={[{ required: true }]}>
                <DatePicker style={{ width: "100%" }} format="DD.MM.YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="follow_up_date" label={t("diagnoses.followUp")}>
                <DatePicker style={{ width: "100%" }} format="DD.MM.YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="chief_complaint" label={t("diagnoses.complaint")} rules={[{ required: true }]}>
                <TextArea rows={2} placeholder="Bemorning asosiy shikoyati..." />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="anamnesis" label="Anamnez (kasallik tarixi)">
                <TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="objective_data" label="Obyektiv ma'lumotlar (tekshiruv natijalari)">
                <TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="diagnosis_text" label={t("diagnoses.diagnosisText")} rules={[{ required: true }]}>
                <TextArea rows={2} placeholder="To'liq tashxis matni..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="icd10_code" label={t("diagnoses.icd10")}>
                <Select allowClear showSearch placeholder="ICD-10 kodni tanlang">
                  {ICD10_DERM.map((i) => <Select.Option key={i.code} value={i.code}>{i.code} — {i.name}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="severity" label={t("diagnoses.severity")}>
                <Select allowClear>
                  {["mild","moderate","severe","critical"].map((s) => <Select.Option key={s} value={s}>{t(`diagnoses.${s}`)}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="status" label={t("diagnoses.status")} initialValue="initial">
                <Select>
                  {["initial","confirmed","revised","closed"].map((s) => <Select.Option key={s} value={s}>{t(`diagnoses.${s}`)}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="is_ai_assisted" label={t("diagnoses.aiAssisted")} valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="treatment_plan" label={t("diagnoses.treatment")}>
                <TextArea rows={3} />
              </Form.Item>
            </Col>
          </Row>
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <Button onClick={() => router.back()}>{t("common.cancel")}</Button>
            <Button type="primary" htmlType="submit" loading={mutation.isPending}>{t("common.save")}</Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}

export default function NewDiagnosisPage() {
  return <Suspense><NewDiagnosisForm /></Suspense>;
}
