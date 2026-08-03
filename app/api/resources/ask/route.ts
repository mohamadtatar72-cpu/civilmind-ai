import { NextRequest, NextResponse } from "next/server";

import chunksJson from "@/public/super-library/chunks.json";
import catalogJson from "@/public/super-library/catalog.json";

import type {
  SuperLibraryChunk,
  SuperLibraryResource,
} from "@/features/super-library/contracts";

const chunks = chunksJson as SuperLibraryChunk[];
const catalog = catalogJson as SuperLibraryResource[];

function tokenize(value: string) {
  return Array.from(
    new Set(
      value
        .normalize("NFKC")
        .toLocaleLowerCase("fa")
        .replace(/\u200c/g, " ")
        .match(/[\p{L}\p{N}_]{2,}/gu) ?? [],
    ),
  );
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    question?: string;
  };

  const question = body.question?.trim() ?? "";

  if (!question) {
    return NextResponse.json(
      {
        status: "invalid-question",
        citations: [],
      },
      { status: 400 },
    );
  }

  const tokens = tokenize(question);

  const ranked = chunks
    .map((chunk) => {
      const haystack = chunk.text
        .normalize("NFKC")
        .toLocaleLowerCase("fa");

      const score = tokens.reduce(
        (total, token) =>
          total +
          (haystack.includes(token) ? 1 : 0),
        0,
      );

      return {
        chunk,
        score,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  if (ranked.length === 0) {
    return NextResponse.json({
      status: "no-verified-source",
      answer: null,
      citations: [],
    });
  }

  const resourceMap = new Map(
    catalog.map((item) => [item.slug, item]),
  );

  const citations = ranked.map(({ chunk }) => {
    const resource = resourceMap.get(chunk.resourceSlug);

    return {
      resourceSlug: chunk.resourceSlug,
      title: resource?.title ?? chunk.title,
      edition: resource?.edition ?? chunk.edition,
      page: chunk.page,
      sourceUrl:
        resource?.sourceUrl ??
        resource?.fileUrl ??
        chunk.sourceUrl,
      excerpt: chunk.text,
    };
  });

  return NextResponse.json({
    status: process.env.AI_PROVIDER
      ? "provider-adapter-required"
      : "provider-missing",
    answer: null,
    citations,
    message:
      "منابع معتبر بازیابی شدند. تولید پاسخ مدل تا زمان تنظیم Provider معتبر غیرفعال است.",
  });
}
