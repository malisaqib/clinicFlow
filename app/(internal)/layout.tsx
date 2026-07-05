import { MockAuthProvider } from "@/lib/auth/mock-auth";

import { InternalChrome } from "./InternalChrome";

// The internal work tool: cooler, denser surface (data-surface="internal") and gated
// behind the mock staff session. Everything below shares this chrome.
export default function InternalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-surface="internal" className="min-h-dvh bg-surface text-ink">
      <MockAuthProvider>
        <InternalChrome>{children}</InternalChrome>
      </MockAuthProvider>
    </div>
  );
}
