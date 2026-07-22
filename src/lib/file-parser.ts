// Client-side tender attachment parser. Handles the file formats a buyer
// will realistically send with an ITT/PQQ: plain text and markdown; CSV;
// JSON; Word (.docx via mammoth); Excel (.xlsx/.xls/.csv via SheetJS);
// image previews. PDF is deliberately deferred until a server route is
// wired — client-side PDF parsers ship megabytes of code and often
// mis-extract scanned pages, so we surface an explicit "parse server-side"
// affordance instead of shipping unreliable extraction.

import mammoth from "mammoth";
import * as XLSX from "xlsx";

export type ParsedKind =
  | "text"
  | "markdown"
  | "html"
  | "csv"
  | "json"
  | "docx"
  | "spreadsheet"
  | "image"
  | "pdf-needs-server"
  | "unsupported";

export interface ParsedAttachment {
  file: File;
  kind: ParsedKind;
  text?: string;        // extracted plain text
  html?: string;        // for docx conversions
  imageUrl?: string;    // object URL for image preview
  sheets?: Array<{ name: string; rows: string[][] }>;
  bytes: number;
  warning?: string;
}

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB per attachment

export async function parseAttachment(file: File): Promise<ParsedAttachment> {
  if (file.size > MAX_BYTES) {
    return {
      file,
      kind: "unsupported",
      bytes: file.size,
      warning: `File is larger than ${Math.round(MAX_BYTES / 1024 / 1024)}MB. Split it or upload via the server route once wired.`,
    };
  }

  const name = file.name.toLowerCase();
  const ext = name.split(".").pop() ?? "";
  const type = file.type;

  // Plain text-ish formats
  if (["txt", "md", "markdown", "log", "text"].includes(ext) || type.startsWith("text/")) {
    const text = await file.text();
    return {
      file,
      kind: ext === "md" || ext === "markdown" ? "markdown" : "text",
      text,
      bytes: file.size,
    };
  }

  // JSON
  if (ext === "json" || type === "application/json") {
    const raw = await file.text();
    try {
      const pretty = JSON.stringify(JSON.parse(raw), null, 2);
      return { file, kind: "json", text: pretty, bytes: file.size };
    } catch {
      return { file, kind: "json", text: raw, bytes: file.size, warning: "Invalid JSON — showing raw text." };
    }
  }

  // CSV via SheetJS so it lines up with xlsx tables
  if (ext === "csv" || type === "text/csv") {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheets = wb.SheetNames.map((n) => ({
      name: n,
      rows: XLSX.utils.sheet_to_json<string[]>(wb.Sheets[n], { header: 1, blankrows: false }) as string[][],
    }));
    return { file, kind: "csv", sheets, bytes: file.size };
  }

  // Excel and OpenDocument spreadsheets
  if (["xlsx", "xlsm", "xls", "ods", "xlsb"].includes(ext)) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheets = wb.SheetNames.map((n) => ({
      name: n,
      rows: XLSX.utils.sheet_to_json<string[]>(wb.Sheets[n], { header: 1, blankrows: false }) as string[][],
    }));
    return { file, kind: "spreadsheet", sheets, bytes: file.size };
  }

  // Word documents
  if (ext === "docx" || type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const buf = await file.arrayBuffer();
    const [{ value: text }, { value: html }] = await Promise.all([
      mammoth.extractRawText({ arrayBuffer: buf }),
      mammoth.convertToHtml({ arrayBuffer: buf }),
    ]);
    return { file, kind: "docx", text, html, bytes: file.size };
  }

  // Legacy .doc — SheetJS/mammoth can't read it; require conversion.
  if (ext === "doc") {
    return {
      file,
      kind: "unsupported",
      bytes: file.size,
      warning: "Legacy .doc format — re-save as .docx to read in-browser, or route through the server parser.",
    };
  }

  // Images — offer a preview + OCR handoff placeholder.
  if (type.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "tiff"].includes(ext)) {
    return {
      file,
      kind: "image",
      imageUrl: URL.createObjectURL(file),
      bytes: file.size,
      warning: "Image preview only. OCR runs server-side once the vision route is wired.",
    };
  }

  // PDFs — deferred to server route (client PDF stacks are 3–5MB and unreliable on scans).
  if (ext === "pdf" || type === "application/pdf") {
    return {
      file,
      kind: "pdf-needs-server",
      bytes: file.size,
      warning: "PDF extraction runs server-side once the parse endpoint is wired. File is queued and available for the AI panel.",
    };
  }

  // PowerPoint / other office formats — placeholder, server-side extraction planned.
  if (["pptx", "ppt", "odp"].includes(ext)) {
    return {
      file,
      kind: "unsupported",
      bytes: file.size,
      warning: "Slide decks are parsed server-side once the office route is wired.",
    };
  }

  return {
    file,
    kind: "unsupported",
    bytes: file.size,
    warning: `No parser for .${ext || "unknown"} in-browser. Server-side parser will pick it up when wired.`,
  };
}

export function humanBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}