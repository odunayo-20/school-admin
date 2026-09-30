import { Suspense } from "react";
import type { Metadata } from "next";
import { ResultCheckerView } from "@/components/result-checker/checker-view";

export const metadata: Metadata = {
  title: "Check Result | School Admin",
  description: "Verify a student's academic result using their Student ID, date of birth and term.",
};

export default function ResultCheckerPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-1 flex-col px-4 py-10 sm:py-16">
      {/* VerifyForm reads a ?term= query param via useSearchParams(), which
          requires a Suspense boundary in the App Router. */}
      <Suspense>
        <ResultCheckerView />
      </Suspense>
    </main>
  );
}
