import { NextRequest, NextResponse } from "next/server";

import catalogJson from "@/public/super-library/catalog.json";
import chunksJson from "@/public/super-library/chunks.json";
import indexJson from "@/public/super-library/index.json";

import type {
  SearchResult,
  SuperLibraryChunk,
  SuperLibraryResource,
} from "@/features/super-library/contracts";

const catalog = catalogJson as SuperLibraryResource[];
const chunks = chunksJson as SuperLibraryChunk[];
const index = indexJson as Record<string, string[]>;

const resourceBySlug = new Map(
  catalog.map((resource) => [resource.slug, resource]),
);

const chunkById = new Map(
  chunks.map((chunk) => [chunk.id, chunk]),
);

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

export async function GET(request: NextRequest) {
  const query =
    request.nextUrl.searchParams.get("q")?.trim() ?? "";

  const category =
    request.nextUrl.searchParams.get("category")?.trim() ?? "";

  const limit = Math.min(
    Math.max(
      Number(request.nextUrl.searchParams.get("limit") ?? 30),
      1,
    ),
    100,
  );

  if (!query) {
    const resources = catalog
      .filter(
        (resource) =>
          !category || resource.category === category,
      )
      .slice(0, limit);

    return NextResponse.json({
      query,
      results: resources.map((resource) => ({
        resource,
        chunks: [],
        score: 0,
      })),
    });
  }

  const tokens = tokenize(query);
  const chunkScores = new Map<string, number>();

  for (const token of tokens) {
    const exact = index[token] ?? [];

    for (const chunkId of exact) {
      chunkScores.set(
        chunkId,
        (chunkScores.get(chunkId) ?? 0) + 5,
      );
    }

    for (const [indexedToken, chunkIds] of Object.entries(index)) {
      if (
        indexedToken !== token &&
        indexedToken.includes(token)
      ) {
        for (const chunkId of chunkIds) {
          chunkScores.set(
            chunkId,
            (chunkScores.get(chunkId) ?? 0) + 1,
          );
        }
      }
    }
  }

  const grouped = new Map<
    string,
    {
      resource: SuperLibraryResource;
      chunks: SuperLibraryChunk[];
      score: number;
    }
  >();

  for (const [chunkId, score] of chunkScores) {
    const chunk = chunkById.get(chunkId);

    if (!chunk) continue;

    const resource = resourceBySlug.get(chunk.resourceSlug);

    if (!resource) continue;

    if (category && resource.category !== category) {
      continue;
    }

    const current = grouped.get(resource.slug) ?? {
      resource,
      chunks: [],
      score: 0,
    };

    current.score += score;

    if (current.chunks.length < 4) {
      current.chunks.push(chunk);
    }

    grouped.set(resource.slug, current);
  }

  const results: SearchResult[] = Array.from(
    grouped.values(),
  )
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return NextResponse.json({
    query,
    results,
  });
}
