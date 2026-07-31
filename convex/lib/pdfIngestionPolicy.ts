export const PDF_INGESTION_LIMITS = {
  maxBytes: 40 * 1024 * 1024,
  maxPages: 2_000,
  maxFilenameLength: 180,
  maxTitleLength: 240,
  maxChunkCharacters: 4_000,
  maxChunksPerDocument: 25_000,
  maxRetryCount: 3,
} as const;

export type PdfSecurityStatus = "clean" | "suspicious" | "quarantined";
export type PdfRiskLevel = "low" | "medium" | "high" | "critical";
export type PdfDocumentVisibility = "private" | "premium" | "public";

export type PdfInspectionInput = {
  filename: string;
  contentType: string;
  byteLength: number;
  pageCount?: number;
  sha256: string;
  isEncrypted?: boolean;
  hasEmbeddedFiles?: boolean;
  hasJavaScript?: boolean;
  hasLaunchActions?: boolean;
  hasMalformedCrossReference?: boolean;
};

export type PdfInspectionResult = {
  accepted: boolean;
  securityStatus: PdfSecurityStatus;
  riskLevel: PdfRiskLevel;
  normalizedFilename: string;
  findings: string[];
};

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const PDF_CONTENT_TYPES = new Set(["application/pdf", "application/x-pdf"]);

function sanitizeFilename(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, PDF_INGESTION_LIMITS.maxFilenameLength);
}

function result(
  normalizedFilename: string,
  findings: string[],
  securityStatus: PdfSecurityStatus,
  riskLevel: PdfRiskLevel,
): PdfInspectionResult {
  return {
    accepted: securityStatus === "clean",
    securityStatus,
    riskLevel,
    normalizedFilename,
    findings,
  };
}

export function inspectPdfMetadata(input: PdfInspectionInput): PdfInspectionResult {
  const normalizedFilename = sanitizeFilename(input.filename);
  const findings: string[] = [];

  if (!normalizedFilename) findings.push("PDF_FILENAME_EMPTY");
  if (!normalizedFilename.toLowerCase().endsWith(".pdf")) {
    findings.push("PDF_EXTENSION_INVALID");
  }
  if (!PDF_CONTENT_TYPES.has(input.contentType.toLowerCase())) {
    findings.push("PDF_CONTENT_TYPE_INVALID");
  }
  if (!Number.isSafeInteger(input.byteLength) || input.byteLength <= 0) {
    findings.push("PDF_SIZE_INVALID");
  } else if (input.byteLength > PDF_INGESTION_LIMITS.maxBytes) {
    findings.push("PDF_SIZE_LIMIT_EXCEEDED");
  }
  if (!SHA256_PATTERN.test(input.sha256.toLowerCase())) {
    findings.push("PDF_SHA256_INVALID");
  }
  if (
    input.pageCount !== undefined &&
    (!Number.isSafeInteger(input.pageCount) || input.pageCount <= 0)
  ) {
    findings.push("PDF_PAGE_COUNT_INVALID");
  } else if (
    input.pageCount !== undefined &&
    input.pageCount > PDF_INGESTION_LIMITS.maxPages
  ) {
    findings.push("PDF_PAGE_LIMIT_EXCEEDED");
  }

  if (input.hasJavaScript) findings.push("PDF_ACTIVE_JAVASCRIPT_DETECTED");
  if (input.hasLaunchActions) findings.push("PDF_LAUNCH_ACTION_DETECTED");
  if (input.hasEmbeddedFiles) findings.push("PDF_EMBEDDED_FILE_DETECTED");
  if (input.hasMalformedCrossReference) {
    findings.push("PDF_CROSS_REFERENCE_MALFORMED");
  }
  if (input.isEncrypted) findings.push("PDF_ENCRYPTED");

  const critical = findings.some((finding) =>
    [
      "PDF_ACTIVE_JAVASCRIPT_DETECTED",
      "PDF_LAUNCH_ACTION_DETECTED",
      "PDF_EMBEDDED_FILE_DETECTED",
      "PDF_CROSS_REFERENCE_MALFORMED",
    ].includes(finding),
  );
  if (critical) {
    return result(normalizedFilename, findings, "quarantined", "critical");
  }

  const high = findings.some((finding) =>
    [
      "PDF_ENCRYPTED",
      "PDF_SIZE_LIMIT_EXCEEDED",
      "PDF_PAGE_LIMIT_EXCEEDED",
      "PDF_CONTENT_TYPE_INVALID",
      "PDF_EXTENSION_INVALID",
    ].includes(finding),
  );
  if (high) return result(normalizedFilename, findings, "quarantined", "high");

  if (findings.length > 0) {
    return result(normalizedFilename, findings, "suspicious", "medium");
  }

  return result(normalizedFilename, [], "clean", "low");
}

export function normalizePdfTitle(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, PDF_INGESTION_LIMITS.maxTitleLength);
}

export function validateChunkBoundary(args: {
  pageNumber: number;
  chunkIndex: number;
  text: string;
}) {
  if (!Number.isSafeInteger(args.pageNumber) || args.pageNumber <= 0) {
    throw new Error("PDF_PAGE_NUMBER_INVALID");
  }
  if (!Number.isSafeInteger(args.chunkIndex) || args.chunkIndex < 0) {
    throw new Error("PDF_CHUNK_INDEX_INVALID");
  }
  const normalizedText = args.text.normalize("NFKC").replace(/\s+/g, " ").trim();
  if (!normalizedText) throw new Error("PDF_CHUNK_TEXT_EMPTY");
  if (normalizedText.length > PDF_INGESTION_LIMITS.maxChunkCharacters) {
    throw new Error("PDF_CHUNK_TOO_LARGE");
  }
  return normalizedText;
}
