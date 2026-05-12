import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  FileText,
  Scale,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { sections } from "@/constants";

const tocItems = sections.map((s) => ({
  id: s.id,
  number: s.number,
  title: s.title,
}));

export default function TermsPage() {
  return (
    <div className="relative min-h-dvh bg-background">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div className="absolute -left-20 -top-32 h-125 w-125 rounded-full bg-primary/8 blur-[90px]" />
        <div className="absolute bottom-0 right-0 h-87.5 w-87.5 rounded-full bg-primary/5 blur-[80px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Back nav */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft size={15} />
            Back
          </Link>
        </div>

        {/* Page header */}
        <div className="mb-10 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-accent">
              <Scale size={18} className="text-primary" />
            </div>
            <Badge
              variant="outline"
              className="border-primary/30 bg-accent text-primary text-[0.67rem] font-medium tracking-widest uppercase"
            >
              Legal Document
            </Badge>
          </div>

          <div>
            <h1
              data-display="true"
              className="font-display text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl"
            >
              Terms &amp; Conditions
            </h1>
            <p className="mt-2 text-sm font-light text-muted-foreground">
              Casalavoro Limited Investment Agreement &mdash; effective 2025
            </p>
          </div>

          {/* Company info strip */}
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border/60 bg-white/70 px-5 py-3.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 size={13} className="text-primary" />
              No. 29 Kigoma Street, Wuse, Zone 7, Abuja
            </div>
            <Separator orientation="vertical" className="h-4 hidden sm:block" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck size={13} className="text-primary" />
              Governed by the laws of the Federal Republic of Nigeria
            </div>
            <Separator orientation="vertical" className="h-4 hidden sm:block" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText size={13} className="text-primary" />
              15 clauses
            </div>
          </div>
        </div>

        {/* Preamble */}
        <Card className="mb-8 border-border/60 bg-white/80 backdrop-blur-sm">
          <CardContent className="px-6 py-5">
            <p className="text-sm leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">Investor</span> and{" "}
              <span className="font-medium text-foreground">Fund Manager</span>{" "}
              are hereinafter jointly referred to as &ldquo;the Parties&rdquo;
              and individually as &ldquo;a Party&rdquo;. WHEREAS;
            </p>
            <div className="mt-4 flex flex-col gap-3">
              {[
                {
                  label: "A",
                  text: "Fund Manager is a company engaged in the business of money lending, funding/investing in entrepreneurs and small business for the purposes of their respective endeavors, through cooperatives and related means, particularly within Abuja, FCT.",
                },
                {
                  label: "B",
                  text: "The Investor is an individual and having expressed satisfaction with the processes and activities of the Fund Manager is interested in investing with the Fund Manager.",
                },
                {
                  label: "C",
                  text: "The Parties have accordingly entered into this Agreement.",
                },
              ].map((item) => (
                <div key={item.label} className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[0.65rem] font-semibold text-primary">
                    {item.label}
                  </span>
                  <p className="text-sm font-light leading-relaxed text-muted-foreground">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main layout: TOC sidebar + content */}
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          {/* Sticky TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-8">
              <Card className="border-border/60 bg-white/80 backdrop-blur-sm">
                <CardHeader className="px-5 pb-3 pt-5">
                  <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Contents
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-5">
                  <ScrollArea className="h-130">
                    <nav className="flex flex-col gap-0.5">
                      {tocItems.map((item) => (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          className="group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150 hover:bg-accent"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-muted text-[0.62rem] font-semibold text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary transition-colors">
                            {item.number}
                          </span>
                          <span className="font-light text-muted-foreground group-hover:text-foreground transition-colors leading-snug text-[0.8rem]">
                            {item.title}
                          </span>
                        </a>
                      ))}
                    </nav>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Clauses */}
          <main className="flex flex-col gap-5">
            <p className="text-sm font-medium text-foreground">
              IN CONSIDERATION of the above, the Parties hereby agree as
              follows:
            </p>

            {sections.map((section, idx) => (
              <Card
                key={section.id}
                id={section.id}
                className="scroll-mt-8 border-border/60 bg-white/80 backdrop-blur-sm transition-shadow duration-200 hover:shadow-md"
              >
                {/* Section header accent */}
                <div
                  className="h-0.5 w-full rounded-t-[inherit]"
                  style={{
                    background: `linear-gradient(90deg, #ff6900 0%, #ff9f5a ${20 + idx * 5}%, transparent 100%)`,
                    opacity: 0.7,
                  }}
                  aria-hidden="true"
                />

                <CardHeader className="px-6 pb-2 pt-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-accent text-xs font-semibold text-primary">
                      {section.number}
                    </span>
                    <CardTitle
                      data-display="true"
                      className="font-display text-base font-semibold tracking-tight text-foreground"
                    >
                      {section.title}
                    </CardTitle>
                  </div>
                </CardHeader>

                <CardContent className="px-6 pb-6">
                  {section.body && (
                    <p className="text-sm font-light leading-relaxed text-muted-foreground">
                      {section.body}
                    </p>
                  )}

                  {section.clauses && (
                    <div className="flex flex-col gap-3">
                      {section.clauses.map((clause) => (
                        <div key={clause.ref}>
                          <div className="flex gap-3">
                            <span className="mt-0.5 shrink-0 text-xs font-semibold text-primary/70 tabular-nums">
                              {clause.ref}
                            </span>
                            <p className="text-sm font-light leading-relaxed text-muted-foreground">
                              {clause.text}
                            </p>
                          </div>

                          {clause.sub && (
                            <div className="ml-7 mt-2.5 flex flex-col gap-2 border-l-2 border-primary/10 pl-4">
                              {clause.sub.map((sub) => (
                                <div key={sub.ref} className="flex gap-3">
                                  <span className="mt-0.5 shrink-0 text-[0.7rem] font-semibold text-primary/60 tabular-nums">
                                    {sub.ref}
                                  </span>
                                  <p className="text-sm font-light leading-relaxed text-muted-foreground">
                                    {sub.text}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Footer / acceptance notice */}
            <Card className="border-primary/20 bg-accent/60 backdrop-blur-sm">
              <CardContent className="flex flex-col gap-3 px-6 py-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                    Customer Declaration
                  </span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {[
                    "I agree to comply with the minimum investment period specified for any investment product, failing which I accept any losses, charges or costs that can arise at the point of redemption of my investment.",
                    "I agree that my e-statement can be sent at my risk to the correspondence address/email I have provided.",
                    "I confirm that the information given on this form is complete, correct, and true to the best of my knowledge.",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </span>
                      <p className="text-sm font-light leading-relaxed text-muted-foreground">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Copyright */}
            <p className="text-center text-xs text-muted-foreground/50 pb-4">
              &copy; 2025 Casalavoro Limited &mdash; All rights reserved
            </p>
          </main>
        </div>
      </div>
    </div>
  );
}
