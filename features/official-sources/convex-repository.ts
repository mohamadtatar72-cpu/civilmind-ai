import type { FunctionReference } from "convex/server";
import type { api } from "@/convex/_generated/api";
import type {
  OfficialResource,
  OfficialResourceCategory,
} from "./domain";

export type PublicOfficialResourcePayload = OfficialResource;
export type PublicOfficialResourceListResult = PublicOfficialResourcePayload[];

interface OfficialResourcesApi {
  officialResources: {
    listActive: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      PublicOfficialResourceListResult
    >;
    listByCategory: FunctionReference<
      "query",
      "public",
      { category: OfficialResourceCategory },
      PublicOfficialResourceListResult
    >;
    getByKey: FunctionReference<
      "query",
      "public",
      { key: string },
      PublicOfficialResourcePayload | null
    >;
  };
}

export function asOfficialResourcesApi(
  generatedApi: typeof api,
): OfficialResourcesApi {
  return generatedApi as OfficialResourcesApi;
}

export function mapPublicOfficialResource(
  resource: PublicOfficialResourcePayload,
): OfficialResource {
  return {
    key: resource.key,
    title: resource.title,
    description: resource.description,
    category: resource.category,
    sourcePublisher: resource.sourcePublisher,
    sourceDomain: resource.sourceDomain,
    sourceUrl: resource.sourceUrl,
    status: resource.status,
    isActive: resource.isActive,
    order: resource.order,
    ...(resource.lastVerifiedAt === undefined
      ? {}
      : { lastVerifiedAt: resource.lastVerifiedAt }),
  };
}

export function mapPublicOfficialResources(
  resources: PublicOfficialResourceListResult,
): OfficialResource[] {
  return resources.map(mapPublicOfficialResource);
}
