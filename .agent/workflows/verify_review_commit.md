---
description: Protocol for verifying code, requesting review, and committing
---

1. **Verify Correctness**: Always run a build check (e.g., `npm run build` or `pnpm run build`) or relevant tests to ensure the code compiles and runs.
2. **Request Review**: Before creating a commit, use `notify_user` to present the changes to the user for review.
3. **Commit**: Once the user has reviewed and approved the changes (or if explicitly instructed to proceed), create the git commit.
