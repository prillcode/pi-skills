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
				await this.switchFlow(false);
				break;
			case "switch_new":
				await this.switchFlow(true);
				break;
			case "menu":
				await this.showMenu();
				break;
		}
	}

	private async showMenu(): Promise<void> {
		const items: SelectItem[] = [
			{ value: "switch", label: "Switch session", description: "Switch to another session in this window" },
			{ value: "switch_new", label: "Open in new terminal", description: "Open session in a separate pi process" },
		];

		const result = await this.ctx.ui.select("Session actions:", items);
		if (result?.value) {
			await this.handleAction(result.value);
		}
	}

	private async switchFlow(openNew: boolean): Promise<void> {
		if (this.sessions.length === 0) {
			this.ctx.ui.notify("No sessions available", "warning");
			return;
		}

		const items: SelectItem[] = this.sessions.map((s) => ({
			value: s.file,
			label: `${s.isCurrent ? "● " : "  "}${s.name}${s.isBookmarked ? " ★" : ""}`,
			description: `${getRelativeTime(s.created)} · ${s.messageCount} msgs · ${s.tokenCount.toLocaleString()} tokens`,
		}));

		const result = await this.ctx.ui.select(
			openNew ? "Open session in new terminal:" : "Switch to session:",
			items,
		);
		if (!result?.value) return;

		const selected = this.sessions.find((s) => s.file === result!.value);
		if (selected?.isCurrent) {
			this.ctx.ui.notify("Already in this session", "info");
			return;
		}

		if (openNew) {
			// Launch new terminal with pi session
			const { exec } = await import("node:child_process");
			const terminal = process.env.TERMINAL || "alacritty";
			try {
				exec(`${terminal} -e pi --session "${result.value}" &`, (err) => {
					if (err) this.ctx.ui.notify(`Failed to launch terminal: ${err.message}`, "error");
				});
				this.ctx.ui.notify(`Opened session in new terminal`, "success");
			} catch (error) {
				this.ctx.ui.notify(`Failed to launch: ${error}`, "error");
			}
			return;
		}

		try {
			const cmdCtx = this.ctx as unknown as ExtensionCommandContext;
			if (cmdCtx.switchSession) {
				await cmdCtx.switchSession(result.value);
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

		// Summary
		const totalTokens = this.sessions.reduce((sum, s) => sum + s.tokenCount, 0);
		const totalCost = this.sessions.reduce((sum, s) => sum + s.cost, 0);
		const current = this.sessions.find((s) => s.isCurrent);

		lines.push(`  ${bold(accent("Sessions"))} ${muted(String(this.sessions.length))} ${dim("(this repo)")}`);
		lines.push(`  ${bold("Total:")} ${muted(totalTokens.toLocaleString())} tokens · ${muted(`$${totalCost.toFixed(3)}`)}`);
		lines.push("");

		if (current) {
			lines.push(`  ${bold(accent("Current:"))}`);
			lines.push(`    ${accent("●")} ${current.name}`);
			lines.push(`      ${dim(`${getRelativeTime(current.created)} · ${current.messageCount} messages`)}`);
			lines.push("");
		}

		// Recent sessions
		const recent = this.sessions.filter((s) => !s.isCurrent).slice(0, 6);
		if (recent.length > 0) {
			lines.push(`  ${bold(accent("Recent:"))}`);
			for (const session of recent) {
				const marker = session.isBookmarked ? "★ " : "  ";
				const name = formatSessionName(session.file).slice(0, 30);
				lines.push(`    ${dim(marker)}${muted(name)}`);
				lines.push(`      ${dim(`${getRelativeTime(session.created)} · ${session.messageCount} msgs · ${session.tokenCount.toLocaleString()} tokens`)}`);
			}
			if (this.sessions.length > 7) {
				lines.push(`    ${dim(`...and ${this.sessions.length - 7} more`)}`);
			}
		}

		return lines;
	}
}
