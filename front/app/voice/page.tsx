"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Script from "next/script"
import { ShieldCheck, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react"

function parseToken(
  t: string | null,
): { dob: string; exp: number; carePlan: string; patientName: string } | null {
  if (!t) return null
  try {
    const json = atob(t)
    const data = JSON.parse(json)
    if (!data.dob || !data.exp) return null
    let carePlan = ""
    let patientName = ""
    if (data.pid) {
      try {
        const stored = localStorage.getItem(`cp_${data.pid}`)
        if (stored) {
          const parsed = JSON.parse(stored)
          carePlan = parsed.carePlan || ""
          patientName = parsed.patientName || ""
        }
      } catch {
        // ignore storage errors
      }
    }
    return { dob: data.dob, exp: data.exp, carePlan, patientName }
  } catch {
    return null
  }
}

function ElevenLabsWidget({
  carePlan,
  patientName,
}: {
  carePlan: string
  patientName: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scriptReady, setScriptReady] = useState(false)

  useEffect(() => {
    if (!scriptReady || !containerRef.current) return

    const widget = document.createElement("elevenlabs-convai") as HTMLElement & {
      conversationInitiationClientData?: {
        dynamic_variables: Record<string, string>
        conversation_config_override?: {
          agent?: {
            prompt?: { prompt?: string }
            first_message?: string
          }
        }
      }
    }
    widget.setAttribute("agent-id", "agent_1101kmgc41vdeba8hhkv9jcf9swb")

    const firstName = patientName.split(" ")[0] || "there"

    widget.conversationInitiationClientData = {
      dynamic_variables: {
        care_plan: carePlan,
        patient_name: patientName,
      },
      conversation_config_override: {
        agent: {
          first_message: `Hi ${firstName}! I have your care plan here and I'm ready to help. You can ask me anything about your medicines, what you need to do next, warning signs to watch for, or anything else in your notes. What would you like to know?`,
          prompt: {
            prompt: `You are a warm, supportive NHS care assistant helping a patient understand their care plan. The patient's name is ${patientName}.

Here is their care plan:

${carePlan}

Rules:
- Only answer based on the care plan above. Do not invent medical advice.
- Use simple, clear UK English.
- Be warm, calm, and reassuring.
- If the patient asks something not covered in the care plan, say you don't have that information and suggest they contact their GP.
- Address the patient by their first name.
- Keep answers concise and easy to follow.`,
          },
        },
      },
    }

    containerRef.current.appendChild(widget)

    return () => {
      widget.remove()
    }
  }, [scriptReady, carePlan, patientName])

  return (
    <>
      <Script
        src="https://unpkg.com/@elevenlabs/convai-widget-embed"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div ref={containerRef} />
    </>
  )
}

function VoiceContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("t")
  const parsed = useMemo(() => parseToken(token), [token])

  const [dobInput, setDobInput] = useState("")
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState("")
  const [showCarePlan, setShowCarePlan] = useState(false)

  // No token
  if (!parsed) {
    return (
      <Shell>
        <GlassCard>
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h1 className="text-xl font-bold text-gray-800 font-sans text-center mt-4">
            Invalid Link
          </h1>
          <p className="text-gray-600 font-sans text-sm text-center mt-2">
            This voice assistance link is not valid. Please contact your care
            team for a new link.
          </p>
        </GlassCard>
      </Shell>
    )
  }

  // Expired
  if (Date.now() > parsed.exp) {
    return (
      <Shell>
        <GlassCard>
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h1 className="text-xl font-bold text-gray-800 font-sans text-center mt-4">
            Link Expired
          </h1>
          <p className="text-gray-600 font-sans text-sm text-center mt-2">
            This voice assistance link has expired. Please contact your GP or
            care team for a new one.
          </p>
        </GlassCard>
      </Shell>
    )
  }

  // DOB verification
  if (!unlocked) {
    return (
      <Shell>
        <GlassCard>
          <ShieldCheck className="w-10 h-10 text-cyan-600 mx-auto" />
          <h1 className="text-xl font-bold text-gray-800 font-sans text-center mt-4">
            Verify Your Identity
          </h1>
          <p className="text-gray-600 font-sans text-sm text-center mt-2 max-w-sm">
            To protect your privacy, please enter your date of birth to access
            the voice assistant.
          </p>

          <form
            className="mt-6 w-full max-w-xs mx-auto flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (dobInput === parsed.dob) {
                setUnlocked(true)
                setError("")
              } else {
                setError("Date of birth does not match. Please try again.")
              }
            }}
          >
            <label className="block text-xs font-semibold text-gray-600 tracking-wide uppercase">
              Date of birth
            </label>
            <input
              type="date"
              value={dobInput}
              onChange={(e) => setDobInput(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-xl text-sm text-gray-800 font-sans focus:outline-none transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.5)",
                border: "1px solid rgba(255,255,255,0.6)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            />
            {error && (
              <p className="text-red-600 text-xs font-medium">{error}</p>
            )}
            <button
              type="submit"
              className="h-10 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{
                background:
                  "linear-gradient(135deg, rgba(8,145,178,0.8), rgba(124,58,237,0.8))",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.3)",
                boxShadow: "0 4px 16px rgba(8,145,178,0.25)",
              }}
            >
              Continue
            </button>
          </form>
        </GlassCard>
      </Shell>
    )
  }

  // Unlocked — show voice assistant
  const expiryDate = new Date(parsed.exp)
  const expiryStr = expiryDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const carePlan = parsed.carePlan || ""

  return (
    <Shell>
      {/* Main card */}
      <GlassCard>
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 font-sans leading-tight">
            Your Care Assistant
          </h1>
          <p className="text-gray-600 font-sans mt-2 text-sm max-w-md">
            Have questions about your care plan, medicines, or next steps?
            Tap the microphone to speak with an AI assistant who can help
            explain things in plain language.
          </p>
        </div>

        <p className="text-xs text-gray-500 text-center">
          This link expires on {expiryStr}.
        </p>
      </GlassCard>

      {/* Collapsible care plan card */}
      {carePlan && (
        <div
          className="relative z-10 w-full max-w-xl mx-auto rounded-3xl mt-6"
          style={{
            background: "rgba(255,255,255,0.18)",
            backdropFilter: "blur(60px) saturate(200%)",
            WebkitBackdropFilter: "blur(60px) saturate(200%)",
            border: "1px solid rgba(255,255,255,0.45)",
            boxShadow:
              "0 16px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
          }}
        >
          <button
            type="button"
            onClick={() => setShowCarePlan((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 text-left"
          >
            <span className="text-sm font-semibold text-gray-700">
              Your Care Plan
            </span>
            {showCarePlan ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
          {showCarePlan && (
            <div className="px-6 pb-5">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                {carePlan}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <p className="relative z-10 mt-4 text-xs text-gray-500 leading-relaxed text-center max-w-sm mx-auto">
        This assistant is here to help you understand your care notes. It does
        not diagnose, prescribe, or replace advice from your doctor or
        healthcare team. If you feel unwell or are unsure, please contact your
        GP or call 111.
      </p>

      {/* Widget renders as a floating overlay — not inside a card */}
      <ElevenLabsWidget carePlan={carePlan} patientName={parsed.patientName} />
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8"
      style={{
        backgroundImage: "url('/images/gradient-background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div
        className="fixed inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0.08) 100%)",
        }}
      />

      {/* Brand */}
      <div className="fixed top-4 left-6 z-20">
        <span
          className="text-xl font-bold font-sans gradient-text-glow"
          aria-hidden="true"
        >
          ClaudeCare
        </span>
        <h2 className="text-xl font-bold font-sans gradient-text">
          ClaudeCare
        </h2>
      </div>

      {children}
    </div>
  )
}

function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative z-10 w-full max-w-xl mx-auto rounded-3xl p-8 flex flex-col items-center gap-6"
      style={{
        background: "rgba(255,255,255,0.18)",
        backdropFilter: "blur(60px) saturate(200%)",
        WebkitBackdropFilter: "blur(60px) saturate(200%)",
        border: "1px solid rgba(255,255,255,0.45)",
        boxShadow:
          "0 32px 80px rgba(0,0,0,0.12), inset 0 2px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(255,255,255,0.2)",
      }}
    >
      {children}
    </div>
  )
}

export default function VoicePage() {
  return (
    <Suspense>
      <VoiceContent />
    </Suspense>
  )
}
