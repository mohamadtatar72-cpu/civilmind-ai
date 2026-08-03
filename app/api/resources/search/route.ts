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

const publicCatalog = catalog.filter(
  (resource) =>
    resource.publicationStatus !== "needs-review",
);

const resourceBySlug = new Map(
  publicCatalog.map((resource) => [
    resource.slug,
    resource,
  ]),
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
    request.nextUrl.searchParams
      .get("category")
      ?.trim() ?? "";

  const kind =
    request.nextUrl.searchParams.get("kind")?.trim() ?? "";

  const limit = Math.min(
    Math.max(
      Number(
        request.nextUrl.searchParams.get("limit") ?? 24,
      ),
      1,
    ),
    60,
  );

  const offset = Math.max(
    Number(
      request.nextUrl.searchParams.get("offset") ?? 0,
    ),
    0,
  );

  const filteredCatalog = publicCatalog.filter(
    (resource) =>
      (!category ||
        resource.category === category) &&
      (!kind || resource.resourceKind === kind),
  );

  if (!query) {
    const resources = filteredCatalog.slice(
      offset,
      offset + limit,
    );

    return NextResponse.json({
      query,
      total: filteredCatalog.length,
      offset,
      limit,
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
    for (const chunkId of index[token] ?? []) {
      chunkScores.set(
        chunkId,
        (chunkScores.get(chunkId) ?? 0) + 6,
      );
    }

    for (const [indexedToken, chunkIds] of Object.entries(
      index,
    )) {
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

  const grouped = new Map<string, SearchResult>();

  for (const [chunkId, score] of chunkScores) {
    const chunk = chunkById.get(chunkId);

    if (!chunk) continue;

    const resource = resourceBySlug.get(
      chunk.resourceSlug,
    );

    if (!resource) continue;

    if (
      category &&
      resource.category !== category
    ) {
      continue;
    }

    if (
      kind &&
      resource.resourceKind !== kind
    ) {
      continue;
    }

    const current = grouped.get(resource.slug) ?? {
      resource,
      chunks: [],
      score: 0,
    };

    current.score += score;

    if (current.chunks.length < 3) {
      current.chunks.push(chunk);
    }

    grouped.set(resource.slug, current);
  }

  const allResults = Array.from(
    grouped.values(),
  ).sort((a, b) => b.score - a.score);

  return NextResponse.json({
    query,
    total: allResults.length,
    offset,
    limit,
    results: allResults.slice(
      offset,
      offset + limit,
    ),
  });
}
