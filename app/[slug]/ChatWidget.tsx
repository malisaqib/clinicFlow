"use client";

import { useEffect, useRef, useState } from "react";

import type { ReceptionistApiResult } from "@/lib/types";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  handoff?: boolean;
};

const SUGGESTIONS = [
  "What are your timings?",
  "Where are you located?",
  "Which services do you offer?",
  "How do I book?",
];

// Client-side heuristic mirroring the server safety rule, so the input visibly signals
// a hand-off the moment a question strays medical — the server remains authoritative.
const MEDICAL_HINT =
  /\b(diagnos|prescrib|medicine|medication|dosage|dose|side effect|symptom|pain|swelling|bleeding|infection|fever|is .* safe|should i (take|use)|which treatment|do i need)\b/i;

export function ChatWidget({
  slug,
  clinicName,
  phone,
  whatsapp,
}: {
  slug: string;
  clinicName: string;
  phone: string | null;
  whatsapp: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: `Hi! I'm the ClinicFlow receptionist for ${clinicName}. Ask me about timings, services, fees, location, or how to book. For anything medical, I'll point you to the clinic team.`,
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const inputLooksMedical = MEDICAL_HINT.test(input);

  async function send(text: string) {
    const message = text.trim();
    if (!message || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: message }]);
    setLoading(true);
    try {
      const res = await fetch(`/api/clinics/${slug}/ai/receptionist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, sessionId }),
      });
      const body = (await res.json().catch(() => ({}))) as Partial<ReceptionistApiResult> & {
        error?: string;
      };
      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text:
              body?.error && body.error.includes("configuration")
                ? "The receptionist isn't connected yet in this demo. Please contact the clinic directly."
                : "Sorry — I couldn't answer that right now. Please contact the clinic directly.",
            handoff: true,
          },
        ]);
        return;
      }
      if (body.sessionId) setSessionId(body.sessionId);
      const handoff = body.intent === "medical_handoff" || body.safety?.medicalAdviceBlocked === true;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: body.reply ?? "", handoff },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I couldn't reach the clinic system. Please call the clinic directly.",
          handoff: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="clinic-receptionist"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-brand px-4 py-3 text-sm font-semibold text-surface-3 shadow-[var(--shadow-lift)] transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 sm:bottom-6 sm:right-6"
      >
        <span className="grid h-5 w-5 place-items-center rounded-full bg-accent text-brand-strong">
          {open ? "×" : "?"}
        </span>
        {open ? "Close" : "Ask reception"}
      </button>

      {open && (
        <div
          id="clinic-receptionist"
          role="dialog"
          aria-label={`${clinicName} receptionist`}
          className="fixed inset-x-3 bottom-20 z-40 flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-line bg-surface-2 shadow-[var(--shadow-lift)] sm:inset-x-auto sm:right-6 sm:bottom-24 sm:w-[24rem]"
        >
          <header className="border-b border-line bg-brand px-4 py-3 text-surface-3">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-accent font-display text-sm text-brand-strong">
                {clinicName.slice(0, 1)}
              </span>
              <div>
                <p className="text-sm font-semibold leading-tight">{clinicName} reception</p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-surface-3/70">
                  Clinic info only · not medical advice
                </p>
              </div>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <Bubble key={i} message={m} phone={phone} whatsapp={whatsapp} />
            ))}
            {loading && (
              <div className="flex gap-1 pl-1 text-muted" aria-label="Receptionist is typing">
                <Dot /> <Dot /> <Dot />
              </div>
            )}

            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border border-line bg-surface-3 px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-brand/40 hover:text-brand"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t border-line bg-surface-3 p-3"
          >
            {inputLooksMedical && (
              <p className="mb-2 rounded-lg bg-st-new-bg px-2.5 py-1.5 text-[11px] text-st-new">
                Sounds medical — I&apos;ll hand this to clinic staff rather than advise.
              </p>
            )}
            <div className="flex items-end gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about timings, fees, booking…"
                aria-label="Message the receptionist"
                className="flex-1 rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-xl bg-brand px-3.5 py-2.5 text-sm font-semibold text-surface-3 transition-colors hover:bg-brand-strong disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function Bubble({
  message,
  phone,
  whatsapp,
}: {
  message: ChatMessage;
  phone: string | null;
  whatsapp: string | null;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-brand px-3.5 py-2 text-sm text-surface-3">
          {message.text}
        </p>
      </div>
    );
  }

  if (message.handoff) {
    const contact = whatsapp ?? phone;
    return (
      <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-st-new/30 bg-st-new-bg px-3.5 py-2.5">
        <p className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-st-new">
          <span className="h-1.5 w-1.5 rounded-full bg-st-new" /> Handed to clinic staff
        </p>
        <p className="text-sm text-ink">{message.text}</p>
        {contact && (
          <a
            href={`tel:${contact.replace(/\s/g, "")}`}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-st-new px-3 py-1.5 text-xs font-semibold text-surface-3"
          >
            Contact the clinic · {contact}
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <p className="max-w-[85%] rounded-2xl rounded-bl-md border border-line bg-surface-3 px-3.5 py-2 text-sm text-ink-soft">
        {message.text}
      </p>
    </div>
  );
}

function Dot() {
  return <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-duration:1s]" />;
}
