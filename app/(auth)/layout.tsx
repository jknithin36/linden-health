import { AuthShell } from "@/components/auth/auth-parts"

/** Log in and sign up: a focused split layout without the marketing navbar and footer. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return <AuthShell>{children}</AuthShell>
}
