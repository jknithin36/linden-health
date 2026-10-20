import type { Metadata } from "next"

import { site } from "@/lib/data/site"
import { signupCopy } from "@/lib/data/auth"
import { SignupForm } from "@/components/auth/signup-form"

export const metadata: Metadata = {
  title: `Create your account · ${site.name}`,
  description: signupCopy.intro,
}

export default function SignupPage() {
  return <SignupForm />
}
