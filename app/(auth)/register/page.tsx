"use client";

import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  ShieldCheck,
  BarChart3,
  Layers,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { register, RegisterValues } from "@/hooks/auth";

const TITLES = ["Mr", "Mrs", "Miss", "Dr", "Prof"] as const;

const validationSchema = Yup.object({
  title: Yup.string()
    .oneOf(TITLES as unknown as string[], "Select a title")
    .required("Title is required"),
  first_name: Yup.string()
    .min(2, "At least 2 characters")
    .required("First name is required"),
  last_name: Yup.string()
    .min(2, "At least 2 characters")
    .required("Surname is required"),
  other_name: Yup.string(),
  email: Yup.string()
    .email("Enter a valid email address")
    .required("Email is required"),
  phone: Yup.string()
    .matches(/^\+?[0-9\s\-()]{7,15}$/, "Enter a valid phone number")
    .optional(),
  password: Yup.string()
    .min(8, "At least 8 characters")
    .matches(/[A-Z]/, "Must include at least one uppercase letter")
    .matches(/[0-9]/, "Must include at least one number")
    .required("Password is required"),
});

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);

  const formik = useFormik<RegisterValues>({
    initialValues: {
      title: "",
      first_name: "",
      last_name: "",
      other_name: "",
      email: "",
      phone: "",
      password: "",
    },
    validationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      try {
        await register(values);
        router.push("/dashboard");
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Something went wrong.";
        setStatus(message);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const fieldProps = (name: keyof RegisterValues) => ({
    id: name,
    name,
    value: formik.values[name],
    onChange: formik.handleChange,
    onBlur: formik.handleBlur,
  });

  const hasError = (name: keyof RegisterValues) =>
    !!(formik.touched[name] && formik.errors[name]);

  const ErrorMsg = ({ name }: { name: keyof RegisterValues }) =>
    formik.touched[name] && formik.errors[name] ? (
      <p className="mt-1 text-[0.72rem] text-destructive font-medium">
        {formik.errors[name]}
      </p>
    ) : null;

  const inputCls = (name: keyof RegisterValues) =>
    hasError(name)
      ? "border-destructive focus-visible:ring-destructive/30"
      : "";

  const stats = [
    { value: "$4.2B", label: "Assets Under Management" },
    { value: "18K+", label: "Active Portfolios" },
    { value: "99.9%", label: "Platform Uptime" },
  ];

  return (
    <main className="relative min-h-dvh overflow-hidden bg-background">
      {/* Ambient background — matches home page */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div className="absolute -left-20 -top-32 h-150 w-150 rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-0 right-[5%] h-100 w-100 rounded-full bg-primary/6 blur-[80px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(#000 1px,transparent 1px),linear-gradient(90deg,#000 1px,transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse 80% 80% at 50% 50%,black 40%,transparent 100%)",
          }}
        />
      </div>

      {/* Two-column shell */}
      <div className="relative z-10 grid min-h-dvh lg:grid-cols-2">
        {/* LEFT — Brand panel */}
        <section className="hidden lg:flex flex-col justify-center gap-8 px-8 py-16 md:px-14 lg:py-24">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Image
              src="/casalavoroLogon.png"
              width={150}
              height={150}
              alt="logo"
            />
          </div>

          {/* Accent rule */}
          <div className="h-0.5 w-12 -mt-20 rounded-full bg-linear-to-r from-primary to-transparent" />

          {/* Hero copy */}
          <div className="flex flex-col gap-4">
            <Badge
              variant="outline"
              className="w-fit border-primary/30 bg-accent text-primary text-[0.67rem] font-medium tracking-widest uppercase"
            >
              Institutional-Grade Portfolio Management
            </Badge>

            <h1
              data-display="true"
              className="font-display text-5xl font-semibold leading-[1.07] tracking-tight text-foreground md:text-6xl"
            >
              Your wealth, <em className="text-primary">intelligently</em>
              <br className="hidden sm:block" /> managed.
            </h1>

            <p className="max-w-[38ch] text-sm font-light leading-relaxed text-muted-foreground">
              Real-time analytics, multi-asset allocation, and AI-driven
              insights — built for investors who demand precision.
            </p>
          </div>

          {/* Stats strip */}
          <div className="flex w-fit flex-wrap items-center gap-6 rounded-xl border border-primary/15 bg-white/70 px-5 py-4 shadow-sm backdrop-blur-sm">
            {stats.map((s, i) => (
              <div key={s.label} className="flex items-center gap-6">
                <div className="flex flex-col gap-0.5">
                  <span className="font-display text-2xl font-semibold leading-none tracking-tight text-foreground">
                    {s.value}
                  </span>
                  <span className="text-[0.63rem] font-medium uppercase tracking-widest text-muted-foreground">
                    {s.label}
                  </span>
                </div>
                {i < stats.length - 1 && (
                  <Separator orientation="vertical" className="h-8" />
                )}
              </div>
            ))}
          </div>

          {/* Decorative icons */}
          <div className="flex items-center gap-5">
            <TrendingUp size={17} className="text-muted-foreground/30" />
            <BarChart3 size={17} className="text-muted-foreground/30" />
            <Layers size={17} className="text-muted-foreground/30" />
            <ShieldCheck size={17} className="text-muted-foreground/30" />
          </div>
        </section>

        {/* RIGHT — Register card */}
        <section className="flex flex-col items-center justify-center gap-4 px-6 py-16 lg:px-12 lg:py-24">
          {/* Mobile logo */}
          <div className="lg:hidden mb-2">
            <Image
              src="/casalavoroLogon.png"
              width={120}
              height={120}
              alt="logo"
            />
          </div>

          <Card className="w-full max-w-lg overflow-hidden border-border/60 bg-white/90 shadow-xl shadow-black/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl">
            {/* Brand accent bar */}
            <div
              aria-hidden="true"
              className="h-0.75 w-full"
              style={{
                background:
                  "linear-gradient(90deg, #ff6900 0%, #ff9f5a 55%, transparent 100%)",
              }}
            />

            <CardHeader className="px-8 pb-2 pt-7">
              <CardTitle
                data-display="true"
                className="font-display text-[1.65rem] font-semibold leading-tight tracking-tight"
              >
                Create your account
              </CardTitle>
              <CardDescription className="text-sm font-light leading-relaxed">
                Fill in your details below to get started.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8 pt-3">
              <form
                onSubmit={formik.handleSubmit}
                noValidate
                className="flex flex-col gap-4"
              >
                {/* Row: Title + Surname */}
                <div className="flex gap-3 items-start">
                  {/* Title */}
                  <div className="w-28 shrink-0">
                    <Label
                      htmlFor="title"
                      className="text-[0.72rem] font-medium uppercase tracking-widest text-muted-foreground mb-1.5 block"
                    >
                      Title
                    </Label>
                    <Select
                      value={formik.values.title}
                      onValueChange={(val) =>
                        formik.setFieldValue("title", val)
                      }
                      onOpenChange={() => formik.setFieldTouched("title", true)}
                    >
                      <SelectTrigger
                        id="title"
                        className={`h-10 text-sm ${hasError("title") ? "border-destructive focus:ring-destructive/30" : ""}`}
                      >
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        {TITLES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <ErrorMsg name="title" />
                  </div>

                  {/* Surname */}
                  <div className="flex-1">
                    <Label
                      htmlFor="last_name"
                      className="text-[0.72rem] font-medium uppercase tracking-widest text-muted-foreground mb-1.5 block"
                    >
                      Surname
                    </Label>
                    <Input
                      {...fieldProps("last_name")}
                      type="text"
                      placeholder="Smith"
                      autoComplete="family-name"
                      className={`h-10 text-sm ${inputCls("last_name")}`}
                    />
                    <ErrorMsg name="last_name" />
                  </div>
                </div>

                {/* Row: First name + Other name */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label
                      htmlFor="first_name"
                      className="text-[0.72rem] font-medium uppercase tracking-widest text-muted-foreground mb-1.5 block"
                    >
                      First name
                    </Label>
                    <Input
                      {...fieldProps("first_name")}
                      type="text"
                      placeholder="Jane"
                      autoComplete="given-name"
                      className={`h-10 text-sm ${inputCls("first_name")}`}
                    />
                    <ErrorMsg name="first_name" />
                  </div>

                  <div>
                    <Label
                      htmlFor="other_name"
                      className="text-[0.72rem] font-medium uppercase tracking-widest text-muted-foreground mb-1.5 block"
                    >
                      Other name{" "}
                      <span className="normal-case tracking-normal font-normal text-muted-foreground/60">
                        (optional)
                      </span>
                    </Label>
                    <Input
                      {...fieldProps("other_name")}
                      type="text"
                      placeholder="Middle name"
                      autoComplete="additional-name"
                      className={`h-10 text-sm ${inputCls("other_name")}`}
                    />
                    <ErrorMsg name="other_name" />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <Label
                    htmlFor="email"
                    className="text-[0.72rem] font-medium uppercase tracking-widest text-muted-foreground mb-1.5 block"
                  >
                    Email address
                  </Label>
                  <Input
                    {...fieldProps("email")}
                    type="email"
                    placeholder="jane@example.com"
                    autoComplete="email"
                    className={`h-10 text-sm ${inputCls("email")}`}
                  />
                  <ErrorMsg name="email" />
                </div>

                {/* Phone */}
                <div>
                  <Label
                    htmlFor="phone"
                    className="text-[0.72rem] font-medium uppercase tracking-widest text-muted-foreground mb-1.5 block"
                  >
                    Phone{" "}
                    <span className="normal-case tracking-normal font-normal text-muted-foreground/60">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    {...fieldProps("phone")}
                    type="tel"
                    placeholder="+234 800 000 0000"
                    autoComplete="tel"
                    className={`h-10 text-sm ${inputCls("phone")}`}
                  />
                  <ErrorMsg name="phone" />
                </div>

                {/* Password */}
                <div>
                  <Label
                    htmlFor="password"
                    className="text-[0.72rem] font-medium uppercase tracking-widest text-muted-foreground mb-1.5 block"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      {...fieldProps("password")}
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 chars, 1 uppercase, 1 number"
                      autoComplete="new-password"
                      className={`h-10 text-sm pr-10 ${inputCls("password")}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <ErrorMsg name="password" />
                </div>

                {/* Server error */}
                {formik.status && (
                  <div className="rounded-md bg-destructive/8 border border-destructive/20 px-4 py-3">
                    <p className="text-sm text-destructive" role="alert">
                      {formik.status}
                    </p>
                  </div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  size="lg"
                  disabled={formik.isSubmitting}
                  className="mt-1 h-11 w-full gap-2.5 bg-primary text-sm font-medium text-white shadow-md shadow-primary/25 transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.99] disabled:opacity-60"
                >
                  {formik.isSubmitting && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {formik.isSubmitting ? "Creating account…" : "Create account"}
                </Button>

                <Separator />

                <p className="text-center text-[0.78rem] font-light text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    Sign in
                  </Link>
                </p>

                <p className="text-center text-[0.72rem] font-light leading-relaxed text-muted-foreground">
                  By continuing, you agree to our{" "}
                  <Link
                    href="/terms"
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    Terms and Conditions
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
