# Rollback Procedure

## View all checkpoints
```bash
git tag -l "checkpoint-*"
```

## View recent commits
```bash
git log --oneline -20
```

## Roll back to a specific checkpoint
```bash
git checkout [checkpoint-tag]
```

## Roll back last commit only (keep files)
```bash
git reset --soft HEAD~1
```

## Roll back last commit and discard changes
```bash
git reset --hard HEAD~1
```

## Roll back to specific commit
```bash
git reset --hard [commit-hash]
```

## After rollback, force push to deploy
```bash
git push origin main --force
```

## Emergency: restore from last known good tag
```bash
git checkout checkpoint-[date] -b recovery-branch
git push origin recovery-branch
```

Then merge `recovery-branch` to `main` via PR.
