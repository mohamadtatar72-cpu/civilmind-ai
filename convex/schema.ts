import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const userRole = v.union(
  v.literal("free"),
  v.literal("premium"),
  v.literal("admin"),
);

const userStatus = v.union(
  v.literal("active"),
  v.literal("suspended"),
  v.literal("deleted"),
);

const subscriptionStatus = v.union(
  v.literal("active"),
  v.literal("trialing"),
  v.literal("past_due"),
  v.literal("canceled"),
  v.literal("expired"),
);

const aiProvider = v.union(
  v.literal("openai"),
  v.literal("gemini"),
  v.literal("anthropic"),
);

const aiCapability = v.union(
  v.literal("study-coach"),
  v.literal("exam-analysis"),
  v.literal("study-planner"),
  v.literal("pdf-question"),
);

const aiRequestStatus = v.union(
  v.literal("planned"),
  v.literal("queued"),
  v.literal("running"),
  v.literal("completed"),
  v.literal("failed"),
  v.literal("blocked"),
  v.literal("cancelled"),
);

const aiCircuitStatus = v.union(
  v.literal("closed"),
  v.literal("open"),
  v.literal("half-open"),
  v.literal("disabled"),
);

const sourceRisk = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("critical"),
);

const sourceProposalStatus = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("quarantined"),
);

const sourceSecurityStatus = v.union(
  v.literal("clean"),
  v.literal("suspicious"),
  v.literal("quarantined"),
);

const sourceSyncStatus = v.union(
  v.literal("baseline"),
  v.literal("unchanged"),
  v.literal("pending-review"),
  v.literal("quarantined"),
  v.literal("failed"),
);

export default defineSchema({
  topics: defineTable({
    code: v.number(),
    slug: v.string(),
    title: v.string(),
    shortTitle: v.string(),
    discipline: v.literal("civil"),
    qualification: v.union(
      v.literal("supervision"),
      v.literal("execution"),
      v.literal("calculation"),
      v.literal("general"),
    ),
    order: v.number(),
    description: v.string(),
    questionCount: v.number(),
    resourceCount: v.number(),
    isActive: v.boolean(),
    latestEdition: v.optional(v.string()),
    sourcePublisher: v.optional(v.string()),
    sourceDomain: v.optional(v.string()),
    officialPageUrl: v.optional(v.string()),
    officialDocumentUrl: v.optional(v.string()),
    sourceStatus: v.optional(
      v.union(
        v.literal("verified"),
        v.literal("pending-review"),
        v.literal("outdated"),
      ),
    ),
    lastVerifiedAt: v.optional(v.number()),
  })
    .index("by_code", ["code"])
    .index("by_slug", ["slug"])
    .index("by_isActive_and_order", ["isActive", "order"])
    .index("by_discipline_and_qualification", [
      "discipline",
      "qualification",
    ]),

  officialResources: defineTable({
    key: v.string(),
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("official-home"),
      v.literal("exam-center"),
      v.literal("exam-materials"),
      v.literal("past-exams"),
      v.literal("answer-guides"),
      v.literal("regulations"),
      v.literal("corrections"),
      v.literal("exam-notice"),
    ),
    sourcePublisher: v.string(),
    sourceDomain: v.string(),
    sourceUrl: v.string(),
    status: v.union(
      v.literal("verified"),
      v.literal("pending-review"),
      v.literal("outdated"),
    ),
    isActive: v.boolean(),
    order: v.number(),
    lastVerifiedAt: v.optional(v.number()),
    lastContentHash: v.optional(v.string()),
    lastSnapshotId: v.optional(v.id("sourceSnapshots")),
    lastSyncAt: v.optional(v.number()),
    lastSyncStatus: v.optional(sourceSyncStatus),
    lastHttpStatus: v.optional(v.number()),
  })
    .index("by_key", ["key"])
    .index("by_category_and_isActive", ["category", "isActive"])
    .index("by_isActive_and_order", ["isActive", "order"])
    .index("by_status", ["status"]),

  users: defineTable({
    authSubject: v.string(),
    email: v.optional(v.string()),
    displayName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    role: userRole,
    status: userStatus,
    onboardingCompleted: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastSeenAt: v.optional(v.number()),
  })
    .index("by_authSubject", ["authSubject"])
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_status", ["status"])
    .index("by_role_and_status", ["role", "status"]),

  subscriptions: defineTable({
    userId: v.id("users"),
    plan: v.union(v.literal("free"), v.literal("premium")),
    status: subscriptionStatus,
    provider: v.optional(v.string()),
    externalCustomerId: v.optional(v.string()),
    externalSubscriptionId: v.optional(v.string()),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_plan_and_status", ["plan", "status"])
    .index("by_externalSubscriptionId", ["externalSubscriptionId"]),

  auditLogs: defineTable({
    actorUserId: v.optional(v.id("users")),
    actorAuthSubject: v.optional(v.string()),
    action: v.string(),
    resourceType: v.string(),
    resourceId: v.optional(v.string()),
    result: v.union(
      v.literal("success"),
      v.literal("denied"),
      v.literal("failure"),
    ),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_actorUserId_and_createdAt", ["actorUserId", "createdAt"])
    .index("by_action_and_createdAt", ["action", "createdAt"])
    .index("by_resourceType_and_createdAt", ["resourceType", "createdAt"])
    .index("by_createdAt", ["createdAt"]),

  aiGatewayPolicies: defineTable({
    key: v.literal("default"),
    freeDailyRequests: v.number(),
    premiumDailyRequests: v.number(),
    adminDailyRequests: v.number(),
    maxInputCharacters: v.number(),
    maxOutputTokens: v.number(),
    monthlyBudgetMicrousd: v.number(),
    fallbackEnabled: v.boolean(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
  }).index("by_key", ["key"]),

  aiProviderConfigs: defineTable({
    provider: aiProvider,
    displayName: v.string(),
    enabled: v.boolean(),
    adapterReady: v.boolean(),
    routePriority: v.number(),
    modelAlias: v.string(),
    maxConcurrency: v.number(),
    timeoutMs: v.number(),
    monthlyBudgetMicrousd: v.number(),
    spendMicrousd: v.number(),
    circuitStatus: aiCircuitStatus,
    consecutiveFailures: v.number(),
    openedAt: v.optional(v.number()),
    cooldownUntil: v.optional(v.number()),
    lastSuccessAt: v.optional(v.number()),
    lastFailureAt: v.optional(v.number()),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
  })
    .index("by_provider", ["provider"])
    .index("by_enabled_and_routePriority", ["enabled", "routePriority"])
    .index("by_circuitStatus", ["circuitStatus"]),

  aiRequestLedger: defineTable({
    userId: v.id("users"),
    dayKey: v.string(),
    idempotencyKey: v.string(),
    capability: aiCapability,
    status: aiRequestStatus,
    provider: v.optional(aiProvider),
    modelAlias: v.optional(v.string()),
    inputCharacters: v.number(),
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),
    estimatedCostMicrousd: v.number(),
    actualCostMicrousd: v.optional(v.number()),
    failureCode: v.optional(v.string()),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_userId_and_createdAt", ["userId", "createdAt"])
    .index("by_userId_and_dayKey", ["userId", "dayKey"])
    .index("by_userId_and_idempotencyKey", ["userId", "idempotencyKey"])
    .index("by_status_and_createdAt", ["status", "createdAt"])
    .index("by_provider_and_createdAt", ["provider", "createdAt"]),

  aiUsageBuckets: defineTable({
    userId: v.id("users"),
    dayKey: v.string(),
    requestCount: v.number(),
    reservedInputCharacters: v.number(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    costMicrousd: v.number(),
    updatedAt: v.number(),
  }).index("by_userId_and_dayKey", ["userId", "dayKey"]),

  aiProviderEvents: defineTable({
    provider: aiProvider,
    event: v.union(
      v.literal("request-success"),
      v.literal("request-failure"),
      v.literal("circuit-opened"),
      v.literal("circuit-half-open"),
      v.literal("circuit-closed"),
      v.literal("provider-disabled"),
    ),
    requestId: v.optional(v.id("aiRequestLedger")),
    code: v.optional(v.string()),
    message: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_provider_and_createdAt", ["provider", "createdAt"])
    .index("by_event_and_createdAt", ["event", "createdAt"]),

  sourceSyncRuns: defineTable({
    trigger: v.union(v.literal("manual"), v.literal("scheduled")),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("partial"),
      v.literal("failed"),
    ),
    requestedBy: v.optional(v.id("users")),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    sourceCount: v.number(),
    baselineCount: v.number(),
    unchangedCount: v.number(),
    changedCount: v.number(),
    quarantinedCount: v.number(),
    failedCount: v.number(),
    errorSummary: v.optional(v.string()),
  })
    .index("by_status_and_startedAt", ["status", "startedAt"])
    .index("by_startedAt", ["startedAt"]),

  sourceSnapshots: defineTable({
    runId: v.id("sourceSyncRuns"),
    sourceKey: v.string(),
    sourceUrl: v.string(),
    contentHash: v.string(),
    normalizedText: v.string(),
    byteLength: v.number(),
    contentType: v.string(),
    httpStatus: v.number(),
    etag: v.optional(v.string()),
    lastModified: v.optional(v.string()),
    fetchedAt: v.number(),
    securityStatus: sourceSecurityStatus,
    riskLevel: sourceRisk,
    findings: v.array(v.string()),
    isLastKnownGood: v.boolean(),
    previousSnapshotId: v.optional(v.id("sourceSnapshots")),
    promotedAt: v.optional(v.number()),
    promotedBy: v.optional(v.id("users")),
  })
    .index("by_sourceKey_and_fetchedAt", ["sourceKey", "fetchedAt"])
    .index("by_sourceKey_and_contentHash", ["sourceKey", "contentHash"])
    .index("by_sourceKey_and_isLastKnownGood", [
      "sourceKey",
      "isLastKnownGood",
    ]),

  sourceSyncItems: defineTable({
    runId: v.id("sourceSyncRuns"),
    sourceKey: v.string(),
    sourceUrl: v.string(),
    status: v.union(
      v.literal("baseline"),
      v.literal("unchanged"),
      v.literal("proposal"),
      v.literal("quarantined"),
      v.literal("failed"),
    ),
    httpStatus: v.optional(v.number()),
    snapshotId: v.optional(v.id("sourceSnapshots")),
    proposalId: v.optional(v.id("sourceChangeProposals")),
    message: v.optional(v.string()),
    processedAt: v.number(),
  })
    .index("by_runId_and_processedAt", ["runId", "processedAt"])
    .index("by_sourceKey_and_processedAt", ["sourceKey", "processedAt"]),

  sourceChangeProposals: defineTable({
    sourceKey: v.string(),
    sourceUrl: v.string(),
    title: v.string(),
    summary: v.string(),
    riskLevel: sourceRisk,
    securityReport: v.string(),
    contentHash: v.string(),
    status: sourceProposalStatus,
    detectedAt: v.number(),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.id("users")),
    reviewNote: v.optional(v.string()),
    snapshotId: v.optional(v.id("sourceSnapshots")),
    previousSnapshotId: v.optional(v.id("sourceSnapshots")),
    sourceSyncRunId: v.optional(v.id("sourceSyncRuns")),
    diffSummary: v.optional(v.string()),
    changeKinds: v.optional(v.array(v.string())),
    scanFindings: v.optional(v.array(v.string())),
  })
    .index("by_status_and_detectedAt", ["status", "detectedAt"])
    .index("by_sourceKey_and_detectedAt", ["sourceKey", "detectedAt"])
    .index("by_sourceKey_and_contentHash", ["sourceKey", "contentHash"]),

  sourceAppendices: defineTable({
    sourceKey: v.string(),
    sourceUrl: v.string(),
    title: v.string(),
    snapshotId: v.id("sourceSnapshots"),
    proposalId: v.id("sourceChangeProposals"),
    contentHash: v.string(),
    content: v.string(),
    summary: v.string(),
    appendedAt: v.number(),
    appendedBy: v.id("users"),
  })
    .index("by_sourceKey_and_appendedAt", ["sourceKey", "appendedAt"])
    .index("by_snapshotId", ["snapshotId"])
    .index("by_proposalId", ["proposalId"]),

  pdfDocuments: defineTable({
    ownerUserId: v.optional(v.id("users")),
    title: v.string(),
    fileName: v.string(),
    mimeType: v.literal("application/pdf"),
    byteLength: v.number(),
    checksumSha256: v.string(),
    visibility: v.union(
      v.literal("private"),
      v.literal("premium"),
      v.literal("public"),
    ),
    lifecycle: v.union(
      v.literal("registered"),
      v.literal("processing"),
      v.literal("ready"),
      v.literal("failed"),
      v.literal("quarantined"),
      v.literal("archived"),
    ),
    sourceUrl: v.optional(v.string()),
    pageCount: v.optional(v.number()),
    activeVersion: v.number(),
    parentDocumentId: v.optional(v.id("pdfDocuments")),
    createdAt: v.number(),
    updatedAt: v.number(),
    processedAt: v.optional(v.number()),
    quarantineReason: v.optional(v.string()),
  })
    .index("by_visibility_and_lifecycle", ["visibility", "lifecycle"])
    .index("by_ownerUserId_and_createdAt", ["ownerUserId", "createdAt"])
    .index("by_checksumSha256", ["checksumSha256"])
    .index("by_lifecycle_and_updatedAt", ["lifecycle", "updatedAt"]),

  pdfProcessingJobs: defineTable({
    documentId: v.id("pdfDocuments"),
    requestedBy: v.optional(v.id("users")),
    attempt: v.number(),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("quarantined"),
      v.literal("cancelled"),
    ),
    stage: v.union(
      v.literal("register"),
      v.literal("extract"),
      v.literal("chunk"),
      v.literal("index"),
    ),
    errorCode: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_documentId_and_createdAt", ["documentId", "createdAt"])
    .index("by_createdAt", ["createdAt"])
    .index("by_status_and_createdAt", ["status", "createdAt"]),

  pdfPages: defineTable({
    documentId: v.id("pdfDocuments"),
    pageNumber: v.number(),
    text: v.string(),
    textHash: v.string(),
    charCount: v.number(),
    createdAt: v.number(),
  }).index("by_documentId_and_pageNumber", ["documentId", "pageNumber"]),

  pdfChunks: defineTable({
    documentId: v.id("pdfDocuments"),
    pageId: v.id("pdfPages"),
    ownerUserId: v.optional(v.id("users")),
    visibility: v.union(
      v.literal("private"),
      v.literal("premium"),
      v.literal("public"),
    ),
    documentLifecycle: v.union(
      v.literal("processing"),
      v.literal("ready"),
      v.literal("archived"),
    ),
    pageNumber: v.number(),
    chunkIndex: v.number(),
    text: v.string(),
    textHash: v.string(),
    charStart: v.number(),
    charEnd: v.number(),
    citationLabel: v.string(),
    createdAt: v.number(),
  })
    .index("by_documentId_and_chunkIndex", ["documentId", "chunkIndex"])
    .searchIndex("search_text", {
      searchField: "text",
      filterFields: ["visibility", "ownerUserId", "documentLifecycle"],
    }),

  pdfRetrievalLogs: defineTable({
    userId: v.optional(v.id("users")),
    queryHash: v.string(),
    resultCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId_and_createdAt", ["userId", "createdAt"])
    .index("by_createdAt", ["createdAt"]),

  studySessions: defineTable({
    userId: v.id("users"),
    topicId: v.optional(v.id("topics")),
    topicKey: v.string(),
    topicTitle: v.string(),
    durationMinutes: v.number(),
    source: v.union(
      v.literal("manual"),
      v.literal("planner"),
      v.literal("pdf"),
    ),
    notes: v.optional(v.string()),
    studiedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId_and_studiedAt", ["userId", "studiedAt"])
    .index("by_userId_and_topicKey_and_studiedAt", [
      "userId",
      "topicKey",
      "studiedAt",
    ]),

  practiceAttempts: defineTable({
    userId: v.id("users"),
    topicId: v.optional(v.id("topics")),
    topicKey: v.string(),
    topicTitle: v.string(),
    totalQuestions: v.number(),
    correctAnswers: v.number(),
    incorrectAnswers: v.number(),
    unanswered: v.number(),
    durationSeconds: v.number(),
    scorePercent: v.number(),
    completedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId_and_completedAt", ["userId", "completedAt"])
    .index("by_userId_and_topicKey_and_completedAt", [
      "userId",
      "topicKey",
      "completedAt",
    ]),

  userTopicProgress: defineTable({
    userId: v.id("users"),
    topicKey: v.string(),
    topicTitle: v.string(),
    studyMinutes: v.number(),
    sessionsCount: v.number(),
    testsCount: v.number(),
    questionsAnswered: v.number(),
    correctAnswers: v.number(),
    masteryPercent: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId_and_topicKey", ["userId", "topicKey"])
    .index("by_userId_and_updatedAt", ["userId", "updatedAt"]),

  plannerTasks: defineTable({
    userId: v.id("users"),
    dayKey: v.string(),
    title: v.string(),
    taskType: v.union(
      v.literal("study"),
      v.literal("test"),
      v.literal("review"),
      v.literal("other"),
    ),
    topicKey: v.optional(v.string()),
    plannedMinutes: v.number(),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
    ),
    status: v.union(
      v.literal("planned"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
    position: v.number(),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId_and_dayKey", ["userId", "dayKey"])
    .index("by_userId_and_status_and_dayKey", ["userId", "status", "dayKey"]),

  examArchives: defineTable({
    key: v.string(),
    title: v.string(),
    yearLabel: v.string(),
    sessionLabel: v.string(),
    officialPageUrl: v.string(),
    sourcePublisher: v.string(),
    sourceDomain: v.string(),
    status: v.union(v.literal("verified"), v.literal("pending-review")),
    discoveredAt: v.number(),
    lastVerifiedAt: v.number(),
  }).index("by_key", ["key"]).index("by_yearLabel_and_sessionLabel", ["yearLabel", "sessionLabel"]).index("by_status_and_lastVerifiedAt", ["status", "lastVerifiedAt"]),

  examArchiveDocuments: defineTable({
    archiveId: v.id("examArchives"),
    kind: v.union(v.literal("question-booklet"), v.literal("answer-key"), v.literal("descriptive-guide")),
    title: v.string(), discipline: v.string(), qualification: v.optional(v.string()), sourceUrl: v.string(),
    sourcePublisher: v.string(), status: v.union(v.literal("verified"), v.literal("pending-review")),
    discoveredAt: v.number(), lastVerifiedAt: v.number(),
  }).index("by_archiveId_and_kind", ["archiveId", "kind"]).index("by_archiveId_and_discipline", ["archiveId", "discipline"]).index("by_archiveId_and_sourceUrl", ["archiveId", "sourceUrl"]),

  userExamPreferences: defineTable({
    userId: v.id("users"),
    discipline: v.string(),
    qualification: v.string(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  examQuestionReferences: defineTable({
    archiveDocumentId: v.id("examArchiveDocuments"),
    questionNumber: v.number(),
    discipline: v.string(),
    qualification: v.optional(v.string()),
    topicCode: v.number(),
    topicTitle: v.string(),
    sourcePage: v.optional(v.number()),
    sourceExcerpt: v.optional(v.string()),
    analysisStatus: v.union(v.literal("pending"), v.literal("reviewed")),
    createdAt: v.number(),
  }).index("by_topicCode_and_discipline", ["topicCode", "discipline"]).index("by_archiveDocumentId_and_questionNumber", ["archiveDocumentId", "questionNumber"]),

  examSessions: defineTable({
    userId: v.id("users"),
    title: v.string(),
    status: v.union(
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("abandoned"),
    ),
    totalQuestions: v.number(),
    durationSeconds: v.number(),
    correctAnswers: v.optional(v.number()),
    incorrectAnswers: v.optional(v.number()),
    unanswered: v.optional(v.number()),
    scorePercent: v.optional(v.number()),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_userId_and_startedAt", ["userId", "startedAt"])
    .index("by_userId_and_status_and_startedAt", [
      "userId",
      "status",
      "startedAt",
    ]),

  examSessionItems: defineTable({
    sessionId: v.id("examSessions"),
    questionKey: v.string(),
    topicKey: v.string(),
    topicTitle: v.string(),
    stem: v.string(),
    options: v.array(v.string()),
    correctIndex: v.number(),
    explanation: v.string(),
    position: v.number(),
    selectedIndex: v.optional(v.number()),
    isCorrect: v.optional(v.boolean()),
  })
    .index("by_sessionId_and_position", ["sessionId", "position"])
    .index("by_sessionId_and_topicKey", ["sessionId", "topicKey"]),

  examTopicStats: defineTable({
    userId: v.id("users"),
    topicKey: v.string(),
    topicTitle: v.string(),
    attemptsCount: v.number(),
    answeredCount: v.number(),
    correctCount: v.number(),
    incorrectCount: v.number(),
    accuracyPercent: v.number(),
    lastAttemptAt: v.number(),
  })
    .index("by_userId_and_topicKey", ["userId", "topicKey"])
    .index("by_userId_and_accuracyPercent", ["userId", "accuracyPercent"]),
});
