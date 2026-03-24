# ClaudeCare

ClaudeCare is an AI-powered patient understanding assistant that helps people make sense of confusing medical information after they leave a clinic, hospital, pharmacy, or appointment.

Many patients receive discharge summaries, medication instructions, referral letters, or treatment plans written in dense clinical language. Even when care is technically available, people often struggle to understand what they were told, what matters most, what to do next, and when they should seek further help.

ClaudeCare is designed to close that gap.

Rather than trying to diagnose illness or replace clinicians, ClaudeCare focuses on comprehension, follow-through, and safer self-management. The app provides a two-sided workflow: a staff-facing dashboard where GPs or healthcare workers can transform clinical notes into plain English, and a patient-facing voice assistance page where patients can read their care plan and ask questions via an AI voice agent.

<img width="1783" height="924" alt="Screenshot 2026-03-24 at 19 17 59" src="https://github.com/user-attachments/assets/a77b18e8-cf8f-43a3-9ac2-1d2a500287ae" />
<img width="1780" height="890" alt="Screenshot 2026-03-24 at 19 18 30" src="https://github.com/user-attachments/assets/a6396e0a-9a5c-4d5c-993f-ecf17e073d24" />

## What It Does

ClaudeCare turns complex medical instructions into a patient-friendly care plan. The structured output includes:

- **What this means** — a plain-English narrative explanation of the clinical note
- **What you should do now** — immediate action items
- **Medicines** — explicit dosage, frequency, duration, and purpose for each medication
- **When to contact your GP or care team** — non-urgent triggers
- **Get urgent help now if** — red-flag symptoms requiring escalation
- **Follow-up** — next steps, appointments, and referrals

Medical abbreviations (e.g. tds, SOB, PRN) are automatically expanded into everyday language.

## How It Works

ClaudeCare has two sides: a **staff dashboard** and a **patient voice page**.

### Staff Dashboard

1. A GP or healthcare worker selects a patient from the dataset.
2. The patient's raw clinical note loads into a before/after editor.
3. Clicking **"Make It Patient-Friendly"** sends the note to Claude, which rewrites it in warm, supportive UK English.
4. The staff member can then:
   - **Send as Text** — queue the simplified note for SMS delivery
   - **Text + AI Call** — send the text and trigger an automated phone call
   - **Copy Voice Link** — generate a secure, time-limited link the patient can use to access their care plan and speak with an AI voice assistant

### Patient Voice Page

1. The patient receives a link (via SMS or shared by staff).
2. They open the link and verify their identity by entering their date of birth.
3. Once verified, they can read their care plan and interact with an ElevenLabs voice agent to ask questions about their medicines, warning signs, or next steps.
4. Links expire after 48 hours for security.

## Tech Stack

- **Next.js 15** with React 19 and TypeScript
- **Tailwind CSS v4** with a glass-morphism design system
- **Claude** for AI-powered text simplification (with local regex fallback)
- **ElevenLabs ConvAI** for real-time voice assistance
- **shadcn/ui** component library
- **Vercel AI SDK** for unified AI model integration

## Why This Matters

Healthcare can be inaccessible because of complexity and jargon, not only cost or waiting times. Misunderstanding discharge or treatment instructions can lead to:

- Missed medication doses
- Poor treatment adherence
- Avoidable complications
- Unnecessary anxiety

ClaudeCare addresses this by helping patients understand healthcare information in practical, actionable terms — and giving them a way to ask questions in their own words via voice.

## Target Users

ClaudeCare serves two groups:

**Staff / GPs:**
- Healthcare workers who need to communicate care plans to patients
- GPs preparing post-appointment summaries
- Discharge teams sending patients home with instructions

**Patients and carers:**
- People leaving hospital with discharge paperwork
- People receiving complicated prescription instructions
- Family members supporting recovery at home
- Users with low health literacy or language barriers
- International students, migrants, and others unfamiliar with the UK healthcare system

## Features

### Core Features

- Patient selection dashboard with search and filtering by name, ID, scenario, or tags
- Before/after note editor showing clinical text alongside the simplified version
- AI-powered text simplification via Claude
- Local fallback simplification when the API is unavailable
- SMS delivery of simplified care plans
- SMS + automated AI phone call delivery
- Secure, time-limited voice assistance links
- DOB-based identity verification for patient access
- ElevenLabs voice agent personalised with the patient's name and care plan
- Safety disclaimers and NHS 111 / GP contact guidance throughout

### Stretch Feature

- Teach-back mode with 2-3 simple questions to check understanding

## Example User Flow

**Staff side:**

1. A GP selects patient Margaret Thompson from the dashboard.
2. Her clinical note loads — it mentions a mild infection, a 7-day antibiotic course, hydration advice, GP follow-up triggers, and red flags for chest pain or breathlessness.
3. The GP clicks "Make It Patient-Friendly." The AI rewrites the note in plain English, addressing Margaret by name.
4. The GP clicks "Copy Voice Link" and sends it to Margaret via text.

**Patient side:**

1. Margaret opens the link on her phone.
2. She enters her date of birth to verify her identity.
3. She reads the care plan — it explains her diagnosis simply, lists her medicines with clear instructions, and separates urgent warning signs.
4. She taps the voice button and asks: "Do I take the antibiotics with food?" The AI voice agent answers based on her specific care plan.

## Ethical Approach

ClaudeCare is designed to support patient understanding, not clinical judgment.

Key safeguards:

- Clear limitations and non-diagnostic framing
- Privacy-conscious handling of user data
- Time-limited, DOB-verified access to patient information
- Conservative escalation messaging for urgent symptoms
- Encouragement to seek professional care when symptoms worsen or instructions are unclear
- Avoiding invented facts beyond the source text
- Separating extracted facts from explanatory interpretation where possible
- Prominent NHS 111 and GP contact guidance on every patient-facing page

## Why AI Is Useful Here

Medical documents vary widely in style, complexity, and terminology. AI is useful for:

- Translating dense language into simpler explanations
- Expanding medical abbreviations automatically
- Identifying and prioritising important actions
- Reorganising information around patient needs
- Powering voice conversations so patients can ask questions naturally

Used responsibly, this improves access to healthcare information without replacing expert care.

## Vision

ClaudeCare aims to make healthcare communication understandable by default. Future directions may include:

- Multi-language support
- Carer-specific explanation modes
- Accessible output formats
- Integration with reminders for appointments or medications

The core idea remains simple: when people understand their healthcare instructions, they can take better action, ask better questions, and know when to seek help.

## Disclaimer

ClaudeCare does not diagnose, prescribe, or replace professional medical advice. If symptoms worsen, instructions are unclear, or urgent symptoms appear, users should contact a qualified healthcare professional or emergency services immediately.
