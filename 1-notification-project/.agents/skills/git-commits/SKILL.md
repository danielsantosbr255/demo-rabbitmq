---
name: git-commits
description: How to correctly analyze and group changes into conventional commits with rich scopes.
---

# Git Commit Analyzer

When the user asks you to commit changes ("fazer commit", "gerar commits", "commitar as alterações"), follow this analytical workflow to ensure the repository remains organized with atomic, clean, and semantic conventional commits.

## Workflow Execution

1. **Check Status**: Run `git status` to see what files are modified, deleted, or untracked.
2. **Analyze Diffs**: Run `git diff` on modified files, or view untracked files, to understand exactly *what* changed and *why*.
3. **Group by Context**: Do not dump everything into a single commit! Group files by their logical context (e.g., frontend changes, database changes, documentation).
4. **Stage and Commit Sequentially**: Use `git add <file/folder>` followed by `git commit -m "<message>"` for each logical group.

Always use the [Conventional Commits](https://www.conventionalcommits.org/) format. Ensure messages are in **English**, concise, and clearly explain the purpose.

**Key Syntax Rules:**
- The description MUST be written in the **imperative mood** (e.g., "add" instead of "adds" or "added", "fix" instead of "fixes" or "fixed"). Think of it as completing the sentence: "If applied, this commit will..."
- The description MUST start with a **lowercase** letter.
- The description MUST NOT end with a **period**.

Format: `<type>(<scope>): <description>`

Optional:
```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### 1. Types
Use appropriate types:
- `feat`: A new feature
- `fix`: A bug fix
- `refactor`: A code change that neither fixes a bug nor adds a feature (e.g., architecture change, ORM updates)
- `docs`: Documentation only changes
- `chore`: Minor tasks, tooling, or agent-related structure
- `style`: Formatting, missing semi-colons, white-space, etc. (does not change production code logic)
- `test`: Adding or correcting tests
- `perf`: A code change that improves performance
- `build`: Changes that affect the build system or external dependencies (e.g., npm, pnpm, go.mod)
- `ci`: Changes to CI configuration files and scripts (e.g., GitHub Actions, GitLab CI)

### 2. Rich Scopes (Mandatory Rule)
The `<scope>` must **always** be rich and explicitly identify the layer and the feature/resource affected.
Do not use overly complex or massive scopes, but be precise.

**Monorepo Project Rule:**
When working in a monorepo with multiple separated projects, use the project context as the prefix of the scope.
IMPORTANT: Strip numerical prefixes (e.g., `1-`) and generic suffixes (e.g., `-project`) from the project folder name.
For example, if the project folder is `1-notification-project` and you change auth files, the scope should be `notification/auth`.

**Format Examples:**
- `notification/auth`
- `financial/reports`
- `notification/drizzle`
- `frontend/sidebar`
- `agents/workflows`
### 3. Body (Optional)
The body provides a detailed explanation of the *why*. It is essential for complex architectural shifts.

**Formatting Rules:**
- Must be separated from the header by a single blank line.
- Should use a list format with dashes (`-`) for multiple points to improve readability in UIs (like GitHub/VSCode).
- Keep a blank line between the body and the footer.

### 4. Footer (Optional)
Use the footer to reference issue IDs or to flag breaking changes.
- **Breaking Changes**: Start with `BREAKING CHANGE: <description>`.
- **References**: `Fixes #123`, `Closes #456`.

### 5. Execution Advice
- In Windows/PowerShell environments, run Git commands *sequentially* in isolated `run_command` steps.
- If a change is too large and touches multiple scopes, break it down using `git add <specific-file>` to create atomic records.
- **PowerShell Multi-line Commits**: Use a variable with a here-string (`@" ... "@`) for stability and clean formatting:
  ```powershell
  $msg = @"
  type(scope): header

  - detail 1
  - detail 2
  "@
  git commit -m $msg
  ```


**Good Commit Examples:**

```
feat(backend/projects): add support for sprint association in entities

- Implement project-to-sprint relationship in Drizzle schema
- Add validation logic to ensure sprints belong to the project tenant
- Update repository to support atomic project initialization

Fixes #102
```

```
refactor(backend/drizzle): modernize schema definitions removing circular dep

- Remove redundant defaultRoleId from tenant settings
- Implement isDefault flag in roles table as the single source of truth
- Clean up outdated FK references in tenant relations
```

```
docs(backend/architecture): document tenant invite and project assignment flow

- Add detailed guide on direct project assignment vs tenant invites
- Document implicit ownership model used in CASL ability factory
- Update architectural decision records for B2B governance
```
