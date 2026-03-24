import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const googleApiKey = process.env.GEMINI_API_KEY;
const google = googleApiKey ? createGoogleGenerativeAI({ apiKey: googleApiKey }) : null;

function applyLocalSimplification(input: string, patientName: string): string {
  const replacements: Array<[RegExp, string]> = [
    [/\bPt\b/gi, 'Patient'],
    [/\bre\b/gi, 'regarding'],
    [/\bmx\b/gi, 'management'],
    [/\bLRTI\b/gi, 'lower chest infection'],
    [/\btds\b/gi, 'three times a day'],
    [/\bbd\b/gi, 'twice a day'],
    [/\bod\b/gi, 'once a day'],
    [/\bprn\b/gi, 'as needed'],
    [/\brpt\b/gi, 'repeat'],
    [/\bf\/u\b/gi, 'follow-up'],
    [/\bw\b/gi, 'with'],
    [/\bSOB\b/gi, 'shortness of breath'],
    [/\bsats\b/gi, 'oxygen levels'],
    [/\bd\/c\b/gi, 'discharged'],
    [/\babx\b/gi, 'antibiotics'],
    [/\bA&E\b/gi, 'the emergency department'],
    [/\bx(\d+)\s*days\b/gi, 'for $1 days'],
    [/\bq4h\b/gi, 'every 4 hours'],
  ];

  let normalized = input;
  for (const [pattern, replacement] of replacements) {
    normalized = normalized.replace(pattern, replacement);
  }

  normalized = normalized.replace(/\s+/g, ' ').trim();

  return [
    `${patientName}, here is your care plan in plain language:`,
    '',
    `Summary: ${normalized}`,
    '',
    'What to do now:',
    '- Follow the medicine and care instructions exactly as written above.',
    '- Rest and drink fluids unless your doctor has told you otherwise.',
    '- Contact your GP if symptoms are not improving as expected.',
    '',
    'Urgent help:',
    '- Seek urgent care now if breathing worsens, severe pain appears, confusion starts, or you cannot keep fluids down.',
  ].join('\n');
}

export async function POST(req: Request) {
  const { patientName, message } = (await req.json()) as {
    patientName?: string;
    message?: string;
  };

  if (!message?.trim()) {
    return Response.json({ error: 'Missing message' }, { status: 400 });
  }

  const safeName = patientName?.trim() || 'Patient';

  if (!google) {
    return Response.json({
      simplifiedText: applyLocalSimplification(message, safeName),
      usedFallback: true,
    });
  }

  try {
    const result = await generateText({
      model: google(process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'),
      system:
        'You are a clinical communication assistant. Rewrite notes into very clear, compassionate, plain English. Keep all safety-critical details. Do not diagnose beyond source text.',
      prompt: [
        `Patient name: ${safeName}`,
        'Rewrite the note using this exact structure:',
        '1) Plain summary',
        '2) What to do now (bullet list)',
        '3) Medicines (bullet list)',
        '4) Warning signs and when to get urgent help (bullet list)',
        '',
        'Source note:',
        message,
      ].join('\n'),
    });

    return Response.json({
      simplifiedText: result.text,
      usedFallback: false,
    });
  } catch {
    return Response.json({
      simplifiedText: applyLocalSimplification(message, safeName),
      usedFallback: true,
    });
  }
}
