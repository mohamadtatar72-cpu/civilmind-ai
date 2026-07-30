import type { FunctionReference } from "convex/server";
import type { api } from "@/convex/_generated/api";
import type { LibraryTopic } from "./domain";

export type PublicTopicPayload = LibraryTopic;
export type PublicTopicResult = PublicTopicPayload | null;
export type PublicTopicListResult = PublicTopicPayload[];

interface LibraryTopicsApi {
  topics: {
    listActive: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      PublicTopicListResult
    >;
    getByCode: FunctionReference<
      "query",
      "public",
      { code: number },
      PublicTopicResult
    >;
    getBySlug: FunctionReference<
      "query",
      "public",
      { slug: string },
      PublicTopicResult
    >;
  };
}

export function asLibraryApi(generatedApi: typeof api): LibraryTopicsApi {
  // Convex codegen produces this shape. The assertion keeps local typechecking
  // useful in restricted sandboxes where generated files cannot be refreshed.
  return generatedApi as LibraryTopicsApi;
}

export function mapPublicTopic(
  topic: NonNullable<PublicTopicResult>,
): LibraryTopic {
  return {
    code: topic.code,
    slug: topic.slug,
    title: topic.title,
    shortTitle: topic.shortTitle,
    discipline: topic.discipline,
    qualification: topic.qualification,
    order: topic.order,
    description: topic.description,
    questionCount: topic.questionCount,
    resourceCount: topic.resourceCount,
    isActive: topic.isActive,
    ...(topic.latestEdition === undefined
      ? {}
      : { latestEdition: topic.latestEdition }),
    ...(topic.sourcePublisher === undefined
      ? {}
      : { sourcePublisher: topic.sourcePublisher }),
    ...(topic.sourceDomain === undefined
      ? {}
      : { sourceDomain: topic.sourceDomain }),
    ...(topic.officialPageUrl === undefined
      ? {}
      : { officialPageUrl: topic.officialPageUrl }),
    ...(topic.officialDocumentUrl === undefined
      ? {}
      : { officialDocumentUrl: topic.officialDocumentUrl }),
    ...(topic.sourceStatus === undefined
      ? {}
      : { sourceStatus: topic.sourceStatus }),
    ...(topic.lastVerifiedAt === undefined
      ? {}
      : { lastVerifiedAt: topic.lastVerifiedAt }),
  };
}

export function mapPublicTopics(
  topics: PublicTopicListResult,
): LibraryTopic[] {
  return topics.map(mapPublicTopic);
}
