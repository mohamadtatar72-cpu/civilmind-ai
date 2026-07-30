import type { LibraryTopic } from "./domain";

export interface LibraryReadRepository {
  listActive(): Promise<LibraryTopic[]>;
  getByCode(code: number): Promise<LibraryTopic | null>;
  getBySlug(slug: string): Promise<LibraryTopic | null>;
}
