import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Lock } from "lucide-react";

import { ALL_PERMISSIONS, CLIENT_FORBIDDEN, PERMISSION_LABELS, can, useCan } from "../lib/rbac";
import type { ViewerRole } from "../lib/viewer-role";
import { roleLabels } from "../lib/viewer-role";

const ROLES: ViewerRole[] = ["client", "reseller", "psl", "owner"];

export const Route = createFileRoute("/access")({
  head: () => ({
    meta: [
      { title: "Access Control Matrix — BidSense" },
      {
        name: "description",
        content:
          "The strict role-based access matrix enforced across BidSense: what owner, resellers, PSLs and clients can see and do — and what clients must never see.",
      },
      { property: "og:title", content: "Access Control Matrix — BidSense" },
      { property: "og:description", content: "RBAC matrix and client-forbidden list for BidSense." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccessPage,
});

function AccessPage() {
  const isOwner = useCan("view.partner_audit_trail"); // owner-scoped read
  return (
    <div className="px-8 py-10 max-w-6xl mx-auto space-y-6">
      <header className="space-y-1">
        <div className="text-xs uppercase tracking-[0.2em] text-gold">Strict Protocol</div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-gold" /> Role-based access control
        </h1>
        <p className="text-muted-foreground text-sm max-w-3xl">
          Every internal surface consults this matrix. Owners see the full economics; resellers and PSLs
          see only their own commercial surface; clients see only client-facing information. Anything on
          the &ldquo;Client-forbidden&rdquo; list is stripped from server responses to non-owner roles, not
          just hidden in the UI.
        </p>
      </header>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-xs">
          <thead className="bg-secondary/50 uppercase tracking-widest text-[10px]">
            <tr>
              <th className="text-left px-3 py-2">Permission</th>
              {ROLES.map((r) => (
                <th key={r} className="text-center px-3 py-2">
                  {roleLabels[r]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_PERMISSIONS.map((p) => (
              <tr key={p} className="border-t border-border">
                <td className="px-3 py-2">{PERMISSION_LABELS[p]}</td>
                {ROLES.map((r) => (
                  <td key={r} className="text-center px-3 py-2">
                    {can(r, p) ? (
                      <span className="text-success">✓</span>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-2">
        <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
          <Lock className="h-4 w-4" /> Client-forbidden — never expose to client sessions
        </div>
        <ul className="list-disc pl-5 text-xs space-y-1 text-destructive/90">
          {CLIENT_FORBIDDEN.map((p) => (
            <li key={p}>{PERMISSION_LABELS[p]}</li>
          ))}
        </ul>
      </section>

      {!isOwner && (
        <div className="text-[10px] text-muted-foreground">
          You are viewing this matrix in a non-owner role. Owners see additional operational controls to
          edit the matrix — switch the viewer role in the sidebar to see them.
        </div>
      )}
    </div>
  );
}