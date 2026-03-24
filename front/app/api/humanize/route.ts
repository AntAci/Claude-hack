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
    'What this means',
    `${patientName}, ${normalized}`,
    '',
    'What you should do now',
    '- Follow the medicine and care instructions exactly as written above.',
    '- Rest and drink plenty of fluids unless your doctor has told you otherwise.',
    '',
    'Medicines',
    '- Please take your medicines as described in the note above.',
    '',
    'When to contact your GP or care team',
    '- If your symptoms are not improving as expected after finishing your course of treatment.',
    '',
    'Get urgent help now if',
    '- Breathing worsens, severe pain appears, confusion starts, or you cannot keep fluids down.',
    '',
    'Follow-up',
    '- Contact your GP if symptoms are not improving as expected.',
    '',
    'Important',
    'This information is to help you understand your note more clearly, but it does not replace advice from a doctor or other healthcare professional.',
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
      system: [
        'You are a thoughtful, experienced UK GP or pharmacist sitting with a patient and explaining their clinical note in plain, warm, natural English.',
        'Follow the instructions and output format exactly. Do not deviate from the format. Do not add markdown formatting such as bold or headers with #.',
        '',
        'Critical safety rules:',
        '- Do not add any new warning signs, symptoms, medicines, follow-up steps, or advice that are not explicitly present in the source note.',
        '- Preserve all red flags and escalation instructions exactly in meaning.',
        '- Rewrite all shorthand and abbreviations fully into natural language. Never leave fragments like "c/w", "1 wk", "tds", "bd", "od", "prn", "mx", "abx", "SOB", "sats", "d/c", "f/u", "A&E", "Pt", "re" in the output.',
        '- The "Medicines" section must explicitly restate each medicine, its dose, how often to take it, for how long, and what it is for — all in plain English.',
        '- The "What this means" section must sound like a human explaining to a friend what happened. It must not sound like an edited clinical note. Write it as a natural paragraph.',
        '- If a patient name is provided, only show it as a greeting at the very start (e.g. "Hi Eleanor,"). Never jam the name into the middle of a sentence.',
        '- Never leave a section empty. If the source note does not mention medicines, write "No specific medicines were mentioned in your note."',
        '- Never copy unexplained medical fragments into the output.',
      ].join('\n'),
      prompt: [
        `Patient name: ${safeName}`,
        '',
        'Rewrite the following UK clinical note into a patient-friendly explanation.',
        '',
        'Requirements:',
        '- Keep all important medical information.',
        '- Expand every abbreviation into full plain English.',
        '- Use simple, natural UK English that anyone can understand.',
        '- Make it sound like a thoughtful GP or pharmacist speaking directly to the patient.',
        '- Be clear, calm, and supportive.',
        '- Preserve all safety advice and red flags exactly as they appear in the note.',
        '- Do not add new medical advice that is not in the source note.',
        '- Do not guess or invent information if something is unclear.',
        '',
        'Format the answer exactly like this (use these exact section headings, no markdown, no bold):',
        '',
        'What this means',
        '[A warm, natural paragraph explaining what happened and why, as if speaking to the patient face to face. Start with "Hi [name]," if a name is provided.]',
        '',
        'What you should do now',
        '- [action item from the note]',
        '- [action item from the note]',
        '',
        'Medicines',
        '- [Medicine name] — [dose] — [how often] — [for how long] — [what it is for, in plain English]',
        '- [repeat for each medicine mentioned]',
        '',
        'When to contact your GP or care team',
        '- [each non-urgent escalation trigger from the note, in plain English]',
        '',
        'Get urgent help now if',
        '- [each urgent/red-flag symptom from the note, in plain English]',
        '',
        'Follow-up',
        '[follow-up advice from the note in plain English]',
        '',
        'Important',
        'This information is to help you understand your note more clearly, but it does not replace advice from a doctor or other healthcare professional.',
        '',
        'Clinical note:',
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
