# CivilMind AI — GitHub Worker Instructions

Before any work, read in order:

1. `/AGENTS.md`
2. `/docs/EXECUTION_LAWS.md`
3. `/docs/MASTER_EXECUTION_PLAN.md`
4. `/docs/CHANGELOG.md`
5. latest commits on `develop/civilmind-v2`

These files are binding.

Operate in execution mode:

- continue from the first genuinely incomplete sprint;
- modify the real product, not only documentation;
- preserve existing working behavior;
- complete user-visible flows end-to-end;
- run typecheck, lint, tests, and build;
- fix failures caused by your work;
- commit and push completed work;
- update the changelog;
- continue to the next safe task without waiting for approval.

Do not stop because one plugin, deployment provider, browser, API, quota, or terminal is unavailable. Queue only the dependent task and use remaining tools for other meaningful roadmap work.

Never discard unknown local changes. Preserve them first, then reconcile the workspace safely.

Only pause for an exact OAuth/login/permission approval, destructive data operation, irreversible security decision, or unavoidable paid action.

Status-only replies are forbidden while safe implementation work remains.
