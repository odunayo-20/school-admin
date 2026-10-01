import { StudentAuthProvider } from "@/lib/student-portal/auth-context";

export default function StudentPortalRootLayout({ children }: { children: React.ReactNode }) {
  return <StudentAuthProvider>{children}</StudentAuthProvider>;
}
