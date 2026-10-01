import { StaffAuthProvider } from "@/lib/staff-portal/auth-context";

export default function StaffPortalLayout({ children }: { children: React.ReactNode }) {
  return <StaffAuthProvider>{children}</StaffAuthProvider>;
}
