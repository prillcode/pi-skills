/**
 * Dashboard Component - Main dashboard UI
 */

import type { AssistantMessage } from "@mariozechner/pi-ai";
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Key, matchesKey, visibleWidth, truncateToWidth } from "@mariozechner/pi-tui";
import type { TodoItem, DashboardTab } from "../types.js";

export class DashboardComponent {
	private ctx: ExtensionContext;
	private onClose: () => void;
	private tui: { requestRender: () => void };
	private todos: TodoItem[];
	private selectedTab: DashboardTab = "overview";
	private cachedLines: string[] = [];
	private cachedWidth = 0;
	private version = 0;

	constructor(
		tui: { requestRender: () => void },
		ctx: ExtensionContext,
		onClose: () => void,
		todos: TodoItem[],
	) {
		this.tui = tui;
		this.ctx = ctx;
		this.onClose = onClose;
		this.todos = todos;
	}

	handleInput(data: string): void {
		if (matchesKey(data, Key.escape) || matchesKey(data, "q")) {
			this.onClose();
			return;
		}

		if (matchesKey(data, "1")) {
			this.selectedTab = "overview";
			this.version++;
			this.tui.requestRender();
		} else if (matchesKey(data, "2")) {
			this.selectedTab = "todos";
			this.version++;
			this.tui.requestRender();
		} else if (matchesKey(data, "3")) {
			this.selectedTab = "stats";
			this.version++;
			this.tui.requestRender();
		} else if (matchesKey(data, "4")) {
			this.selectedTab = "git";
			this.version++;
			this.tui.requestRender();
		} else if (matchesKey(data, "5")) {
			this.selectedTab = "sessions";
			this.version++;
			this.tui.requestRender();
		}
	}

	invalidate(): void {
		this.cachedWidth = 0;
	}

	render(width: number): string[] {
		if (width === this.cachedWidth && this.cachedLines.length > 0) {
			return this.cachedLines;
		}

		const theme = this.ctx.ui.theme;
		const lines: string[] = [];

		// Helper functions for styling
		const accent = (s: string) => theme.fg("accent", s);
		const muted = (s: string) => theme.fg("muted", s);
		const dim = (s: string) => theme.fg("dim", s);
		const success = (s: string) => theme.fg("success", s);
		const bold = (s: string) => theme.bold(s);

		// Header
		const title = ` ${bold(accent("π Dashboard"))} `;
		lines.push(this.centerLine(title, width));
		lines.push("");

		// Tabs
		const tab1 = this.selectedTab === "overview" ? bold(accent("[1] Overview")) : dim("[1] Overview");
		const tab2 = this.selectedTab === "todos" ? bold(accent("[2] Todos")) : dim("[2] Todos");
		const tab3 = this.selectedTab === "stats" ? bold(accent("[3] Stats")) : dim("[3] Stats");
		const tab4 = this.selectedTab === "git" ? bold(accent("[4] Git")) : dim("[4] Git");
		const tab5 = this.selectedTab === "sessions" ? bold(accent("[5] Sessions")) : dim("[5] Sessions");
		lines.push(this.centerLine(`${tab1}  ${tab2}  ${tab3}  ${tab4}  ${tab5}`, width));
		lines.push("");

		// Content based on selected tab
		switch (this.selectedTab) {
			case "overview":
				lines.push(...this.renderOverview(width));
				break;
			case "todos":
				lines.push(...this.renderTodos(width));
				break;
			case "stats":
				lines.push(...this.renderStats(width));
				break;
			case "git":
				lines.push(...this.renderGitPlaceholder(width));
				break;
			case "sessions":
				lines.push(...this.renderSessionsPlaceholder(width));
				break;
		}

		// Footer hint
		lines.push("");
		lines.push(this.centerLine(dim("1-5 switch tabs • Q/ESC close"), width));

		this.cachedLines = lines;
		this.cachedWidth = width;
		return lines;
	}

	private renderOverview(width: number): string[] {
		const theme = this.ctx.ui.theme;
		const lines: string[] = [];

		const accent = (s: string) => theme.fg("accent", s);
		const muted = (s: string) => theme.fg("muted", s);
		const dim = (s: string) => theme.fg("dim", s);
		const success = (s: string) => theme.fg("success", s);
		const bold = (s: string) => theme.bold(s);

		// Session info
		const sessionFile = this.ctx.sessionManager.getSessionFile() ?? "ephemeral";
		const entryCount = this.ctx.sessionManager.getEntries().length;

		lines.push(bold(accent("Session")));
		lines.push(`  File: ${muted(sessionFile)}`);
		lines.push(`  Entries: ${muted(String(entryCount))}`);
		lines.push("");

		// Model info
		const model = this.ctx.model;
		lines.push(bold(accent("Model")));
		if (model) {
			lines.push(`  Provider: ${muted(model.provider)}`);
			lines.push(`  Model: ${muted(model.id)}`);
			lines.push(`  Context: ${muted(String(model.contextWindow.toLocaleString()))} tokens`);
		} else {
			lines.push(`  ${dim("No model selected")}`);
		}
		lines.push("");

		// Todo summary
		const doneCount = this.todos.filter((t) => t.done).length;
		const totalCount = this.todos.length;
		lines.push(bold(accent("Todos")));
		lines.push(`  ${success(String(doneCount))}${dim("/")}${muted(String(totalCount))} completed`);

		return lines;
	}

	private renderTodos(width: number): string[] {
		const theme = this.ctx.ui.theme;
		const lines: string[] = [];

		const accent = (s: string) => theme.fg("accent", s);
		const muted = (s: string) => theme.fg("muted", s);
		const dim = (s: string) => theme.fg("dim", s);
		const success = (s: string) => theme.fg("success", s);
		const bold = (s: string) => theme.bold(s);

		if (this.todos.length === 0) {
			lines.push(dim("  No todos yet. Use /todo to add items."));
			return lines;
		}

		lines.push(bold(accent("Your Todos:")));
		lines.push("");

		for (const todo of this.todos) {
			const checkbox = todo.done ? success("[✓]") : dim("[ ]");
			const text = todo.done ? muted(todo.text) : todo.text;
			lines.push(`  ${checkbox} ${text}`);
		}

		return lines;
	}

	private renderStats(width: number): string[] {
		const theme = this.ctx.ui.theme;
		const lines: string[] = [];

		const accent = (s: string) => theme.fg("accent", s);
		const muted = (s: string) => theme.fg("muted", s);
		const dim = (s: string) => theme.fg("dim", s);
		const bold = (s: string) => theme.bold(s);

		// Calculate token usage
		let inputTokens = 0;
		let outputTokens = 0;
		let totalCost = 0;

		for (const entry of this.ctx.sessionManager.getBranch()) {
			if (entry.type === "message" && entry.message.role === "assistant") {
				const m = entry.message as AssistantMessage;
				inputTokens += m.usage.input;
				outputTokens += m.usage.output;
				totalCost += m.usage.cost.total;
			}
		}

		const fmt = (n: number) => (n < 1000 ? `${n}` : `${(n / 1000).toFixed(1)}k`);

		lines.push(bold(accent("Token Usage")));
		lines.push(`  Input:  ${muted(fmt(inputTokens))}`);
		lines.push(`  Output: ${muted(fmt(outputTokens))}`);
		lines.push(`  Total:  ${muted(fmt(inputTokens + outputTokens))}`);
		lines.push("");

		lines.push(bold(accent("Cost")));
		lines.push(`  $${muted(totalCost.toFixed(4))}`);
		lines.push("");

		// Context usage
		const usage = this.ctx.getContextUsage();
		if (usage) {
			lines.push(bold(accent("Context")));
			lines.push(`  Used: ${muted(fmt(usage.tokens))}`);
			if (usage.limit) {
				const pct = ((usage.tokens / usage.limit) * 100).toFixed(1);
				lines.push(`  Limit: ${muted(fmt(usage.limit))} (${pct}%)`);
			}
		}

		return lines;
	}

	private renderGitPlaceholder(width: number): string[] {
		const theme = this.ctx.ui.theme;
		const lines: string[] = [];

		const accent = (s: string) => theme.fg("accent", s);
		const dim = (s: string) => theme.fg("dim", s);
		const bold = (s: string) => theme.bold(s);

		lines.push(bold(accent("Git")));
		lines.push("");
		lines.push(dim("  Git integration coming in Phase 02."));
		lines.push(dim("  This tab will show:"));
		lines.push(dim("    • Repository status"));
		lines.push(dim("    • Recent commits"));
		lines.push(dim("    • Branch management"));
		lines.push(dim("    • File staging/unstaging"));

		return lines;
	}

	private renderSessionsPlaceholder(width: number): string[] {
		const theme = this.ctx.ui.theme;
		const lines: string[] = [];

		const accent = (s: string) => theme.fg("accent", s);
		const dim = (s: string) => theme.fg("dim", s);
		const bold = (s: string) => theme.bold(s);

		lines.push(bold(accent("Sessions")));
		lines.push("");
		lines.push(dim("  Session management coming in Phase 03."));
		lines.push(dim("  This tab will show:"));
		lines.push(dim("    • List of pi sessions"));
		lines.push(dim("    • Quick session switching"));
		lines.push(dim("    • Session bookmarks"));
		lines.push(dim("    • Token usage per session"));

		return lines;
	}

	private centerLine(line: string, width: number): string {
		const visibleLen = visibleWidth(line);
		if (visibleLen >= width) return truncateToWidth(line, width);
		const pad = Math.floor((width - visibleLen) / 2);
		return " ".repeat(pad) + line;
	}
}
