# I18N Missing Keys Report

Date: 2026-07-11

## Summary

- admin-web: 0 Arabic keys missing, 0 French keys missing.
- public-web: 0 Arabic keys missing, 0 French keys missing.
- mobile: 0 Arabic keys missing, 0 French keys missing.

## admin-web

### Missing Arabic

- None

### Missing French

- None

### Extra Arabic Keys

- accessibility.font.reset

### Extra French Keys

- accessibility.font.reset

### DOM Safety-Net Keys Missing In Arabic

- None

### DOM Safety-Net Keys Missing In French

- None

## public-web

### Missing Arabic

- None

### Missing French

- None

### Extra Arabic Keys

- None

### Extra French Keys

- None

### DOM Safety-Net Keys Missing In Arabic

- None

### DOM Safety-Net Keys Missing In French

- None

## mobile

### Missing Arabic

- None

### Missing French

- None

### Extra Arabic Keys

- None

### Extra French Keys

- None

### DOM Safety-Net Keys Missing In Arabic

- None

### DOM Safety-Net Keys Missing In French

- None

## Enforcement Recommendation

- Run `node scripts/i18n-audit.mjs` before staging handoff.
- Current result after I18N-FINAL-2 slice: 0 missing Arabic keys and 0 missing French keys across Admin Web, Public Web, and Mobile.
- Promote missing `ar/fr` keys to CI failure once the current candidate list has been fully reviewed and converted.
