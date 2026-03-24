'use client';

import { useMemo, useState } from 'react';

type PatientRecord = {
  id: string;
  name: string;
  scenario: string;
  setting: string;
  tags: string[];
  rawNote: string;
};

type HumanizeResponse = {
  simplifiedText: string;
  usedFallback: boolean;
};

export function DoctorMessageComposer({ patients }: { patients: PatientRecord[] }) {
  const [query, setQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id ?? '');
  const [sourceText, setSourceText] = useState<string>(patients[0]?.rawNote ?? '');
  const [simplifiedText, setSimplifiedText] = useState('');
  const [isHumanizing, setIsHumanizing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId),
    [patients, selectedPatientId],
  );

  const filteredPatients = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return patients;
    }

    return patients.filter((patient) => {
      return (
        patient.name.toLowerCase().includes(normalized) ||
        patient.id.toLowerCase().includes(normalized) ||
        patient.scenario.replaceAll('_', ' ').toLowerCase().includes(normalized) ||
        patient.tags.join(' ').toLowerCase().includes(normalized)
      );
    });
  }, [patients, query]);

  function handleSelectPatient(patientId: string) {
    const patient = patients.find((item) => item.id === patientId);
    if (!patient) {
      return;
    }

    setSelectedPatientId(patient.id);
    setSourceText(patient.rawNote);
    setSimplifiedText('');
    setErrorMessage('');
    setStatusMessage('');
  }

  async function handleHumanize() {
    setIsHumanizing(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      const res = await fetch('/api/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: selectedPatient?.name ?? 'Patient',
          message: sourceText,
        }),
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data = (await res.json()) as HumanizeResponse;
      setSimplifiedText(data.simplifiedText);
      setStatusMessage(
        data.usedFallback
          ? 'Draft ready using local simplification fallback.'
          : 'Draft ready using AI simplification.',
      );
    } catch {
      setErrorMessage('Unable to simplify text right now. Please try again.');
    } finally {
      setIsHumanizing(false);
    }
  }

  function handleSend(mode: 'text' | 'text_and_call') {
    const now = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (mode === 'text') {
      setStatusMessage(`Queued at ${now}: sent as text message.`);
      return;
    }

    setStatusMessage(`Queued at ${now}: sent as text and AI call.`);
  }

  return (
    <main className="page">
      <div className="brand">CLAUDE CARE</div>
      <div className="gridMask" />
      <div className="orb orbA" />
      <div className="orb orbB" />
      <section className="panel">
        <h1>ClaudeCare Doctor Assistant</h1>
        <p className="subhead">Pick a patient, refine the dataset note into plain language, then send.</p>

        <div className="patientSection">
          <label htmlFor="patient-search">Find patient</label>
          <input
            id="patient-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, case ID, scenario, or tag"
          />

          <label htmlFor="patient-select">Select patient</label>
          <select
            id="patient-select"
            value={selectedPatientId}
            onChange={(event) => handleSelectPatient(event.target.value)}
          >
            {filteredPatients.length === 0 ? (
              <option value="">No matches</option>
            ) : (
              filteredPatients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} - {patient.scenario.replaceAll('_', ' ')}
                </option>
              ))
            )}
          </select>

          {selectedPatient ? (
            <p className="patientMeta">
              {selectedPatient.id} | {selectedPatient.setting} | {selectedPatient.tags.join(', ')}
            </p>
          ) : null}
        </div>

        <div className="editorGrid">
          <article>
            <h2>Before (Dataset Note)</h2>
            <textarea
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              placeholder="Paste or edit raw clinical text"
            />
          </article>

          <article>
            <h2>After (Patient-Friendly)</h2>
            <textarea
              value={simplifiedText}
              onChange={(event) => setSimplifiedText(event.target.value)}
              placeholder="Humanized output appears here"
            />
          </article>
        </div>

        <div className="actions">
          <button type="button" onClick={handleHumanize} disabled={isHumanizing || !sourceText.trim()}>
            {isHumanizing ? 'Simplifying...' : 'Make It Patient-Friendly'}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => handleSend('text')}
            disabled={!simplifiedText.trim()}
          >
            Send as Text
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => handleSend('text_and_call')}
            disabled={!simplifiedText.trim()}
          >
            Text + AI Call
          </button>
        </div>

        {statusMessage ? <p className="status">{statusMessage}</p> : null}
        {errorMessage ? <p className="error">{errorMessage}</p> : null}
      </section>

      <style jsx>{`
        :global(:root) {
          --bg-0: #ffffff;
          --bg-1: #f7fbff;
          --bg-2: #f3f8ff;
          --edge: rgba(255, 255, 255, 0.94);
          --glass: rgba(255, 255, 255, 0.68);
          --glass-deep: rgba(255, 255, 255, 0.44);
          --ink: #182533;
          --ink-soft: #5c7489;
          --accent: #6bcaf2;
          --accent-2: #9b8df6;
        }

        @keyframes float {
          0% {
            transform: translateY(0px) scale(1) rotate(0deg);
          }
          50% {
            transform: translateY(-16px) scale(1.03) rotate(6deg);
          }
          100% {
            transform: translateY(0px) scale(1) rotate(0deg);
          }
        }

        @keyframes riseIn {
          0% {
            opacity: 0;
            transform: translateY(16px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes brandShimmer {
          0% {
            background-position: 0% 50%;
            opacity: 0.92;
          }
          50% {
            background-position: 100% 50%;
            opacity: 1;
          }
          100% {
            background-position: 0% 50%;
            opacity: 0.92;
          }
        }

        .page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 2rem 1rem;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(980px 560px at 94% -8%, rgba(255, 130, 196, 0.12), transparent 56%),
            radial-gradient(900px 800px at -14% 105%, rgba(95, 180, 255, 0.12), transparent 60%),
            radial-gradient(760px 460px at 40% -12%, rgba(139, 238, 168, 0.1), transparent 62%),
            linear-gradient(160deg, var(--bg-0) 0%, var(--bg-1) 45%, var(--bg-2) 100%);
          color: var(--ink);
          font-family: var(--font-body), 'Segoe UI', sans-serif;
        }

        .brand {
          position: fixed;
          top: 18px;
          left: 20px;
          z-index: 10;
          font-family: var(--font-display), 'Segoe UI', sans-serif;
          font-weight: 700;
          font-size: 0.92rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          background: linear-gradient(
            120deg,
            rgba(255, 127, 196, 0.9),
            rgba(125, 164, 255, 0.95) 45%,
            rgba(96, 209, 196, 0.9) 90%
          );
          background-size: 200% 200%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: brandShimmer 5s ease-in-out infinite;
          user-select: none;
          pointer-events: none;
        }

        .gridMask {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(rgba(105, 152, 197, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(105, 152, 197, 0.08) 1px, transparent 1px);
          background-size: 36px 36px;
          opacity: 0.12;
        }

        .orb {
          position: absolute;
          border-radius: 999px;
          pointer-events: none;
          will-change: transform;
          animation: float 16s ease-in-out infinite;
        }

        .orbA {
          width: 480px;
          height: 480px;
          right: -120px;
          top: -180px;
          background: radial-gradient(circle at 30% 30%, rgba(255, 142, 206, 0.19), rgba(255, 142, 206, 0));
        }

        .orbB {
          width: 560px;
          height: 560px;
          left: -220px;
          bottom: -260px;
          animation-delay: 2s;
          background: radial-gradient(circle at 65% 45%, rgba(111, 187, 255, 0.2), rgba(111, 187, 255, 0));
        }

        .panel {
          width: min(100%, 1080px);
          position: relative;
          isolation: isolate;
          background:
            linear-gradient(165deg, rgba(255, 255, 255, 0.74), rgba(255, 255, 255, 0.42)),
            linear-gradient(125deg, rgba(255, 255, 255, 0.9), transparent 36%);
          backdrop-filter: blur(16px) saturate(120%);
          -webkit-backdrop-filter: blur(16px) saturate(120%);
          border: 1px solid var(--edge);
          border-radius: 24px;
          padding: 1.65rem;
          box-shadow:
            0 16px 38px rgba(96, 127, 156, 0.16),
            inset 0 1px 0 rgba(255, 255, 255, 0.95),
            inset 0 -1px 0 rgba(183, 213, 236, 0.3);
          display: grid;
          gap: 1.1rem;
          animation: riseIn 520ms cubic-bezier(0.2, 0.85, 0.18, 1) both;
          z-index: 2;
        }

        .panel::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(
            112deg,
            rgba(255, 255, 255, 0.8) 0%,
            rgba(255, 255, 255, 0.25) 38%,
            rgba(255, 255, 255, 0.08) 100%
          );
          pointer-events: none;
          z-index: -1;
        }

        .panel::after {
          content: '';
          position: absolute;
          left: 24px;
          right: 24px;
          top: 12px;
          height: 1px;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.98) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          pointer-events: none;
          opacity: 0.88;
        }

        h1 {
          margin: 0;
          font-family: var(--font-display), 'Segoe UI', sans-serif;
          font-size: clamp(1.65rem, 3vw, 2.3rem);
          line-height: 1.1;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          text-shadow: 0 0 22px rgba(146, 232, 255, 0.28);
        }

        h2 {
          margin: 0;
          font-family: var(--font-display), 'Segoe UI', sans-serif;
          font-size: 0.95rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #4f667d;
        }

        .subhead {
          margin: 0;
          color: var(--ink-soft);
          max-width: 62ch;
        }

        .patientSection {
          display: grid;
          gap: 0.5rem;
          background: linear-gradient(
            165deg,
            rgba(255, 255, 255, 0.66),
            rgba(252, 244, 255, 0.52) 45%,
            rgba(241, 250, 255, 0.52) 100%
          );
          border: 1px solid rgba(255, 255, 255, 0.86);
          border-radius: 14px;
          padding: 0.9rem;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.94),
            0 8px 18px rgba(126, 157, 181, 0.1);
        }

        .patientMeta {
          margin: 0.25rem 0 0;
          color: #5f768c;
          font-size: 0.9rem;
        }

        label {
          font-size: 0.9rem;
          color: #4e667e;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        input,
        select,
        textarea,
        button {
          border-radius: 12px;
          border: 1px solid rgba(168, 198, 223, 0.42);
          font-size: 0.96rem;
          font-family: inherit;
        }

        input,
        select {
          height: 42px;
          padding: 0 0.75rem;
          background: linear-gradient(
            155deg,
            rgba(255, 255, 255, 0.82),
            rgba(250, 244, 255, 0.72) 50%,
            rgba(241, 249, 255, 0.72) 100%
          );
          color: #243446;
        }

        .editorGrid {
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        article {
          display: grid;
          gap: 0.45rem;
          padding: 0.8rem;
          border-radius: 14px;
          background: linear-gradient(170deg, var(--glass), var(--glass-deep));
          border: 1px solid rgba(255, 255, 255, 0.86);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.92);
        }

        textarea {
          width: 100%;
          min-height: 220px;
          padding: 0.75rem;
          line-height: 1.45;
          resize: vertical;
          color: #25374a;
          background: rgba(255, 255, 255, 0.78);
          transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
        }

        textarea:focus,
        input:focus,
        select:focus {
          outline: none;
          border-color: rgba(123, 174, 221, 0.92);
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 0 0 3px rgba(130, 182, 230, 0.2);
        }

        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          padding-top: 0.3rem;
        }

        button {
          height: 42px;
          padding: 0 1.05rem;
          font-weight: 600;
          border: none;
          background: linear-gradient(
            140deg,
            rgba(255, 147, 196, 0.9),
            rgba(137, 171, 255, 0.92) 45%,
            rgba(108, 223, 208, 0.92) 100%
          );
          color: #102338;
          cursor: pointer;
          transition: transform 120ms ease, opacity 120ms ease, filter 120ms ease;
          letter-spacing: 0.03em;
        }

        button:hover:not(:disabled) {
          transform: translateY(-1px) scale(1.01);
          filter: saturate(1.08);
          box-shadow: 0 4px 12px rgba(126, 166, 211, 0.26);
        }

        button:disabled {
          opacity: 0.44;
          cursor: not-allowed;
        }

        button.secondary {
          background: linear-gradient(
            150deg,
            rgba(255, 255, 255, 0.8),
            rgba(255, 240, 248, 0.7) 45%,
            rgba(236, 247, 255, 0.7) 100%
          );
          color: #324b63;
          border: 1px solid rgba(170, 198, 225, 0.5);
        }

        .status,
        .error {
          margin: 0;
          font-size: 0.92rem;
        }

        .status {
          color: #2f7a6c;
        }

        .error {
          color: #cb4168;
        }

        @media (max-width: 840px) {
          .page {
            padding: 1rem 0.8rem;
          }

          .brand {
            top: 14px;
            left: 14px;
            font-size: 0.78rem;
            letter-spacing: 0.14em;
          }

          .panel {
            border-radius: 18px;
            padding: 1rem;
          }

          .editorGrid {
            grid-template-columns: 1fr;
          }

          .orbA,
          .orbB {
            opacity: 0.22;
            animation: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .brand,
          .orb,
          .panel {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  );
}
