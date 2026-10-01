import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, PlusCircle, RotateCcw, X } from "lucide-react";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type DefaultValues,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useEnrollmentStore } from "@/lib/enrollment-store";
import {
  createCourseFormSchema,
  DESCRIPTION_MAX,
  MAX_INSTRUCTORS,
  type CourseFormValues,
} from "@/lib/schemas/course-schema";

const programOptions = [
  { value: "CPE", label: "CPE — วิศวกรรมคอมพิวเตอร์" },
  { value: "ISNE", label: "ISNE — วิศวกรรมระบบสารสนเทศและเครือข่าย" },
];

const semesterOptions = [
  { value: "1", label: "ภาคการศึกษาที่ 1" },
  { value: "2", label: "ภาคการศึกษาที่ 2" },
  { value: "3", label: "ภาคฤดูร้อน" },
];

const emptyCourseForm: DefaultValues<CourseFormValues> = {
  courseId: "",
  courseTitle: "",
  program: undefined,
  semester: undefined,
  description: "",
  notifyByEmail: false,
  instructors: [{ name: "", email: "" }],
};

export function AddNewCourseDialog() {
  const addCourse = useEnrollmentStore((s) => s.addCourse);
  const courses = useEnrollmentStore((s) => s.courses);
  const [open, setOpen] = useState(false);
  
  const schema = useMemo(() => createCourseFormSchema(courses), [courses]);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyCourseForm,
    mode: "onBlur",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "instructors",
  });

  // ตัวนับตัวอักษรเปลี่ยนตามการพิมพ์
  const descriptionValue = useWatch({ control: form.control, name: "description" });
  const descriptionTooLong = descriptionValue.length > DESCRIPTION_MAX;

  const instructorsError =
    form.formState.errors.instructors?.root ?? form.formState.errors.instructors;

  // กฎ "อีเมลซ้ำ" อยู่ระดับทั้ง array — mode onBlur จะตรวจเฉพาะช่องที่เพิ่งออก
  // จึงสั่งตรวจ instructors ทั้งชุดเองเมื่อมีอีเมลซ้ำ (หรือมี error นี้ค้างอยู่ เพื่อให้หายเมื่อแก้แล้ว)
  const revalidateDuplicateEmails = () => {
    const emails = form
      .getValues("instructors")
      .map((i) => i.email.trim().toLowerCase())
      .filter(Boolean);
    const hasDuplicate = new Set(emails).size !== emails.length;
    if (hasDuplicate || form.formState.errors.instructors?.root) {
      void form.trigger("instructors");
    }
  };

  const resetForm = () => form.reset(emptyCourseForm);

  function onSubmit(values: CourseFormValues) {
    addCourse(values);
    resetForm();
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger render={<Button />}>
        <PlusCircle className="h-4 w-4" />
        เพิ่มวิชา
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="grid gap-4"
        >
          <DialogHeader>
            <DialogTitle>เพิ่มวิชาใหม่</DialogTitle>
            <DialogDescription>
              ลองใส่รหัสวิชาไม่ครบ 6 หลัก ใส่รหัสที่มีอยู่แล้ว
              ใส่อีเมลผู้สอนที่ไม่ใช่ @cmu.ac.th หรือพิมพ์รายละเอียดเกิน 100
              ตัวอักษร แล้วกดบันทึก
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_2.5fr]">
              <Controller
                name="courseId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="courseId">รหัสวิชา</FieldLabel>
                    <Input
                      {...field}
                      id="courseId"
                      placeholder="เช่น 261305"
                      inputMode="numeric"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="courseTitle"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="courseTitle">ชื่อวิชา</FieldLabel>
                    <Input
                      {...field}
                      id="courseTitle"
                      placeholder="เช่น Mobile Application Development"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <Controller
              name="program"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="program">หลักสูตร</FieldLabel>
                  <Select
                    name={field.name}
                    items={programOptions}
                    value={field.value ?? null}
                    onValueChange={(v) => {
                      field.onChange(v);
                      field.onBlur();
                    }}
                  >
                    <SelectTrigger
                      id="program"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                      ref={field.ref}
                    >
                      <SelectValue placeholder="เลือกหลักสูตร" />
                    </SelectTrigger>
                    <SelectContent>
                      {programOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="semester"
              control={form.control}
              render={({ field, fieldState }) => (
                <FieldSet data-invalid={fieldState.invalid}>
                  <FieldLegend variant="label">ภาคการศึกษา</FieldLegend>
                  <RadioGroup
                    name={field.name}
                    value={field.value ?? null}
                    onValueChange={(v) => {
                      field.onChange(v);
                      field.onBlur();
                    }}
                    className="flex flex-wrap gap-4"
                  >
                    {semesterOptions.map((o) => (
                      <Field
                        key={o.value}
                        orientation="horizontal"
                        data-invalid={fieldState.invalid}
                        className="w-fit"
                      >
                        <RadioGroupItem
                          id={`semester-${o.value}`}
                          value={o.value}
                          aria-invalid={fieldState.invalid}
                        />
                        <FieldLabel
                          htmlFor={`semester-${o.value}`}
                        >
                          {o.label}
                        </FieldLabel>
                      </Field>
                    ))}
                  </RadioGroup>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </FieldSet>
              )}
            />

            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="description">
                    รายละเอียด (ไม่บังคับ)
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="description"
                    rows={3}
                    placeholder="คำอธิบายรายวิชาสั้นๆ"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription
                    className={descriptionTooLong ? "text-destructive" : undefined}
                  >
                    {descriptionValue.length}/{DESCRIPTION_MAX} ตัวอักษร
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <FieldSet data-invalid={!!instructorsError?.message}>
              <FieldLegend variant="label">ผู้สอน</FieldLegend>
              <FieldDescription>
                {fields.length}/{MAX_INSTRUCTORS} คน — กรอกชื่อผู้สอน และอีเมล
                name@cmu.ac.th (ห้ามซ้ำกัน)
              </FieldDescription>

              <FieldGroup className="gap-3">
                {fields.map((item, index) => (
                  <div key={item.id} className="flex items-start gap-2">
                    <span className="mt-1.5 w-5 shrink-0 text-sm text-muted-foreground">
                      {index + 1}.
                    </span>
                    <Controller
                      name={`instructors.${index}.name`}
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid} className="flex-1">
                          <FieldContent>
                            <Input
                              {...field}
                              autoComplete="off"
                              placeholder="ชื่อผู้สอน"
                              aria-label={`ชื่อผู้สอนคนที่ ${index + 1}`}
                              aria-invalid={fieldState.invalid}
                            />
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </FieldContent>
                        </Field>
                      )}
                    />
                    <Controller
                      name={`instructors.${index}.email`}
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid} className="flex-1">
                          <FieldContent>
                            <Input
                              {...field}
                              onBlur={() => {
                                field.onBlur();
                                revalidateDuplicateEmails();
                              }}
                              autoComplete="off"
                              type="email"
                              placeholder="name@cmu.ac.th"
                              aria-label={`อีเมลผู้สอนคนที่ ${index + 1}`}
                              aria-invalid={fieldState.invalid}
                            />
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </FieldContent>
                        </Field>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`ลบผู้สอนคนที่ ${index + 1}`}
                      disabled={fields.length <= 1}
                      onClick={() => {
                        remove(index);
                        revalidateDuplicateEmails();
                      }}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </FieldGroup>

              {instructorsError?.message && (
                <FieldError errors={[instructorsError]} />
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                disabled={fields.length >= MAX_INSTRUCTORS}
                onClick={() => append({ name: "", email: "" })}
              >
                <Plus className="size-4" />
                เพิ่มผู้สอน
              </Button>
            </FieldSet>

            <Controller
              name="notifyByEmail"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal" className="rounded-lg border p-3">
                  <FieldContent>
                    <FieldLabel htmlFor="notifyByEmail">
                      รับข่าวสารทางอีเมล
                    </FieldLabel>
                    <FieldDescription>
                      แจ้งเตือนผู้สอนเมื่อเปิดลงทะเบียน
                    </FieldDescription>
                  </FieldContent>
                  <Switch
                    id="notifyByEmail"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            {/* form.reset() กลับค่าเริ่มต้น + ล้าง error โดยไม่ปิด dialog */}
            <Button type="button" variant="outline" onClick={resetForm}>
              <RotateCcw className="size-4" />
              ล้างฟอร์ม
            </Button>
            <Button type="submit">บันทึก</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
