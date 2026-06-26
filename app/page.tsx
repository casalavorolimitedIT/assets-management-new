import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  UserPlus,
  LogIn,
  TrendingUp,
  ShieldCheck,
  BarChart3,
  ArrowRight,
  Check,
  Layers,
} from "lucide-react";
import Image from "next/image";

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/dashboard");
  }

  const stats = [
    { value: "$4.2B", label: "Assets Under Management" },
    { value: "18K+", label: "Active Portfolios" },
    { value: "99.9%", label: "Platform Uptime" },
  ];

  const features = [
    "Multi-asset portfolio tracking & analytics",
    "Real-time P&L and performance attribution",
    "Automated rebalancing & smart alerts",
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
        {/* LEFT — Brand & story */}
        <section className="flex flex-col justify-center gap-8 px-8 py-16 md:px-14 lg:py-24">
          {/* Logo lockup */}
          <div className="flex items-center gap-3">
            <Image
              src="/casalavoroLogon.png"
              width={150}
              height={150}
              alt="logo"
            />
          </div>

          {/* Orange accent rule */}
          <div className="h-0.5 w-12 -mt-6 sm:-mt-20 rounded-full bg-linear-to-r from-primary to-transparent" />

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
              className="font-display text-[2.1rem] font-semibold leading-[1.07] tracking-tight text-foreground sm:text-5xl md:text-6xl"
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
          <div className="grid grid-cols-3 gap-x-5 gap-y-4 rounded-xl border border-primary/15 bg-white/70 px-5 py-4 shadow-sm backdrop-blur-sm sm:flex sm:w-fit sm:flex-row sm:items-center sm:gap-6">
            {stats.map((s, i) => (
              <div key={s.label} className="flex items-center gap-6">
                <div className="flex flex-col gap-0.5">
                  <span className="font-display text-xl font-semibold leading-none tracking-tight text-foreground sm:text-2xl">
                    {s.value}
                  </span>
                  <span className="text-[0.6rem] font-medium uppercase tracking-widest text-muted-foreground">
                    {s.label}
                  </span>
                </div>
                {i < stats.length - 1 && (
                  <Separator orientation="vertical" className="hidden h-8 sm:block" />
                )}
              </div>
            ))}
          </div>

          {/* Decorative icon row */}
          <div className="flex items-center gap-5">
            <TrendingUp size={17} className="text-muted-foreground/30" />
            <BarChart3 size={17} className="text-muted-foreground/30" />
            <Layers size={17} className="text-muted-foreground/30" />
            <ShieldCheck size={17} className="text-muted-foreground/30" />
          </div>
        </section>

        {/* RIGHT — Auth card */}
        <section className="flex flex-col items-center justify-center gap-4 px-6 py-16 lg:px-12 lg:py-24">
          <Card className="w-full max-w-105 overflow-hidden border-border/60 bg-white/90 shadow-xl shadow-black/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
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
                className="font-display text-[1.8rem] font-semibold leading-tight tracking-tight"
              >
                Get started
              </CardTitle>
              <CardDescription className="text-sm font-light leading-relaxed">
                Join thousands of investors managing their portfolios with
                confidence.
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-6 px-8 pb-8 pt-2">
              {/* CTA buttons */}
              <div className="flex flex-col gap-3">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="group h-12 w-full gap-2.5 bg-primary text-sm font-medium text-white shadow-md shadow-primary/25 transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.99]"
                  >
                    Create an account
                  </Button>
                </Link>

                <div className="flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="text-[0.72rem] tracking-wide text-muted-foreground/50">
                    or
                  </span>
                  <Separator className="flex-1" />
                </div>

                <Link href="/login">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 w-full gap-2.5 border-border/70 text-sm font-medium transition-all duration-200 hover:border-primary/25 hover:bg-accent hover:text-primary"
                  >
                    Sign in to your account
                  </Button>
                </Link>
              </div>

              {/* Feature list */}
              <ul className="flex flex-col gap-2.5" role="list">
                {features.map((feat) => (
                  <li
                    key={feat}
                    className="flex items-center gap-2.5 text-[0.8rem] font-light text-muted-foreground"
                  >
                    <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-accent">
                      <Check
                        size={10}
                        className="text-primary"
                        strokeWidth={2.8}
                      />
                    </span>
                    {feat}
                  </li>
                ))}
              </ul>

              <Separator />

              {/* Legal */}
              <p className="text-center text-[0.72rem] font-light leading-relaxed text-muted-foreground">
                By continuing, you agree to our{" "}
                <Link
                  href="/terms"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  Terms and Conditions
                </Link>{" "}
                and{" "}
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
