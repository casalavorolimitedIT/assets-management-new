"use client";

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
  TrendingUp,
  ShieldCheck,
  BarChart3,
  Layers,
  Loader2,
} from "lucide-react";
import { login, LoginValues } from "@/hooks/auth";

const validationSchema = Yup.object({
  email: Yup.string()
    .email("Enter a valid email address")
    .required("Email is required"),
  password: Yup.string().required("Password is required"),
});

export default function LoginPage() {
  const router = useRouter();

  const formik = useFormik<LoginValues>({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      try {
        await login(values);
        router.push("/dashboard");
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.";
        setStatus(message);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const fieldProps = (name: keyof LoginValues) => ({
    id: name,
    name,
    value: formik.values[name],
    onChange: formik.handleChange,
    onBlur: formik.handleBlur,
  });

  const hasError = (name: keyof LoginValues) =>
    !!(formik.touched[name] && formik.errors[name]);

  const ErrorMsg = ({ name }: { name: keyof LoginValues }) =>
    formik.touched[name] && formik.errors[name] ? (
      <p className="mt-1 text-[0.72rem] text-destructive font-medium">
        {formik.errors[name]}
      </p>
    ) : null;

  const inputCls = (name: keyof LoginValues) =>
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
      {/* Ambient background */}
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
          <div className="flex items-center gap-3">
            <Image
              src="/casalavoroLogon.png"
              width={150}
              height={150}
              alt="logo"
            />
          </div>

          <div className="h-0.5 w-12 -mt-20 rounded-full bg-linear-to-r from-primary to-transparent" />

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
              Welcome <em className="text-primary">back.</em>
            </h1>

            <p className="max-w-[38ch] text-sm font-light leading-relaxed text-muted-foreground">
              Sign in to access your portfolio, track performance, and manage
              your investments in real time.
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

          <div className="flex items-center gap-5">
            <TrendingUp size={17} className="text-muted-foreground/30" />
            <BarChart3 size={17} className="text-muted-foreground/30" />
            <Layers size={17} className="text-muted-foreground/30" />
            <ShieldCheck size={17} className="text-muted-foreground/30" />
          </div>
        </section>

        {/* RIGHT — Login card */}
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

          <Card className="w-full max-w-md overflow-hidden border-border/60 bg-white/90 shadow-xl shadow-black/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl">
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
                Sign in
              </CardTitle>
              <CardDescription className="text-sm font-light leading-relaxed">
                Use your email and password to continue.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8 pt-3">
              <form
                onSubmit={formik.handleSubmit}
                noValidate
                className="flex flex-col gap-4"
              >
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

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label
                      htmlFor="password"
                      className="text-[0.72rem] font-medium uppercase tracking-widest text-muted-foreground"
                    >
                      Password
                    </Label>
                    <Link
                      href="/forgot-password"
                      className="text-[0.72rem] font-medium text-primary underline-offset-2 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    {...fieldProps("password")}
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={`h-10 text-sm ${inputCls("password")}`}
                  />
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
                  {formik.isSubmitting ? "Signing in…" : "Sign in"}
                </Button>

                <Separator />

                <p className="text-center text-[0.78rem] font-light text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/register"
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    Create one
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
