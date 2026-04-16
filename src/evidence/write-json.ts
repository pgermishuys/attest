import { writeFileSync } from "node:fs"
import type { EvidenceRecord } from "../domain/evidence"

export const writeEvidenceJson = (filePath: string, record: EvidenceRecord): void => {
  writeFileSync(filePath, `${JSON.stringify(record, null, 2)}\n`, "utf8")
}
