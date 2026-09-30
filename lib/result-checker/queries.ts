"use client";

import { useMutation } from "@tanstack/react-query";
import * as api from "@/lib/result-checker/api";

/**
 * Deliberately a mutation, not a `useQuery`. A verified result must never
 * sit in React Query's cache keyed by credentials (which would risk being
 * served again without re-verifying, or lingering longer than needed) — a
 * mutation's `data` lives only in this hook's local state until the next
 * call or an explicit `reset()`.
 */
export const useVerifyResult = () => useMutation({ mutationFn: api.verifyResult });
