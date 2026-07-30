const ALLOWED_HOSTS = new Set(["inbr.ir", "www.inbr.ir"]);
const ALLOWED_CONTENT_TYPES = new Set([
  "text/html",
  "application/xhtml+xml",
  "text/plain",
  "application/pdf",
]);

export const SOURCE_SYNC_LIMITS = {
  maxBytes: 2_000_000,
  maxStoredTextCharacters: 200_000,
  maxRedirects: 3,
  timeoutMilliseconds: 12_000,
} as const;

export type SourceRiskLevel = "low" | "medium" | "high" | "critical";
export type SourceSecurityStatus = "clean" | "suspicious" | "quarantined";

export type GuardedFetchResult = {
  finalUrl: string;
  title: string;
  normalizedText: string;
  contentHash: string;
  byteLength: number;
  contentType: string;
  httpStatus: number;
  etag?: string;
  lastModified?: string;
  riskLevel: SourceRiskLevel;
  securityStatus: SourceSecurityStatus;
  findings: string[];
  securityReport: string;
};

export function validateOfficialSourceUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("SOURCE_URL_INVALID");
  }

  const hostname = url.hostname.toLowerCase();
  if (url.protocol !== "https:") throw new Error("SOURCE_HTTPS_REQUIRED");
  if (!ALLOWED_HOSTS.has(hostname)) throw new Error("SOURCE_DOMAIN_NOT_ALLOWED");
  if (url.username || url.password) throw new Error("SOURCE_CREDENTIALS_NOT_ALLOWED");
  if (url.port && url.port !== "443") throw new Error("SOURCE_PORT_NOT_ALLOWED");
  if (/[^\x20-\x7E\u0600-\u06FF]/u.test(decodeURIComponent(url.pathname))) {
    throw new Error("SOURCE_PATH_INVALID");
  }
  return url;
}

function decodeHtmlEntities(value: string) {
  const entities: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    zwnj: "\u200c",
  };

  return value
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 10)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&([a-z]+);/gi, (match, name: string) => entities[name] ?? match);
}

function extractTitle(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) ??
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!match) return "تغییر منبع رسمی";
  return decodeHtmlEntities(match[1].replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180) || "تغییر منبع رسمی";
}

export function normalizeHtmlToText(html: string) {
  return decodeHtmlEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(script|style|noscript|template|svg|iframe|object|embed|form)[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<(br|hr)\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|section|article|main|header|footer|li|tr|h[1-6])>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[\t\f\v ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, SOURCE_SYNC_LIMITS.maxStoredTextCharacters);
}

async function readBodyLimited(response: Response) {
  const contentLength = Number(response.headers.get("content-length") ?? "0");
  if (contentLength > SOURCE_SYNC_LIMITS.maxBytes) {
    throw new Error("SOURCE_BODY_TOO_LARGE");
  }

  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > SOURCE_SYNC_LIMITS.maxBytes) {
      await reader.cancel("SOURCE_BODY_TOO_LARGE");
      throw new Error("SOURCE_BODY_TOO_LARGE");
    }
    chunks.push(value);
  }

  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

function bytesToHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function sha256(value: Uint8Array) {
  const copy = new Uint8Array(value.byteLength);
  copy.set(value);
  const digest = await crypto.subtle.digest("SHA-256", copy.buffer);
  return bytesToHex(digest);
}

function scanSourceContent(args: {
  sourceUrl: string;
  contentType: string;
  rawText: string;
  bytes: Uint8Array;
}) {
  const findings: string[] = [];
  const lowerText = args.rawText.toLowerCase();
  const pathname = new URL(args.sourceUrl).pathname.toLowerCase();

  if (!ALLOWED_CONTENT_TYPES.has(args.contentType)) {
    findings.push(`unsupported-content-type:${args.contentType}`);
  }
  if (/\.(exe|msi|dmg|pkg|apk|bat|cmd|ps1|sh|jar)(?:$|\?)/i.test(pathname)) {
    findings.push("executable-file-extension");
  }
  if (/<meta[^>]+http-equiv\s*=\s*["']?refresh/i.test(args.rawText)) {
    findings.push("meta-refresh");
  }
  if (/<(?:object|embed)\b/i.test(args.rawText)) findings.push("embedded-object");
  if (/<iframe\b/i.test(args.rawText)) findings.push("iframe-content");
  if (/javascript\s*:/i.test(args.rawText)) findings.push("javascript-url");
  if (/data\s*:\s*text\/html/i.test(args.rawText)) findings.push("data-html-url");
  if (/<form\b/i.test(args.rawText)) findings.push("interactive-form");
  const inlineHandlers = args.rawText.match(/\son[a-z]+\s*=/gi)?.length ?? 0;
  if (inlineHandlers > 20) findings.push(`many-inline-handlers:${inlineHandlers}`);
  if (/\b(eval|new\s+function|document\.write)\s*\(/i.test(lowerText)) {
    findings.push("dynamic-script-execution");
  }
  if (args.bytes.byteLength > 1_500_000) findings.push("large-response");

  if (args.contentType === "application/pdf") {
    const signature = new TextDecoder().decode(args.bytes.slice(0, 5));
    if (signature !== "%PDF-") findings.push("pdf-signature-mismatch");
  }

  let riskLevel: SourceRiskLevel = "low";
  if (
    findings.some((finding) =>
      finding.startsWith("unsupported-content-type") ||
      finding === "executable-file-extension" ||
      finding === "pdf-signature-mismatch",
    )
  ) {
    riskLevel = "critical";
  } else if (
    findings.some((finding) =>
      ["meta-refresh", "embedded-object", "dynamic-script-execution"].includes(finding),
    )
  ) {
    riskLevel = "high";
  } else if (findings.length > 0) {
    riskLevel = "medium";
  }

  const securityStatus: SourceSecurityStatus =
    riskLevel === "critical" || riskLevel === "high"
      ? "quarantined"
      : riskLevel === "medium"
        ? "suspicious"
        : "clean";

  return { findings, riskLevel, securityStatus };
}

export async function fetchOfficialSource(inputUrl: string): Promise<GuardedFetchResult> {
  let currentUrl = validateOfficialSourceUrl(inputUrl);
  let redirectCount = 0;
  let response: Response | undefined;

  while (redirectCount <= SOURCE_SYNC_LIMITS.maxRedirects) {
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort("SOURCE_FETCH_TIMEOUT"),
      SOURCE_SYNC_LIMITS.timeoutMilliseconds,
    );

    try {
      response = await fetch(currentUrl, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: "text/html,application/xhtml+xml,text/plain,application/pdf;q=0.8",
          "User-Agent": "CivilMind-AI-Source-Monitor/1.0 (read-only)",
          "Cache-Control": "no-cache",
        },
      });
    } finally {
      clearTimeout(timer);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("SOURCE_REDIRECT_WITHOUT_LOCATION");
      if (redirectCount === SOURCE_SYNC_LIMITS.maxRedirects) {
        throw new Error("SOURCE_TOO_MANY_REDIRECTS");
      }
      currentUrl = validateOfficialSourceUrl(new URL(location, currentUrl).toString());
      redirectCount += 1;
      continue;
    }
    break;
  }

  if (!response) throw new Error("SOURCE_FETCH_FAILED");
  if (!response.ok) throw new Error(`SOURCE_HTTP_${response.status}`);

  const contentType = (response.headers.get("content-type") ?? "application/octet-stream")
    .split(";", 1)[0]
    .trim()
    .toLowerCase();
  const bytes = await readBodyLimited(response);
  const rawText = contentType === "application/pdf" ? "" : new TextDecoder().decode(bytes);
  const normalizedText =
    contentType === "text/html" || contentType === "application/xhtml+xml"
      ? normalizeHtmlToText(rawText)
      : contentType === "text/plain"
        ? rawText
            .replace(/\r\n?/g, "\n")
            .replace(/[\t ]+/g, " ")
            .trim()
            .slice(0, SOURCE_SYNC_LIMITS.maxStoredTextCharacters)
        : `PDF document (${bytes.byteLength} bytes)`;
  const canonicalBytes =
    contentType === "application/pdf" ? bytes : new TextEncoder().encode(normalizedText);
  const scan = scanSourceContent({
    sourceUrl: currentUrl.toString(),
    contentType,
    rawText,
    bytes,
  });

  return {
    finalUrl: currentUrl.toString(),
    title: contentType === "application/pdf" ? "سند PDF رسمی" : extractTitle(rawText),
    normalizedText,
    contentHash: await sha256(canonicalBytes),
    byteLength: bytes.byteLength,
    contentType,
    httpStatus: response.status,
    etag: response.headers.get("etag") ?? undefined,
    lastModified: response.headers.get("last-modified") ?? undefined,
    riskLevel: scan.riskLevel,
    securityStatus: scan.securityStatus,
    findings: scan.findings,
    securityReport: [
      `Final URL: ${currentUrl.toString()}`,
      `HTTP status: ${response.status}`,
      `Content type: ${contentType}`,
      `Bytes: ${bytes.byteLength}`,
      `Risk: ${scan.riskLevel}`,
      `Security status: ${scan.securityStatus}`,
      `Findings: ${scan.findings.length === 0 ? "none" : scan.findings.join(", ")}`,
    ].join("\n"),
  };
}

export function summarizeTextChange(previousText: string, nextText: string) {
  const previousLines = new Set(previousText.split("\n").filter(Boolean));
  const nextLines = new Set(nextText.split("\n").filter(Boolean));
  let added = 0;
  let removed = 0;
  for (const line of nextLines) if (!previousLines.has(line)) added += 1;
  for (const line of previousLines) if (!nextLines.has(line)) removed += 1;

  const previousLength = Math.max(previousText.length, 1);
  const changeRatio = Math.abs(nextText.length - previousText.length) / previousLength;
  const changeKinds: string[] = [];
  if (added > 0) changeKinds.push("content-added");
  if (removed > 0) changeKinds.push("content-removed");
  if (changeRatio >= 0.35) changeKinds.push("large-size-change");
  if (changeKinds.length === 0) changeKinds.push("format-or-order-change");

  return {
    changeKinds,
    diffSummary: `تغییر شناسایی شد: ${added} بخش افزوده، ${removed} بخش حذف و تغییر طول تقریبی ${Math.round(changeRatio * 100)} درصد.`,
  };
}
