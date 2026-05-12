"use client";

import React, { useState } from "react";
import { ShieldAlert, ArrowRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const steps = [
  { label: "Verify your identity", done: false },
  { label: "Build your investment portfolio", done: false },
  { label: "Submit required documents", done: false },
];

const ComplianceCheck = () => {
  const [open, setOpen] = useState(true);
  const router = useRouter();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-md rounded-2xl bg-background border border-border shadow-2xl overflow-hidden">
        {/* Dismiss button */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>

        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center rounded-xl bg-destructive/10 p-3 shrink-0">
              <ShieldAlert className="size-6 text-destructive" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold leading-tight">
                  Verification Required
                </h2>
                <Badge variant="destructive">Action needed</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Your account isn't verified yet. Complete the steps below to
                unlock full access.
              </p>
            </div>
          </div>

          <Separator />

          {/* Steps */}
          <ul className="space-y-3">
            {steps.map((step, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-medium text-muted-foreground">
                  {i + 1}
                </div>
                <span className="text-sm text-foreground">{step.label}</span>
              </li>
            ))}
          </ul>

          <Separator />

          {/* Footer */}
          <div className="flex items-center justify-between gap-3">
            <Button size="sm" className="gap-1.5 text-white shrink-0" onClick={() => router.push("/verification")}>
              Start verification
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceCheck;
