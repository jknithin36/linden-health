// /portal/settings: Sarah's profile, notifications, security and privacy. Fictional demo data.

import { portalUser } from "@/lib/data/portal"
import { site } from "@/lib/data/site"

export const profile = {
  first: "Sarah",
  last: "Mitchell",
  dob: "1988-03-09",
  email: portalUser.email,
  phone: "(216) 555-0186",
  address: "220 Birch Lane, Lakewood, OH 44107",
  language: "English",
  clinic: "Cleveland",
  emergency: { name: "David Mitchell", relationship: "Spouse", phone: "(216) 555-0187" },
}

export const languages = ["English", "Español", "Tiếng Việt", "العربية", "中文"]
export const clinics = site.locations.map((l) => ({ value: l, label: `Linden Health ${l}` }))

export type Channel = "email" | "text" | "app"
export const channels: { id: Channel; label: string }[] = [
  { id: "email", label: "Email" },
  { id: "text", label: "Text" },
  { id: "app", label: "App" },
]

export const alerts: { id: string; label: string; on: Channel[] }[] = [
  { id: "visits", label: "Visit reminders", on: ["email", "text", "app"] },
  { id: "results", label: "New results", on: ["email", "app"] },
  { id: "messages", label: "Messages from your care team", on: ["email", "text", "app"] },
  { id: "refills", label: "Refill updates", on: ["email", "text", "app"] },
  { id: "bills", label: "Bills and payments", on: ["email", "app"] },
  { id: "vaccines", label: "Vaccine reminders", on: ["email", "app"] },
  { id: "tips", label: "Health tips and news", on: [] },
]

export const reminderTimes = [
  { id: "1w", label: "1 week before" },
  { id: "1d", label: "1 day before" },
  { id: "2h", label: "2 hours before" },
]
export const defaultReminders = ["1d", "2h"]

export type Device = { id: string; kind: "computer" | "phone"; name: string; detail: string; current: boolean }

export const devices: Device[] = [
  { id: "mac", kind: "computer", name: "MacBook Air", detail: "Cleveland, OH · Safari", current: true },
  { id: "iphone", kind: "phone", name: "iPhone 15", detail: "Linden Health app · Last active 1h ago", current: false },
]

export const settingsCopy = {
  heading: "Settings",
  tabs: [
    { id: "profile", label: "Profile" },
    { id: "notifications", label: "Notifications" },
    { id: "security", label: "Security" },
    { id: "privacy", label: "Privacy" },
  ] as const,
  profile: {
    photo: "Photo",
    changePhoto: "Change photo",
    photoHint: "JPG or PNG, square works best",
    fields: {
      first: "First name",
      last: "Last name",
      dob: "Date of birth",
      email: "Email",
      phone: "Phone",
      address: "Address",
      language: "Preferred language",
      clinic: "Preferred clinic",
    },
    emergency: { title: "Emergency contact", name: "Name", relationship: "Relationship", phone: "Phone" },
    errors: { required: "Required", email: "Enter a valid email address", phone: "Enter a 10-digit phone number" },
    save: "Save changes",
    saved: "Changes saved.",
  },
  notifications: {
    alert: "Alert",
    timing: "Reminder timing",
    timingHint: "When we remind you about upcoming visits",
    autosave: "Changes save automatically.",
    toggle: (alert: string, channel: string) => `${alert} by ${channel.toLowerCase()}`,
  },
  security: {
    password: "Password",
    passwordChanged: "Last changed 2 months ago",
    changePassword: "Change password",
    current: "Current password",
    next: "New password",
    confirm: "Confirm new password",
    hint: "At least 8 characters, with a number and a symbol",
    errors: { current: "Enter your current password", weak: "Use at least 8 characters, with a number and a symbol", match: "Passwords don’t match" },
    updated: "Password updated. You’ll stay signed in on this device.",
    save: "Update password",
    cancel: "Cancel",
    twoStep: "Two-step verification",
    twoStepOn: (phone: string) => `On · codes are texted to •••• ${phone.slice(-4)}`,
    twoStepOff: "Off · we recommend turning this on",
    devices: "Signed-in devices",
    thisDevice: "This device",
    signOut: "Sign out",
    signOutOthers: "Sign out of other devices",
    signedOut: "Signed out of other devices.",
  },
  privacy: {
    download: "Download my data",
    downloadHint: "A copy of your records, results, and messages",
    request: "Request download",
    requested: "Requested. We’ll email you a secure link within 24 hours.",
    whoTitle: "Who can see my records",
    who: ["My care team at Linden Health", "David (visits and billing)"],
    research: "Research and surveys",
    researchHint: "Let us invite you to optional studies and short surveys",
    close: "Close my account",
    closeHint: "Permanently close your account. Your records stay with Linden Health as the law requires.",
    closeDialog: {
      title: "Close your account?",
      body: "You’ll lose access to the portal for you and your family. You can ask the front desk to reopen it within 30 days.",
      confirm: "I understand that I’ll lose portal access",
      keep: "Keep my account",
      submit: "Close account",
      demo: "Demo only: your account wasn’t closed.",
    },
  },
}
