# Turbo TypeScript Monorepo

```bash
find . -name "node_modules" -o -name "dist" -o -name ".turbo" -o -name "package-lock.json" | xargs rm -rf
```

```bash
find . -name package.json -not -path "*/dist/*" -not -path "*/node_modules/*" -execdir npx npm-check-updates@latest -u \;
```
