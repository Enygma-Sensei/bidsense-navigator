import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { FileText, Paperclip, Trash2, Upload, AlertTriangle, FileSpreadsheet, FileImage, FileType2, FileArchive } from "lucide-react";

import { humanBytes, parseAttachment, type ParsedAttachment } from "../lib/file-parser";

export const Route = createFileRoute("/attachments")({
  head: () => ({
    meta: [
      { title: "Tender Attachments — BidSense" },
      {
        name: "description",
        content:
          "Drop tender documents (Word, Excel, CSV, JSON, TXT/MD, images, PDF) and BidSense extracts the text for the AI agent panel to reason over.",
      },
      { property: "og:title", content: "Tender Attachments — BidSense" },
      { property: "og:description", content: "Parse tender documents client-side for the BidSense AI panel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Attachments,
});

function Attachments() {
  const [items, setItems] = useState<ParsedAttachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const onFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    const parsed: ParsedAttachment[] = [];
    for (const f of Array.from(files)) {
      try {
        parsed.push(await parseAttachment(f));
      } catch (err) {
        parsed.push({
          file: f,
          kind: "unsupported",
          bytes: f.size,
          warning: err instanceof Error ? err.message : "Failed to parse.",
        });
      }
    }
    setItems((prev) => [...parsed, ...prev]);
    setBusy(false);
  }, []);

  const totalChars = items.reduce((n, i) => n + (i.text?.length ?? 0), 0);

  return (
    <div className="px-8 py-10 max-w-6xl mx-auto space-y-6">
      <header className="space-y-1">
        <div className="text-xs uppercase tracking-[0.2em] text-gold">Tender Attachments</div>
        <h1 className="text-3xl font-bold">Read the tender documents</h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Drop the whole ITT/PQQ pack — Word, Excel, CSV, JSON, plain text, Markdown, images and PDFs.
          BidSense extracts the text and hands it straight to the AI agent panel. Parsing runs in your
          browser; files stay on your device until you invoke the AI pipeline.
        </p>
      </header>

      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void onFiles(e.dataTransfer.files);
        }}
        className="block cursor-pointer rounded-lg border-2 border-dashed border-border hover:border-gold bg-card p-10 text-center transition-colors"
      >
        <input
          type="file"
          multiple
          hidden
          onChange={(e) => void onFiles(e.target.files)}
          accept=".txt,.md,.markdown,.csv,.json,.docx,.doc,.xlsx,.xls,.ods,.xlsb,.pptx,.pdf,image/*,text/*"
        />
        <Upload className="h-8 w-8 mx-auto text-gold" />
        <div className="mt-3 text-sm font-semibold">Drop files here or click to browse</div>
        <div className="text-xs text-muted-foreground mt-1">
          Common formats: DOCX · XLSX · CSV · TXT · MD · JSON · PDF · Images
        </div>
      </label>

      {busy && <div className="text-sm text-muted-foreground">Parsing…</div>}

      {items.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div>
            {items.length} file{items.length === 1 ? "" : "s"} · {humanBytes(items.reduce((n, i) => n + i.bytes, 0))} · {totalChars.toLocaleString()} chars extracted
          </div>
          <button onClick={() => setItems([])} className="hover:text-destructive inline-flex items-center gap-1">
            <Trash2 className="h-3 w-3" /> Clear all
          </button>
        </div>
      )}

      <div className="space-y-3">
        {items.map((it, idx) => {
          const id = `${it.file.name}-${idx}`;
          const open = openId === id;
          return (
            <div key={id} className="rounded-lg border border-border bg-card overflow-hidden">
              <button
                onClick={() => setOpenId(open ? null : id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/40"
              >
                <KindIcon kind={it.kind} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{it.file.name}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {it.kind} · {humanBytes(it.bytes)}
                    {it.text && <> · {it.text.length.toLocaleString()} chars</>}
                    {it.sheets && <> · {it.sheets.length} sheet{it.sheets.length === 1 ? "" : "s"}</>}
                  </div>
                </div>
                {it.warning && (
                  <div className="inline-flex items-center gap-1 text-[10px] text-warning">
                    <AlertTriangle className="h-3 w-3" /> {it.warning}
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setItems((prev) => prev.filter((_, i) => i !== idx));
                  }}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </button>
              {open && <Preview item={it} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KindIcon({ kind }: { kind: ParsedAttachment["kind"] }) {
  const cls = "h-5 w-5 text-gold shrink-0";
  switch (kind) {
    case "spreadsheet":
    case "csv":
      return <FileSpreadsheet className={cls} />;
    case "image":
      return <FileImage className={cls} />;
    case "docx":
      return <FileType2 className={cls} />;
    case "pdf-needs-server":
      return <FileArchive className={cls} />;
    case "unsupported":
      return <Paperclip className={cls} />;
    default:
      return <FileText className={cls} />;
  }
}

function Preview({ item }: { item: ParsedAttachment }) {
  if (item.kind === "image" && item.imageUrl) {
    return (
      <div className="border-t border-border p-4 bg-background/40">
        <img src={item.imageUrl} alt={item.file.name} className="max-h-96 mx-auto rounded" />
      </div>
    );
  }
  if (item.sheets && item.sheets.length > 0) {
    return (
      <div className="border-t border-border p-4 bg-background/40 space-y-4 max-h-96 overflow-auto">
        {item.sheets.map((s) => (
          <div key={s.name}>
            <div className="text-xs font-semibold mb-1">{s.name}</div>
            <table className="w-full text-[11px] border-collapse">
              <tbody>
                {s.rows.slice(0, 100).map((row, i) => (
                  <tr key={i} className={i === 0 ? "bg-secondary/40 font-semibold" : ""}>
                    {row.map((cell, j) => (
                      <td key={j} className="border border-border px-1.5 py-1 align-top">{String(cell ?? "")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {s.rows.length > 100 && <div className="text-[10px] text-muted-foreground mt-1">…{s.rows.length - 100} more rows</div>}
          </div>
        ))}
      </div>
    );
  }
  if (item.text) {
    return (
      <pre className="border-t border-border p-4 bg-background/40 text-[11px] whitespace-pre-wrap max-h-96 overflow-auto">
        {item.text.slice(0, 20000)}
        {item.text.length > 20000 && `\n\n…truncated at 20,000 chars (${item.text.length.toLocaleString()} total)`}
      </pre>
    );
  }
  return (
    <div className="border-t border-border p-4 bg-background/40 text-sm text-muted-foreground">
      {item.warning ?? "Nothing to preview."}
    </div>
  );
}