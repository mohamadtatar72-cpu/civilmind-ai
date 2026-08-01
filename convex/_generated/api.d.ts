/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aiAdmin from "../aiAdmin.js";
import type * as aiGateway from "../aiGateway.js";
import type * as aiRuntime from "../aiRuntime.js";
import type * as auditLogs from "../auditLogs.js";
import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as examEngine from "../examEngine.js";
import type * as examArchives from "../examArchives.js";
import type * as examAccess from "../examAccess.js";
import type * as lib_aiAdapterContract from "../lib/aiAdapterContract.js";
import type * as lib_aiPolicy from "../lib/aiPolicy.js";
import type * as lib_aiToolPolicy from "../lib/aiToolPolicy.js";
import type * as lib_audit from "../lib/audit.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_pdfIngestionPolicy from "../lib/pdfIngestionPolicy.js";
import type * as lib_sourceSyncSecurity from "../lib/sourceSyncSecurity.js";
import type * as officialResources from "../officialResources.js";
import type * as pdfLibrary from "../pdfLibrary.js";
import type * as planner from "../planner.js";
import type * as sourceApprovals from "../sourceApprovals.js";
import type * as sourceSync from "../sourceSync.js";
import type * as studyProgress from "../studyProgress.js";
import type * as subscriptions from "../subscriptions.js";
import type * as topics from "../topics.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aiAdmin: typeof aiAdmin;
  aiGateway: typeof aiGateway;
  aiRuntime: typeof aiRuntime;
  auditLogs: typeof auditLogs;
  crons: typeof crons;
  dashboard: typeof dashboard;
  examEngine: typeof examEngine;
  examArchives: typeof examArchives;
  examAccess: typeof examAccess;
  "lib/aiAdapterContract": typeof lib_aiAdapterContract;
  "lib/aiPolicy": typeof lib_aiPolicy;
  "lib/aiToolPolicy": typeof lib_aiToolPolicy;
  "lib/audit": typeof lib_audit;
  "lib/auth": typeof lib_auth;
  "lib/pdfIngestionPolicy": typeof lib_pdfIngestionPolicy;
  "lib/sourceSyncSecurity": typeof lib_sourceSyncSecurity;
  officialResources: typeof officialResources;
  pdfLibrary: typeof pdfLibrary;
  planner: typeof planner;
  sourceApprovals: typeof sourceApprovals;
  sourceSync: typeof sourceSync;
  studyProgress: typeof studyProgress;
  subscriptions: typeof subscriptions;
  topics: typeof topics;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
