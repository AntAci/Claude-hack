"use client"

import { useMemo, useState } from "react"
import { Search, Send, Phone, Sparkles, Loader2, Mic, Copy, Check } from "lucide-react"

type PatientRecord = {
  id: string
  name: string
  dob: string
  scenario: string
  setting: string
  tags: string[]
  rawNote: string
}

type HumanizeResponse = {
  simplifiedText: string
  usedFallback: boolean
}

function generateVoiceToken(dob: string, carePlan: string, patientName: string): string {
  const expiry = Date.now() + 48 * 60 * 60 * 1000 // 48 hours
  const planId = Math.random().toString(36).slice(2, 10)
  localStorage.setItem(`cp_${planId}`, JSON.stringify({ carePlan, patientName, exp: expiry }))
  const payload = JSON.stringify({ dob, exp: expiry, pid: planId })
  return btoa(payload)
}

export function ClaudeCare({ patients }: { patients: PatientRecord[] }) {
  const [query, setQuery] = useState("")
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id ?? "")
  const [sourceText, setSourceText] = useState<string>(patients[0]?.rawNote ?? "")
  const [simplifiedText, setSimplifiedText] = useState("")
  const [isHumanizing, setIsHumanizing] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [voiceLinkCopied, setVoiceLinkCopied] = useState(false)

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === selectedPatientId),
    [patients, selectedPatientId],
  )

  const filteredPatients = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return patients
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(normalized) ||
        p.id.toLowerCase().includes(normalized) ||
        p.scenario.replaceAll("_", " ").toLowerCase().includes(normalized) ||
        p.tags.join(" ").toLowerCase().includes(normalized),
    )
  }, [patients, query])

  function handleSelectPatient(patientId: string) {
    const patient = patients.find((p) => p.id === patientId)
    if (!patient) return
    setSelectedPatientId(patient.id)
    setSourceText(patient.rawNote)
    setSimplifiedText("")
    setErrorMessage("")
    setStatusMessage("")
  }

  async function handleHumanize() {
    setIsHumanizing(true)
    setErrorMessage("")
    setStatusMessage("")
    try {
      const res = await fetch("/api/humanize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: selectedPatient?.name ?? "Patient",
          message: sourceText,
        }),
      })
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`)
      const data = (await res.json()) as HumanizeResponse
      const token = generateVoiceToken(selectedPatient?.dob ?? "", data.simplifiedText, selectedPatient?.name ?? "Patient")
      const voiceUrl = `${window.location.origin}/voice?t=${token}`
      const expiry = new Date(Date.now() + 48 * 60 * 60 * 1000)
      const expiryStr = expiry.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
      const voiceSection = [
        "",
        "---",
        "",
        "Have questions? Speak with your care assistant:",
        voiceUrl,
        `This link expires on ${expiryStr}.`,
        "You will need your date of birth to access it.",
      ].join("\n")
      setSimplifiedText(data.simplifiedText + voiceSection)
      setStatusMessage(
        data.usedFallback
          ? "Draft ready using local simplification fallback."
          : "Draft ready using AI simplification.",
      )
    } catch {
      setErrorMessage("Unable to simplify text right now. Please try again.")
    } finally {
      setIsHumanizing(false)
    }
  }

  function handleSend(mode: "text" | "text_and_call") {
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    if (mode === "text") {
      setStatusMessage(`Queued at ${now}: sent as text message.`)
    } else {
      setStatusMessage(`Queued at ${now}: sent as text and AI call.`)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 md:p-8"
      style={{
        backgroundImage: "url('/images/gradient-background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Subtle overlay */}
      <div
        className="fixed inset-0"
        style={{
          background: "linear-gradient(135deg, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0.08) 100%)",
        }}
      />

      {/* Brand */}
      <div className="fixed top-4 left-6 z-20">
        <span className="text-xl font-bold font-sans gradient-text-glow" aria-hidden="true">
          ClaudeCare
        </span>
        <h2 className="text-xl font-bold font-sans gradient-text">ClaudeCare</h2>
      </div>

      {/* Main glass card */}
      <div
        className="relative z-10 w-full max-w-5xl mx-auto rounded-3xl p-6 md:p-8"
        style={{
          background: "rgba(255,255,255,0.18)",
          backdropFilter: "blur(60px) saturate(200%)",
          WebkitBackdropFilter: "blur(60px) saturate(200%)",
          border: "1px solid rgba(255,255,255,0.45)",
          boxShadow:
            "0 32px 80px rgba(0,0,0,0.12), inset 0 2px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(255,255,255,0.2)",
        }}
      >
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 font-sans leading-tight">
            Patient Care Assistant
          </h1>
          <p className="text-gray-600 font-sans mt-1 text-sm">
            Select a patient, transform clinical notes into plain language, then send.
          </p>
        </div>

        {/* Patient selection section */}
        <div
          className="rounded-2xl p-4 mb-5"
          style={{
            background: "rgba(255,255,255,0.3)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.5)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
          }}
        >
          <div className="grid gap-3 md:grid-cols-2">
            {/* Search */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 tracking-wide uppercase">
                Find patient
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or ID"
                  className="w-full h-10 pl-9 pr-3 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 font-sans focus:outline-none transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.5)",
                    border: "1px solid rgba(255,255,255,0.6)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                />
              </div>
            </div>

            {/* Select */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 tracking-wide uppercase">
                Select patient
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => handleSelectPatient(e.target.value)}
                className="w-full h-10 px-3 rounded-xl text-sm text-gray-800 font-sans focus:outline-none transition-all duration-200 cursor-pointer"
                style={{
                  background: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(255,255,255,0.6)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                {filteredPatients.length === 0 ? (
                  <option value="">No matches</option>
                ) : (
                  filteredPatients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.scenario.replaceAll("_", " ")}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Patient meta */}
          {selectedPatient && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium"
                style={{
                  background: "rgba(217,119,6,0.12)",
                  color: "#92400e",
                }}
              >
                {selectedPatient.id}
              </span>
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium"
                style={{
                  background: "rgba(124,58,237,0.1)",
                  color: "#5b21b6",
                }}
              >
                {selectedPatient.setting}
              </span>
              {selectedPatient.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium"
                  style={{
                    background: "rgba(8,145,178,0.1)",
                    color: "#155e75",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Editor grid - Before / After */}
        <div className="grid gap-4 md:grid-cols-2 mb-5">
          {/* Before */}
          <div
            className="rounded-2xl p-4"
            style={{
              background: "rgba(255,255,255,0.25)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.5)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
            }}
          >
            <h2 className="text-xs font-semibold text-gray-600 mb-2 tracking-wide uppercase">
              Before (Clinical Note)
            </h2>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Paste or edit raw clinical text"
              rows={10}
              className="w-full resize-none rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 font-sans leading-relaxed focus:outline-none transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.5)",
                border: "1px solid rgba(255,255,255,0.6)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                minHeight: "200px",
              }}
            />
          </div>

          {/* After */}
          <div
            className="rounded-2xl p-4"
            style={{
              background: "rgba(255,255,255,0.25)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.5)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
            }}
          >
            <h2 className="text-xs font-semibold text-gray-600 mb-2 tracking-wide uppercase">
              After (Patient-Friendly)
            </h2>
            <textarea
              value={simplifiedText}
              onChange={(e) => setSimplifiedText(e.target.value)}
              placeholder="Humanized output appears here"
              rows={10}
              className="w-full resize-none rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 font-sans leading-relaxed focus:outline-none transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.5)",
                border: "1px solid rgba(255,255,255,0.6)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                minHeight: "200px",
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {/* Humanize button */}
          <button
            type="button"
            onClick={handleHumanize}
            disabled={isHumanizing || !sourceText.trim()}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: isHumanizing
                ? "rgba(124,58,237,0.6)"
                : "linear-gradient(135deg, rgba(217,115,22,0.85), rgba(124,58,237,0.85))",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.3)",
              boxShadow: "0 4px 16px rgba(124,58,237,0.25)",
            }}
          >
            {isHumanizing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isHumanizing ? "Simplifying..." : "Make It Patient-Friendly"}
          </button>

          {/* Send as Text */}
          <button
            type="button"
            onClick={() => handleSend("text")}
            disabled={!simplifiedText.trim()}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "rgba(255,255,255,0.4)",
              color: "#374151",
              border: "1px solid rgba(255,255,255,0.6)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <Send className="w-4 h-4" />
            Send as Text
          </button>

          {/* Text + AI Call */}
          <button
            type="button"
            onClick={() => handleSend("text_and_call")}
            disabled={!simplifiedText.trim()}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "rgba(255,255,255,0.4)",
              color: "#374151",
              border: "1px solid rgba(255,255,255,0.6)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <Phone className="w-4 h-4" />
            Text + AI Call
          </button>

          {/* Voice Assistance — copy patient link */}
          <button
            type="button"
            onClick={() => {
              const token = generateVoiceToken(selectedPatient?.dob ?? "", simplifiedText, selectedPatient?.name ?? "Patient")
              const link = `${window.location.origin}/voice?t=${token}`
              navigator.clipboard.writeText(link)
              setVoiceLinkCopied(true)
              setStatusMessage(`Patient voice link copied: ${link}`)
              setTimeout(() => setVoiceLinkCopied(false), 2000)
            }}
            disabled={!simplifiedText.trim()}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: simplifiedText.trim()
                ? "linear-gradient(135deg, rgba(8,145,178,0.8), rgba(124,58,237,0.8))"
                : "rgba(255,255,255,0.4)",
              color: simplifiedText.trim() ? "#fff" : "#374151",
              border: "1px solid rgba(255,255,255,0.3)",
              boxShadow: simplifiedText.trim()
                ? "0 4px 16px rgba(8,145,178,0.25)"
                : "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            {voiceLinkCopied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
            {voiceLinkCopied ? "Link Copied!" : "Copy Voice Link"}
          </button>
        </div>

        {/* Status / Error messages */}
        {statusMessage && (
          <p className="mt-4 text-sm font-medium text-emerald-700">{statusMessage}</p>
        )}
        {errorMessage && (
          <p className="mt-4 text-sm font-medium text-red-600">{errorMessage}</p>
        )}

        {/* Disclaimer */}
        <p className="mt-6 text-xs text-gray-500 leading-relaxed">
          ClaudeCare does not diagnose, prescribe, or replace professional medical advice.
          If symptoms worsen or urgent symptoms appear, contact a healthcare professional immediately.
        </p>
      </div>
    </div>
  )
}
