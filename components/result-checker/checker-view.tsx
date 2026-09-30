"use client";

import { useState } from "react";
import { ResultDocument } from "@/components/result-checker/result-document";
import { VerifyForm } from "@/components/result-checker/verify-form";
import type { VerifiedResult } from "@/lib/result-checker/types";

export function ResultCheckerView() {
  const [result, setResult] = useState<VerifiedResult | null>(null);

  if (result) {
    return <ResultDocument result={result} onCheckAnother={() => setResult(null)} />;
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-8">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Student Result Checker</h1>
        <p className="text-sm text-muted-foreground">
          Enter the student&apos;s ID, date of birth, and the term ID from your school&apos;s
          notice to view a result.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <VerifyForm onVerified={setResult} />
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Having trouble checking a result? Contact your school&apos;s office.
      </p>
    </div>
  );
}
