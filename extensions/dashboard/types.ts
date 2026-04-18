/**
 * Dashboard Extension - Shared Types
 */

export interface TodoItem {
	id: string;
	text: string;
	done: boolean;
}

export interface DashboardState {
	todos: TodoItem[];
}

export type DashboardTab = "overview" | "todos" | "stats" | "git" | "sessions";
