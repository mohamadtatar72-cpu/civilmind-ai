export type PublicationStatus =
  | "published"
  | "needs-review";

export type ResourceKind =
  | "internal-document"
  | "external-website";

export type SuperLibraryResource = {
  id: string;
  slug: string;
  title: string;
  displayTitle?: string;
  category: string;
  sourceName: string;
  sourceUrl: string | null;
  fileUrl: string | null;
  edition: string | null;
  publishedAt: string | null;
  documentType: string;
  license:
    | "official-public"
    | "public-domain"
    | "owned"
    | "permission"
    | "link-only";
  tags: string[];
  description: string;
  summary?: string;
  official: boolean;
  downloadable: boolean;
  searchable: boolean;
  ocrUsed: boolean;
  pageCount: number;
  sizeBytes: number | null;
  sha256: string | null;
  publicationStatus?: PublicationStatus;
  metadataConfidence?: number;
  reviewReasons?: string[];
  resourceKind?: ResourceKind;
  titleSource?: string;
};

export type SuperLibraryChunk = {
  id: string;
  resourceId: string;
  resourceSlug: string;
  title: string;
  page: number;
  chunk: number;
  text: string;
  sourceUrl: string | null;
  edition: string | null;
};

export type SearchResult = {
  resource: SuperLibraryResource;
  chunks: SuperLibraryChunk[];
  score: number;
};
