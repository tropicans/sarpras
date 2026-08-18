import { createServerFn } from "@tanstack/react-start";
import * as crypto from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";

export interface UploadLetterResult {
	fileName: string;
	fileUrl: string;
	fileSize: number;
}

export const uploadBookingLetterFn = createServerFn({ method: "POST" })
	.validator((data: FormData) => {
		if (!(data instanceof FormData)) {
			throw new Error("Form data tidak valid.");
		}
		const file = data.get("file");
		if (!file || typeof file === "string") {
			throw new Error("File surat tidak ditemukan.");
		}
		return data;
	})
	.handler(async ({ data }): Promise<UploadLetterResult> => {
		const file = data.get("file") as File;
		if (!file) {
			throw new Error("File surat tidak ditemukan.");
		}

		// Validate file extension and MIME type
		const fileName = file.name || "surat_permohonan.pdf";
		const lowerName = fileName.toLowerCase();
		if (!lowerName.endsWith(".pdf") && file.type !== "application/pdf") {
			throw new Error("Format berkas harus PDF (.pdf).");
		}

		// Validate file size: 5MB max
		const MAX_SIZE = 5 * 1024 * 1024;
		if (file.size > MAX_SIZE) {
			throw new Error("Ukuran berkas melebihi batas maksimal 5MB.");
		}

		if (file.size === 0) {
			throw new Error("Berkas PDF kosong.");
		}

		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);

		// Validate PDF magic bytes (%PDF)
		if (buffer.length < 4 || buffer.toString("utf8", 0, 4) !== "%PDF") {
			throw new Error("Berkas yang diunggah bukan dokumen PDF yang valid.");
		}

		const uploadDir = path.resolve(process.cwd(), "public", "uploads", "letters");
		await fs.mkdir(uploadDir, { recursive: true });

		const safeOriginalName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
		const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
		const savedFileName = `${uniqueSuffix}_${safeOriginalName}`;
		const filePath = path.join(uploadDir, savedFileName);

		await fs.writeFile(filePath, buffer);

		return {
			fileName: safeOriginalName,
			fileUrl: `/uploads/letters/${savedFileName}`,
			fileSize: file.size,
		};
	});
