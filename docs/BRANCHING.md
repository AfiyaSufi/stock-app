# Branching strategy: jsonModel vs sqlModel

We keep two clear milestones in Git so it’s easy to test and compare the JSON-based version with the SQL-based one.

## Milestones
- jsonModel: The app reads from `stock_market_data.json` and renders a table + chart.
- sqlModel: The app uses SQLite with CRUD endpoints; the frontend supports editing rows.

## How we track them
- A branch and tag are created for each milestone so you can check out a stable snapshot at any time.
- Naming:
  - `jsonModel` (branch) and `jsonModel` (tag): last commit of the JSON-powered milestone
  - `sqlModel` (branch) and `sqlModel` (tag): last commit of the SQL milestone (created later)

## Working model
- Main development continues on `main`.
- When a milestone is complete:
  1. Commit all changes.
  2. Create a branch named after the milestone from the current `main`.
  3. Create a tag on the same commit.

## Commands (reference)
These are examples; run them from the repo root.

```
# Create branch and tag for jsonModel
git checkout -b jsonModel
git tag jsonModel

# Push (optional)
# git push origin jsonModel
# git push origin jsonModel --tags

# Later, after SQL migration milestone
# git checkout main
# git checkout -b sqlModel
# git tag sqlModel
```

## Why both branch and tag?
- The branch lets you apply fixes or cherry-picks specifically to that milestone if ever needed.
- The tag gives you an immutable pointer to the exact state you reviewed or shipped.
