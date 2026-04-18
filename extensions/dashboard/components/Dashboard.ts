/**
 * Dashboard Component - Main dashboard UI (Phase 04: Polished)
 */

import type { AssistantMessage } from "@mariozechner/pi-ai";
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Key, matchesKey, visibleWidth, truncateToWidth } from "@mariozechner/pi-tui";
import type { TodoItem, DashboardTab } from "../types.js";
import { GitPanel } from "./GitPanel.js";
import { SessionPanel } from "./SessionPanel.js";
import { BrainPanel } from "./BrainPanel.js";

const TABS: { key: DashboardTab; label: string; shortcut: string }[] = [
	{ key: "overview", label: "Overview", shortcut: "1" },
	{ key: "todos", label: "Tasks", shortcut: "2" },
	{ key: "stats", label: "Stats", shortcut: "3" },
	{ key: "git", label: "Git", shortcut: "4" },
	{ key: "sessions", label: "Sessions", shortcut: "5" },
	{ key: "brain", label: "Brain", shortcut: "6" },
];

export class DashboardComponent {
	private ctx: ExtensionContext;
	private onClose: () => void;
	private tui: { requestRender: () => void };
	private todos: TodoItem[];
	private selectedTab: DashboardTab = "overview";
	private showHelp = false;
	private cachedLines: string[] = [];
	private cachedWidth = 0;
	private gitPanel: GitPanel;
	private sessionPanel: SessionPanel;
	private brainPanel: BrainPanel;

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
		this.gitPanel = new GitPanel(ctx, () => {
			this.invalidate();
			this.tui.requestRender();
		});
		this.sessionPanel = new SessionPanel(ctx, () => {
			this.invalidate();
			this.tui.requestRender();
		});
		this.brainPanel = new BrainPanel(ctx, () => {
			this.invalidate();
			this.tui.requestRender();
		});
	}

	private get tabIndex(): number {
		return TABS.findIndex((t) => t.key === this.selectedTab);
	}

	handleInput(data: string): void {
		// Help overlay toggle
		if (data === "?") {
			this.showHelp = !this.showHelp;
			this.invalidate();
			this.tui.requestRender();
			return;
		}

		// If help is showing, any key closes it
		if (this.showHelp) {
			this.showHelp = false;
			this.invalidate();
			this.tui.requestRender();
			return;
		}

		// Exit on Escape or 'q'/'Q'
		if (matchesKey(data, Key.escape) || data === "q" || data === "Q") {
			this.onClose();
			return;
		}

		// Arrow key navigation
		if (matchesKey(data, Key.right)) {
			const next = (this.tabIndex + 1) % TABS.length;
			this.switchTab(TABS[next]!.key);
			return;
		}
		if (matchesKey(data, Key.left)) {
			const prev = (this.tabIndex - 1 + TABS.length) % TABS.length;
			this.switchTab(TABS[prev]!.key);
			return;
		}

		// Number key navigation
		if (data === "1") return this.switchTab("overview");
		if (data === "2") return this.switchTab("todos");
		if (data === "3") return this.switchTab("stats");
		if (data === "4") return this.switchTab("git");
		if (data === "5") return this.switchTab("sessions");
		if (data === "6") return this.switchTab("brain");

		// Tab-specific actions
		if (this.selectedTab === "git") {
			if (data === "c" || data === "C") void this.gitPanel.handleAction("checkout");
			else if (data === "n" || data === "N") void this.gitPanel.handleAction("create");
			else if (data === "d" || data === "D") void this.gitPanel.handleAction("delete");
			else if (data === "s" || data === "S") void this.gitPanel.handleAction("stage");
			else if (data === "u" || data === "U") void this.gitPanel.handleAction("unstage");
		} else if (this.selectedTab === "sessions") {
			if (data === "s" || data === "S") void this.sessionPanel.handleAction("switch");
			else if (data === "b" || data === "B") void this.sessionPanel.handleAction("bookmark");
		} else if (this.selectedTab === "brain") {
			if (this.brainPanel.isViewing()) {
				if (data === "b" || data === "B" || matchesKey(data, Key.escape)) {
					this.brainPanel.handleAction("back");
				}
			} else {
				// Number keys 0-9 to view files
				const num = parseInt(data, 10);
				if (!isNaN(num) && num >= 0) {
					void this.brainPanel.viewFile(num);
				}
			}
		}
	}

	private switchTab(tab: DashboardTab): void {
		this.selectedTab = tab;
		if (tab === "git") this.gitPanel.refresh();
		if (tab === "sessions") void this.sessionPanel.refresh();
		this.invalidate();
		this.tui.requestRender();
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

		const accent = (s: string) => theme.fg("accent", s);
		const dim = (s: string) => theme.fg("dim", s);

		// Header
		lines.push(this.renderHeader(theme, width));
		lines.push(this.renderTabBar(theme, width));
		lines.push(dim("─".repeat(width)));

		// Content
		if (this.showHelp) {
			lines.push(...this.renderHelp(theme, width));
		} else {
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
					lines.push(...this.gitPanel.render(theme, width));
					break;
				case "sessions":
					lines.push(...this.sessionPanel.render(theme, width));
					break;
			}
		}

		// Footer
		lines.push(dim("─".repeat(width)));
		lines.push(this.renderFooter(theme, width));

		this.cachedLines = lines;
		this.cachedWidth = width;
		return lines;
	}

	private renderHeader(theme: ReturnType<ExtensionContext["ui"]["theme"]>, width: number): string {
		const title = ` ${theme.bold(theme.fg("accent", "π Dashboard"))} `;
		return this.centerLine(title, width);
	}

	private renderTabBar(theme: ReturnType<ExtensionContext["ui"]["theme"]>, width: number): string {
		const tabParts = TABS.map((tab) => {
			const isActive = this.selectedTab === tab.key;
			if (isActive) {
				return theme.bold(theme.fg("accent", ` ${tab.shortcut}:${tab.label} `));
			}
			return theme.fg("dim", ` ${tab.shortcut}:${tab.label} `);
		});

		const separator = theme.fg("dim", "│");
		const bar = tabParts.join(separator);
		return this.centerLine(bar, width);
	}

	private renderFooter(theme: ReturnType<ExtensionContext["ui"]["theme"]>, width: number): string {
		const dim = (s: string) => theme.fg("dim", s);

		if (this.showHelp) {
			return this.centerLine(dim("Any key to close help"), width);
		}

		const hints: Record<string, string> = {
			overview: "←→ switch tabs • ? help • Q close",
			todos: "←→ switch tabs • ? help • Q close",
			stats: "←→ switch tabs • ? help • Q close",
			git: "C-checkout • N-new • D-delete • S-stage • U-unstage • ? help",
			sessions: "S-switch • B-bookmark • ? help • Q close",
		};

		return this.centerLine(dim(hints[this.selectedTab] ?? ""), width);
	}

	private renderHelp(theme: ReturnType<ExtensionContext["ui"]["theme"]>, width: number): string[] {
		const lines: string[] = [];
		const accent = (s: string) => theme.fg("accent", s);
		const muted = (s: string) => theme.fg("muted", s);
		const dim = (s: string) => theme.fg("dim", s);
		const bold = (s: string) => theme.bold(s);

		lines.push("");
		lines.push(`  ${bold(accent("Keyboard Shortcuts"))}`);
		lines.push("");
		lines.push(`  ${bold("Navigation")}`);
		lines.push(`    ${muted("1-5")}        Switch tab directly`);
		lines.push(`    ${muted("← →")}        Switch tab (with wraparound)`);
		lines.push(`    ${muted("?")}          Toggle this help`);
		lines.push(`    ${muted("Q / Esc")}    Close dashboard`);
		lines.push("");
		lines.push(`  ${bold("Git Tab")}`);
		lines.push(`    ${muted("C")}          Checkout branch`);
		lines.push(`    ${muted("N")}          Create new branch`);
		lines.push(`    ${muted("D")}          Delete branch`);
		lines.push(`    ${muted("S")}          Stage file`);
		lines.push(`    ${muted("U")}          Unstage file`);
		lines.push("");
		lines.push(`  ${bold("Sessions Tab")}`);
		lines.push(`    ${muted("S")}          Switch to session`);
		lines.push(`    ${muted("B")}          Toggle bookmark`);
		lines.push("");
		lines.push(`  ${bold("Commands")}`);
		lines.push(`    ${muted("/dashboard")}  Open this dashboard`);
		lines.push(`    ${muted("/todo [text]")} Add a todo item`);
		lines.push(`    ${muted("/todo")}        Manage todos`);
		lines.push(`    ${muted("/footer")}      Toggle custom footer`);
		lines.push("");

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

		lines.push(`  ${bold(accent("Session"))}`);
		const filePrefix = "    File: ";
		const maxFileWidth = Math.max(20, width - visibleWidth(filePrefix));
		const displayPath = sessionFile === "ephemeral"
			? sessionFile
			: truncateToWidth(sessionFile, maxFileWidth, "…");
		lines.push(filePrefix + muted(displayPath));
		lines.push(`    Entries: ${muted(String(entryCount))}`);
		lines.push("");

		// Model info
		const model = this.ctx.model;
		lines.push(`  ${bold(accent("Model"))}`);
		if (model) {
			lines.push(`    Provider: ${muted(model.provider)}`);
			lines.push(`    Model: ${muted(model.id)}`);
			lines.push(`    Context: ${muted(String(model.contextWindow.toLocaleString()))} tokens`);
		} else {
			lines.push(`    ${dim("No model selected")}`);
		}
		lines.push("");

		// Todo summary
		const doneCount = this.todos.filter((t) => t.done).length;
		const totalCount = this.todos.length;
		lines.push(`  ${bold(accent("Tasks"))}`);
		lines.push(`    ${success(String(doneCount))}${dim("/")}${muted(String(totalCount))} completed`);

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
			lines.push("");
			lines.push(dim("  No todos yet. Use /todo to add items."));
			return lines;
		}

		lines.push(`  ${bold(accent("Your Tasks"))}`);
		lines.push("");

		for (const todo of this.todos) {
			const checkbox = todo.done ? success("✓") : dim("○");
			const text = todo.done ? muted(todo.text) : todo.text;
			lines.push(`    ${checkbox} ${text}`);
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

		lines.push(`  ${bold(accent("Token Usage"))}`);
		lines.push(`    Input:  ${muted(fmt(inputTokens))}`);
		lines.push(`    Output: ${muted(fmt(outputTokens))}`);
		lines.push(`    Total:  ${muted(fmt(inputTokens + outputTokens))}`);
		lines.push("");
		lines.push(`  ${bold(accent("Cost"))}`);
		lines.push(`    $${muted(totalCost.toFixed(4))}`);
		lines.push("");

		// Context usage
		const usage = this.ctx.getContextUsage();
		if (usage) {
			lines.push(`  ${bold(accent("Context"))}`);
			lines.push(`    Used: ${muted(fmt(usage.tokens))}`);
			if (usage.limit) {
				const pct = ((usage.tokens / usage.limit) * 100).toFixed(1);
				lines.push(`    Limit: ${muted(fmt(usage.limit))} (${pct}%)`);
			}
		}

		return lines;
	}

	private centerLine(line: string, width: number): string {
		const visibleLen = visibleWidth(line);
		if (visibleLen >= width) return truncateToWidth(line, width);
		const pad = Math.floor((width - visibleLen) / 2);
		return " ".repeat(pad) + line;
	}
}
