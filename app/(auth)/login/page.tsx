import type { Metadata } from "next"

import { site } from "@/lib/data/site"
import { loginCopy } from "@/lib/data/auth"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: `Log in · ${site.name}`,
  description: loginCopy.intro,
}

export default function LoginPage() {
  return <LoginForm />
}
