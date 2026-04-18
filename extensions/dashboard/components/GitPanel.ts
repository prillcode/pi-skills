/**
 * GitPanel Component - Git integration UI
 */

import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import { type SelectItem } from "@mariozechner/pi-tui";
import {
	getGitStatus,
	getRecentCommits,
	getBranches,
	checkoutBranch,
	createBranch,
	deleteBranch,
	stageFile,
	unstageFile,
	isGitRepo,
	type GitStatus,
	type GitCommit,
} from "../utils/git.js";

export class GitPanel {
	private ctx: ExtensionContext;
	private onRefresh: () => void;
	private status: GitStatus = {
		isRepo: false, branch: "", ahead: 0, behind: 0,
		modified: [], staged: [], untracked: [],
	};
	private commits: GitCommit[] = [];
	private branches: { name: string; current: boolean }[] = [];

	constructor(ctx: ExtensionContext, onRefresh: () => void) {
		this.ctx = ctx;
		this.onRefresh = onRefresh;
		this.refresh();
	}

	refresh(): void {
		if (!isGitRepo(this.ctx.cwd)) {
			this.status = { isRepo: false, branch: "", ahead: 0, behind: 0, modified: [], staged: [], untracked: [] };
			this.commits = [];
			this.branches = [];
			return;
		}
		this.status = getGitStatus(this.ctx.cwd);
		this.commits = getRecentCommits(this.ctx.cwd, 10);
		this.branches = getBranches(this.ctx.cwd);
	}

	async handleAction(action: string): Promise<void> {
		switch (action) {
			case "checkout": await this.checkoutFlow(); break;
			case "create": await this.createFlow(); break;
			case "delete": await this.deleteFlow(); break;
			case "stage": await this.stageFlow(); break;
			case "unstage": await this.unstageFlow(); break;
			case "menu": await this.showMenu(); break;
		}
	}

	private async showMenu(): Promise<void> {
		const items: SelectItem[] = [
			{ value: "checkout", label: "Switch branch", description: "Checkout a different branch" },
			{ value: "create", label: "Create branch", description: "Create and switch to a new branch" },
			{ value: "delete", label: "Delete branch", description: "Delete a local branch" },
			{ value: "stage", label: "Stage file", description: "Stage a modified or untracked file" },
			{ value: "unstage", label: "Unstage file", description: "Remove a file from staging" },
		];

		const result = await this.ctx.ui.select("Git actions:", items);
		if (result?.value) {
			await this.handleAction(result.value);
		}
	}

	private async checkoutFlow(): Promise<void> {
		const localBranches = this.branches.filter((b) => !b.current && !b.name.includes("/"));
		if (localBranches.length === 0) {
			this.ctx.ui.notify("No other local branches to checkout", "warning");
			return;
		}

		const items: SelectItem[] = localBranches.map((b) => ({
			value: b.name,
			label: b.name,
			description: "Checkout this branch",
		}));

		const result = await this.ctx.ui.select("Checkout branch:", items);
		if (!result?.value) return;

		try {
			checkoutBranch(this.ctx.cwd, result.value);
			this.ctx.ui.notify(`Switched to branch: ${result.value}`, "success");
			this.refresh();
			this.onRefresh();
		} catch (error) {
			this.ctx.ui.notify(`Failed to checkout: ${error}`, "error");
		}
	}

	private async createFlow(): Promise<void> {
		const name = await this.ctx.ui.input("New branch name:", "");
		if (!name?.trim()) return;

		try {
			createBranch(this.ctx.cwd, name.trim(), true);
			this.ctx.ui.notify(`Created and switched to branch: ${name.trim()}`, "success");
			this.refresh();
			this.onRefresh();
		} catch (error) {
			this.ctx.ui.notify(`Failed to create branch: ${error}`, "error");
		}
	}

	private async deleteFlow(): Promise<void> {
		const deletableBranches = this.branches.filter((b) => !b.current);
		if (deletableBranches.length === 0) {
			this.ctx.ui.notify("No other branches to delete", "warning");
			return;
		}

		const items: SelectItem[] = deletableBranches.map((b) => ({
			value: b.name,
			label: b.name,
			description: "Delete this branch",
		}));

		const result = await this.ctx.ui.select("Delete branch:", items);
		if (!result?.value) return;

		const ok = await this.ctx.ui.confirm("Delete branch?", `Delete ${result.value}? This cannot be undone.`);
		if (!ok) return;

		try {
			deleteBranch(this.ctx.cwd, result.value, false);
			this.ctx.ui.notify(`Deleted branch: ${result.value}`, "success");
			this.refresh();
			this.onRefresh();
		} catch {
			const force = await this.ctx.ui.confirm("Force delete?", "Branch may be unmerged. Force delete?");
			if (!force) return;

			try {
				deleteBranch(this.ctx.cwd, result.value, true);
				this.ctx.ui.notify(`Force deleted branch: ${result.value}`, "success");
				this.refresh();
				this.onRefresh();
			} catch (error) {
				this.ctx.ui.notify(`Failed to delete branch: ${error}`, "error");
			}
		}
	}

	private async stageFlow(): Promise<void> {
		const files = [...this.status.modified, ...this.status.untracked];
		if (files.length === 0) {
			this.ctx.ui.notify("No files to stage", "warning");
			return;
		}

		const items: SelectItem[] = files.map((f) => ({
			value: f,
			label: f,
			description: this.status.untracked.includes(f) ? "Untracked" : "Modified",
		}));

		const result = await this.ctx.ui.select("Stage file:", items);
		if (!result?.value) return;

		try {
			stageFile(this.ctx.cwd, result.value);
			this.ctx.ui.notify(`Staged: ${result.value}`, "success");
			this.refresh();
			this.onRefresh();
		} catch (error) {
			this.ctx.ui.notify(`Failed to stage: ${error}`, "error");
		}
	}

	private async unstageFlow(): Promise<void> {
		if (this.status.staged.length === 0) {
			this.ctx.ui.notify("No staged files to unstage", "warning");
			return;
		}

		const items: SelectItem[] = this.status.staged.map((f) => ({
			value: f,
			label: f,
			description: "Staged",
		}));

		const result = await this.ctx.ui.select("Unstage file:", items);
		if (!result?.value) return;

		try {
			unstageFile(this.ctx.cwd, result.value);
			this.ctx.ui.notify(`Unstaged: ${result.value}`, "success");
			this.refresh();
			this.onRefresh();
		} catch (error) {
			this.ctx.ui.notify(`Failed to unstage: ${error}`, "error");
		}
	}

	render(theme: ReturnType<ExtensionContext["ui"]["theme"]>, _width: number): string[] {
		if (!this.status.isRepo) {
			return ["", "  Not a git repository", ""];
		}

		const lines: string[] = [];
		const accent = (s: string) => theme.fg("accent", s);
		const muted = (s: string) => theme.fg("muted", s);
		const dim = (s: string) => theme.fg("dim", s);
		const success = (s: string) => theme.fg("success", s);
		const warning = (s: string) => theme.fg("warning", s);
		const bold = (s: string) => theme.bold(s);

		// Branch status
		const aheadBehind = [];
		if (this.status.ahead > 0) aheadBehind.push(`↑${this.status.ahead}`);
		if (this.status.behind > 0) aheadBehind.push(`↓${this.status.behind}`);
		const abText = aheadBehind.length > 0 ? ` (${aheadBehind.join(", ")})` : "";

		lines.push(`  ${bold(accent("Branch:"))} ${accent(this.status.branch)}${muted(abText)}`);
		lines.push("");

		// File status
		lines.push(`  ${bold("Working Tree:")}`);
		lines.push(`    ${warning(String(this.status.modified.length))} ${muted("modified")}`);
		lines.push(`    ${success(String(this.status.staged.length))} ${muted("staged")}`);
		lines.push(`    ${dim(String(this.status.untracked.length))} ${muted("untracked")}`);
		lines.push("");

		// Recent commits
		if (this.commits.length > 0) {
			lines.push(`  ${bold(accent("Recent Commits:"))}`);
			for (const commit of this.commits.slice(0, 5)) {
				const msg = commit.message.length > 40 ? commit.message.slice(0, 37) + "..." : commit.message;
				lines.push(`    ${dim(commit.hash)} ${msg}`);
			}
			lines.push("");
		}

		// Local branches
		const localBranches = this.branches.filter((b) => !b.name.includes("/"));
		if (localBranches.length > 0) {
			lines.push(`  ${bold(accent("Local Branches:"))}`);
			for (const branch of localBranches.slice(0, 8)) {
				const marker = branch.current ? accent("* ") : "  ";
				lines.push(`    ${marker}${muted(branch.name)}`);
			}
		}

		return lines;
	}
}
