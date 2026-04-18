/**
 * SessionPanel Component - Pi session management UI
 */

import type { ExtensionContext, ExtensionCommandContext } from "@mariozechner/pi-coding-agent";
import type { SelectItem } from "@mariozechner/pi-tui";
import {
  listSessions,
  formatSessionName,
  getRelativeTime,
  type SessionInfo,
} from "../utils/sessions.js";

export class SessionPanel {
  private ctx: ExtensionContext;
  private onRefresh: () => void;
  private sessions: SessionInfo[] = [];
  private isLoading = true;

  constructor(ctx: ExtensionContext, onRefresh: () => void) {
    this.ctx = ctx;
    this.onRefresh = onRefresh;
    void this.refresh();
  }

  async refresh(): Promise<void> {
    this.isLoading = true;
    try {
      this.sessions = await listSessions(this.ctx.cwd);
      // Sort by bookmarked first, then by date
      this.sessions.sort((a, b) => {
        if (a.isBookmarked && !b.isBookmarked) return -1;
        if (!a.isBookmarked && b.isBookmarked) return 1;
        return b.created.getTime() - a.created.getTime();
      });
    } catch {
      this.sessions = [];
    }
    this.isLoading = false;
    this.onRefresh();
  }

  async handleAction(action: string): Promise<void> {
    switch (action) {
      case "switch":
        await this.switchFlow();
        break;
      case "bookmark":
        this.ctx.ui.notify("Bookmark feature coming soon", "info");
        break;
    }
  }

  private async switchFlow(): Promise<void> {
    if (this.sessions.length === 0) {
      this.ctx.ui.notify("No sessions available", "warning");
      return;
    }

    const items: SelectItem[] = this.sessions.map((s) => ({
      value: s.file,
      label: `${s.isCurrent ? "● " : "  "}${s.name}${s.isBookmarked ? " ★" : ""}`,
      description: `${getRelativeTime(s.created)} · ${s.messageCount} msgs · ${s.tokenCount.toLocaleString()} tokens`,
    }));

    const result = await this.ctx.ui.select("Switch to session:", items);
    if (!result) return;

    // Check if it's the current session
    const selected = this.sessions.find((s) => s.file === result);
    if (selected?.isCurrent) {
      this.ctx.ui.notify("Already in this session", "info");
      return;
    }

    try {
      // Use the command context to switch sessions
      const cmdCtx = this.ctx as unknown as ExtensionCommandContext;
      if (cmdCtx.switchSession) {
        await cmdCtx.switchSession(result);
        this.ctx.ui.notify("Switched session", "success");
      } else {
        this.ctx.ui.notify("Session switching not available in this context", "error");
      }
    } catch (error) {
      this.ctx.ui.notify(`Failed to switch session: ${error}`, "error");
    }
  }

  render(theme: ReturnType<ExtensionContext["ui"]["theme"]>, _width: number): string[] {
    const lines: string[] = [];
    const accent = (s: string) => theme.fg("accent", s);
    const muted = (s: string) => theme.fg("muted", s);
    const dim = (s: string) => theme.fg("dim", s);
    const bold = (s: string) => theme.bold(s);

    if (this.isLoading) {
      lines.push("", "  Loading sessions...", "");
      return lines;
    }

    if (this.sessions.length === 0) {
      lines.push("", "  No sessions found", "");
      return lines;
    }

    // Summary stats
    const totalTokens = this.sessions.reduce((sum, s) => sum + s.tokenCount, 0);
    const totalCost = this.sessions.reduce((sum, s) => sum + s.cost, 0);
    const current = this.sessions.find((s) => s.isCurrent);

    lines.push(`  ${bold(accent("Sessions:"))} ${muted(String(this.sessions.length))}`);
    lines.push(`  ${bold("Total Tokens:")} ${muted(totalTokens.toLocaleString())}`);
    lines.push(`  ${bold("Total Cost:")} ${muted(`$${totalCost.toFixed(3)}`)}`);
    lines.push("");

    // Current session
    if (current) {
      lines.push(`  ${bold(accent("Current Session:"))}`);
      lines.push(`    ${accent("●")} ${current.name}`);
      lines.push(`      ${dim(`${getRelativeTime(current.created)} · ${current.messageCount} messages`)}`);
      lines.push("");
    }

    // Recent sessions (up to 6)
    lines.push(`  ${bold(accent("Recent Sessions:"))}`);
    const recent = this.sessions.filter((s) => !s.isCurrent).slice(0, 6);

    for (const session of recent) {
      const marker = session.isBookmarked ? "★ " : "  ";
      const name = formatSessionName(session.file).slice(0, 30);
      lines.push(`    ${dim(marker)}${muted(name)}`);
      lines.push(`      ${dim(`${getRelativeTime(session.created)} · ${session.messageCount} msgs · ${session.tokenCount.toLocaleString()} tokens`)}`);
    }

    if (this.sessions.length > 7) {
      lines.push(`    ${dim(`...and ${this.sessions.length - 7} more`)}`);
    }

    lines.push("");
    lines.push(`  ${dim("Actions: S-switch session • B-toggle bookmark")}`);

    return lines;
  }
}
