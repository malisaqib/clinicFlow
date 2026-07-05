import type { Metadata } from "next";

import { fraunces, instrumentSans, jetBrainsMono } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ClinicFlow — Calm booking for clinics",
    template: "%s · ClinicFlow",
  },
  description:
    "ClinicFlow gives aesthetic, dental, and skin clinics in Pakistan a calm public booking page, safe AI receptionist, and a lead dashboard for staff.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${instrumentSans.variable} ${jetBrainsMono.variable}`}
    >
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
