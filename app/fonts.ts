import { Fraunces, Instrument_Sans, JetBrains_Mono } from "next/font/google";

// Display: characterful optical serif — editorial and calm, avoids generic SaaS sans.
export const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

// Body: warm neutral grotesque for both public and dashboard reading.
export const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
  fallback: ["system-ui", "Segoe UI", "Helvetica", "Arial", "sans-serif"],
});

// Mono: clinic data — times, PKR amounts, phone numbers, status codes.
export const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});
