export type LibraryQualification =
  | "supervision"
  | "execution"
  | "calculation"
  | "general";

export type OfficialSourceStatus =
  | "verified"
  | "pending-review"
  | "outdated";

export interface LibraryTopic {
  code: number;
  slug: string;
  title: string;
  shortTitle: string;
  discipline: "civil";
  qualification: LibraryQualification;
  order: number;
  description: string;
  questionCount: number;
  resourceCount: number;
  isActive: boolean;
  latestEdition?: string;
  sourcePublisher?: string;
  sourceDomain?: string;
  officialPageUrl?: string;
  officialDocumentUrl?: string;
  sourceStatus?: OfficialSourceStatus;
  lastVerifiedAt?: number;
}
