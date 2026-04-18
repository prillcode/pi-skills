/**
 * BrainPanel Component - View project brain memory
 */

import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";
import {
	resolveBrainProject,
	listBrainFiles,
	readBrainFile,
	getPriorityFiles,
	type BrainProject,
	type BrainFile,
} from "../utils/brain.js";

export class BrainPanel {
	private ctx: ExtensionContext;
	private onRefresh: () => void;
	private project: BrainProject;
	private files: BrainFile[] = [];
	private viewingFile: BrainFile | null = null;
	private fileContent: string | null = null;
	private scrollOffset = 0;

	constructor(ctx: ExtensionContext, onRefresh: () => void) {
		this.ctx = ctx;
		this.onRefresh = onRefresh;
		this.project = resolveBrainProject(ctx.cwd);
		if (this.project.exists) {
			this.files = getPriorityFiles(listBrainFiles(this.project.path));
		}
	}

	handleAction(action: string): void {
		if (action === "back") {
			this.viewingFile = null;
			this.fileContent = null;
			this.scrollOffset = 0;
			this.onRefresh();
		}
	}

	async viewFile(index: number): Promise<void> {
		const file = this.files[index];
		if (!file || file.isDirectory) return;

		const content = readBrainFile(file.path);
		if (content === null) {
			this.ctx.ui.notify(`Could not read ${file.relativePath}`, "error");
			return;
		}

		this.viewingFile = file;
		this.fileContent = content;
		this.scrollOffset = 0;
		this.onRefresh();
	}

	isViewing(): boolean {
		return this.viewingFile !== null;
	}

	render(theme: ReturnType<ExtensionContext["ui"]["theme"]>, width: number): string[] {
		if (!this.project.exists) {
			return this.renderNoBrain(theme, width);
		}

		if (this.viewingFile && this.fileContent !== null) {
			return this.renderFileView(theme, width);
		}

		return this.renderFileList(theme, width);
	}

	private renderNoBrain(theme: ReturnType<ExtensionContext["ui"]["theme"]>, _width: number): string[] {
		const lines: string[] = [];
		const accent = (s: string) => theme.fg("accent", s);
		const muted = (s: string) => theme.fg("muted", s);
		const dim = (s: string) => theme.fg("dim", s);
		const bold = (s: string) => theme.bold(s);

		lines.push("");
		lines.push(`  ${bold(accent("No brain found"))}`);
		lines.push(`  ${muted(`No brain project for "${this.project.slug}"`)}`);
		lines.push("");
		lines.push(`  ${dim("Use the /brain-sync skill to create one:")}`);
		lines.push(`  ${accent("/brain-sync init")}`);
		lines.push("");
		lines.push(`  ${dim("This will scaffold: state/now.md, wiki/, log/, raw/")}`);
		lines.push(`  ${dim("in ../brain/projects/${this.project.slug}/")}`);

		return lines;
	}

	private renderFileList(theme: ReturnType<ExtensionContext["ui"]["theme"]>, width: number): string[] {
		const lines: string[] = [];
		const accent = (s: string) => theme.fg("accent", s);
		const muted = (s: string) => theme.fg("muted", s);
		const dim = (s: string) => theme.fg("dim", s);
		const success = (s: string) => theme.fg("success", s);
		const bold = (s: string) => theme.bold(s);

		// Project header
		lines.push(`  ${bold(accent(`Brain: ${this.project.slug}`))}`);

		// Status indicators
		const indicators: string[] = [];
		if (this.project.hasNow) indicators.push(success("✓ now.md"));
		if (this.project.hasWiki) indicators.push(success("✓ wiki/"));
		if (this.project.hasLog) indicators.push(success("✓ log/"));
		if (indicators.length > 0) {
			lines.push(`  ${indicators.join(dim(" · "))}`);
		}
		lines.push("");

		// File list
		lines.push(`  ${bold("Files:")}`);

		const prefix = "    ";
		let fileIndex = 0;
		for (const file of this.files) {
			if (file.isDirectory) {
				lines.push(`${prefix}${dim("📁 " + file.relativePath + "/")}`);
			} else {
				const sizeStr = file.size > 1024 ? `${(file.size / 1024).toFixed(1)}k` : `${file.size}b`;
				const num = `[${fileIndex}]`;
				// Highlight priority files
				const isPriority = ["state/now.md", "wiki/index.md"].includes(file.relativePath);
				const label = isPriority ? accent(`${num} ${file.relativePath}`) : muted(`${num} ${file.relativePath}`);
				const meta = dim(` (${sizeStr})`);
				lines.push(`${prefix}${label}${meta}`);
				fileIndex++;
			}
		}

		return lines;
	}

	private renderFileView(theme: ReturnType<ExtensionContext["ui"]["theme"]>, width: number): string[] {
		const lines: string[] = [];
		const accent = (s: string) => theme.fg("accent", s);
		const dim = (s: string) => theme.fg("dim", s);
		const bold = (s: string) => theme.bold(s);

		// File header
		lines.push(`  ${bold(accent(this.viewingFile!.relativePath))}`);
		lines.push(dim("─".repeat(width)));
		lines.push("");

		// File content (truncate to fit dashboard)
		const maxLines = 30;
		const contentLines = this.fileContent!.split("\n");

		for (let i = 0; i < Math.min(contentLines.length, maxLines); i++) {
			const line = contentLines[i + this.scrollOffset];
			if (line === undefined) break;
			// Truncate long lines
			lines.push(truncateToWidth(`  ${line}`, width));
		}

		if (contentLines.length > maxLines) {
			lines.push("");
			lines.push(dim(`  ...${contentLines.length - maxLines} more lines`));
		}

		return lines;
	}
}
