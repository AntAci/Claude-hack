import { readdir, readFile } from "fs/promises"
import path from "path"

import { ClaudeCare } from "@/components/claude-care"

type DatasetRecord = {
  id: string
  patient_name?: string
  date_of_birth?: string
  scenario: string
  tags: string[]
  raw_note: string
  patient_profile?: {
    setting?: string
  }
}

async function loadPatients() {
  const datasetDir = path.join(process.cwd(), "..", "dataset")
  const files = (await readdir(datasetDir))
    .filter((file) => file.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b))

  const records = await Promise.all(
    files.map(async (file, index) => {
      const fullPath = path.join(datasetDir, file)
      const content = await readFile(fullPath, "utf-8")
      const parsed = JSON.parse(content) as DatasetRecord

      return {
        id: parsed.id,
        name: parsed.patient_name ?? `Patient ${index + 1}`,
        dob: parsed.date_of_birth ?? "",
        scenario: parsed.scenario,
        tags: parsed.tags ?? [],
        setting: parsed.patient_profile?.setting ?? "Unknown setting",
        rawNote: parsed.raw_note,
      }
    }),
  )

  return records
}

export default async function HomePage() {
  const patients = await loadPatients()
  return <ClaudeCare patients={patients} />
}
