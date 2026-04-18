/**
 * Dashboard Extension - A TUI dashboard for pi
 *
 * Features:
 * - /dashboard - Show session stats, model info, git status, and sessions in a nice UI
 * - /todo - Simple todo list widget that persists in session
 * - Custom footer with session info
 * - Ctrl+Shift+D shortcut to open dashboard
 */

import type { AssistantMessage } from "@mariozechner/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { DynamicBorder } from "@mariozechner/pi-coding-agent";
import {
	Container,
	Key,
	type SelectItem,
	SelectList,
	visibleWidth,
	truncateToWidth,
} from "@mariozechner/pi-tui";
import type { TodoItem } from "./types.js";
import { DashboardComponent } from "./components/Dashboard.js";

// ============================================================================
// Extension Setup
// ============================================================================

const TODO_SAVE_TYPE = "dashboard-todos";

export default function dashboardExtension(pi: ExtensionAPI) {
	let todos: TodoItem[] = [];

	// ============================================================================
	// Helper Functions
	// ============================================================================

	function loadTodos(ctx: ExtensionContext): void {
		const entries = ctx.sessionManager.getEntries();
		for (let i = entries.length - 1; i >= 0; i--) {
			const entry = entries[i];
			if (entry.type === "custom" && entry.customType === TODO_SAVE_TYPE) {
				todos = (entry.data as TodoItem[]) ?? [];
				break;
			}
		}
	}

	function saveTodos(): void {
		pi.appendEntry(TODO_SAVE_TYPE, todos);
	}

	function updateTodoWidget(ctx: ExtensionContext): void {
		if (todos.length === 0) {
			ctx.ui.setWidget("dashboard-todos", undefined);
			return;
		}

		const doneCount = todos.filter((t) => t.done).length;
		ctx.ui.setWidget(
			"dashboard-todos",
			(tui, theme) => {
				const lines = [
					theme.fg("accent", theme.bold("Todos")),
					...todos.slice(0, 3).map((t) => {
						const checkbox = t.done ? theme.fg("success", "✓") : theme.fg("dim", "○");
						const text = t.done ? theme.fg("muted", t.text) : t.text;
						return `${checkbox} ${text}`;
					}),
				];
				if (todos.length > 3) {
					lines.push(theme.fg("dim", `...and ${todos.length - 3} more`));
				}
				return {
					render: () => lines,
					invalidate: () => {},
				};
			},
			{ placement: "belowEditor" },
		);
	}

	// ============================================================================
	// Commands
	// ============================================================================

	// /dashboard command
	pi.registerCommand("dashboard", {
		description: "Show session dashboard",
		handler: async (_args, ctx) => {
			if (!ctx.hasUI) {
				ctx.ui.notify("Dashboard requires interactive mode", "error");
				return;
			}

			await ctx.ui.custom((tui, _theme, _kb, done) => {
				return new DashboardComponent(tui, ctx, () => done(undefined), todos);
			});
		},
	});

	// /todo command - Simple todo list using SelectList
	pi.registerCommand("todo", {
		description: "Manage todo list",
		handler: async (args, ctx) => {
			if (!ctx.hasUI) {
				ctx.ui.notify("Todo requires interactive mode", "error");
				return;
			}

			// If args provided, add as new todo
			if (args?.trim()) {
				todos.push({
					id: Date.now().toString(),
					text: args.trim(),
					done: false,
				});
				saveTodos();
				updateTodoWidget(ctx);
				ctx.ui.notify(`Added: ${args.trim()}`, "success");
				return;
			}

			// Show todo selector UI
			const items: SelectItem[] = [
				{ value: "add", label: "➕ Add new todo", description: "Create a new todo item" },
				...todos.map((t, i) => ({
					value: String(i),
					label: `${t.done ? "✓" : "○"} ${t.text}`,
					description: t.done ? "Done - press to uncheck" : "Pending - press to complete",
				})),
			];

			if (todos.length === 0) {
				items.push({ value: "none", label: "No todos yet", description: "Add your first todo" });
			}

			const result = await ctx.ui.custom<string | null>((tui, theme, _kb, done) => {
				const container = new Container();
				container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));
				container.addChild(new Text(theme.fg("accent", theme.bold("Todo List")), 1, 0));

				const selectList = new SelectList(items, Math.min(items.length, 10), {
					selectedPrefix: (t) => theme.fg("accent", t),
					selectedText: (t) => theme.fg("accent", t),
					description: (t) => theme.fg("muted", t),
					scrollInfo: (t) => theme.fg("dim", t),
					noMatch: (t) => theme.fg("warning", t),
				});

				selectList.onSelect = (item) => done(item.value);
				selectList.onCancel = () => done(null);
				container.addChild(selectList);
				container.addChild(new Text(theme.fg("dim", "↑↓ navigate • enter select • esc close"), 1, 0));
				container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));

				return {
					render: (w) => container.render(w),
					invalidate: () => container.invalidate(),
					handleInput: (data) => {
						selectList.handleInput(data);
						tui.requestRender();
					},
				};
			});

			if (!result) return;

			if (result === "add") {
				// Quick input for new todo
				const text = await ctx.ui.input("New todo:", "");
				if (text?.trim()) {
					todos.push({
						id: Date.now().toString(),
						text: text.trim(),
						done: false,
					});
					saveTodos();
					updateTodoWidget(ctx);
					ctx.ui.notify("Todo added", "success");
				}
			} else if (result !== "none") {
				// Toggle todo
				const index = parseInt(result, 10);
				if (todos[index]) {
					todos[index].done = !todos[index].done;
					saveTodos();
					updateTodoWidget(ctx);
					ctx.ui.notify(todos[index].done ? "Marked as done" : "Marked as pending", "info");
				}
			}
		},
	});

	// /footer command - Toggle custom footer
	pi.registerCommand("footer", {
		description: "Toggle custom dashboard footer",
		handler: async (_args, ctx) => {
			// Check if footer is already set by looking at a flag or just toggle
			// Since there's no getFooter method, we'll use a module-level flag
			const footerKey = "dashboard-footer-active";
			const isActive = (ctx as unknown as Record<string, unknown>)[footerKey] === true;

			if (isActive) {
				ctx.ui.setFooter(undefined);
				(ctx as unknown as Record<string, unknown>)[footerKey] = false;
				ctx.ui.notify("Default footer restored", "info");
			} else {
				ctx.ui.setFooter((tui, theme, footerData) => {
					const unsub = footerData.onBranchChange(() => tui.requestRender());

					return {
						dispose: unsub,
						invalidate() {},
						render(width: number): string[] {
							// Calculate stats
							let input = 0,
								output = 0,
								cost = 0;
							for (const e of ctx.sessionManager.getBranch()) {
								if (e.type === "message" && e.message.role === "assistant") {
									const m = e.message as AssistantMessage;
									input += m.usage.input;
									output += m.usage.output;
									cost += m.usage.cost.total;
								}
							}

							const branch = footerData.getGitBranch();
							const fmt = (n: number) => (n < 1000 ? `${n}` : `${(n / 1000).toFixed(1)}k`);

							const left = theme.fg("dim", `↑${fmt(input)} ↓${fmt(output)} $${cost.toFixed(3)}`);
							const todoStatus = todos.length > 0 ? ` | ${todos.filter((t) => t.done).length}/${todos.length} ✓` : "";
							const branchStr = branch ? ` (${branch})` : "";
							const right = theme.fg("dim", `${ctx.model?.id || "no-model"}${branchStr}${todoStatus}`);

							const pad = " ".repeat(Math.max(1, width - visibleWidth(left) - visibleWidth(right)));
							return [truncateToWidth(left + pad + right, width)];
						},
					};
				});
				(ctx as unknown as Record<string, unknown>)[footerKey] = true;
				ctx.ui.notify("Custom footer enabled", "info");
			}
		},
	});

	// ============================================================================
	// Shortcuts
	// ============================================================================

	pi.registerShortcut(Key.ctrlShift("d"), {
		description: "Open dashboard",
		handler: async (ctx) => {
			ctx.ui.notify("Use /dashboard to open the dashboard", "info");
		},
	});

	// ============================================================================
	// Event Handlers
	// ============================================================================

	pi.on("session_start", async (_event, ctx) => {
		loadTodos(ctx);
		updateTodoWidget(ctx);

		// Show welcome message
		ctx.ui.notify("Dashboard extension loaded. Try /dashboard, /todo, or /footer", "info");
	});

	pi.on("turn_end", async (_event, ctx) => {
		// Update widget after each turn (stats may have changed)
		updateTodoWidget(ctx);
	});
}
