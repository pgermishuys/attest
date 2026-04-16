# Releasing

## Version Policy

Attest follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html):

- **Patch** (0.1.x): bug fixes, documentation updates
- **Minor** (0.x.0): new features, non-breaking changes
- **Major** (x.0.0): breaking API changes

While in 0.x, minor versions may include breaking changes.

## Cutting a Release

### 1. Update CHANGELOG.md

Add a new version section with the changes:

```markdown
## [0.2.0] - YYYY-MM-DD

### Added
- ...

### Changed
- ...

### Fixed
- ...
```

Update the version link at the bottom of the file.

### 2. Update package.json version

```bash
bun -e "
  const pkg = await Bun.file('package.json').json();
  pkg.version = '0.2.0';
  await Bun.write('package.json', JSON.stringify(pkg, null, 2) + '\n');
"
```

### 3. Verify the build

```bash
bun run clean
bun run build
bun run typecheck
bun test
```

### 4. Commit and tag

```bash
git add -A
git commit -m "release: v0.2.0"
git tag v0.2.0
git push origin main --tags
```

### 5. Create GitHub Release

Create a release on GitHub from the tag. The `publish.yml` workflow will automatically build and publish to npm.

## Prerelease Versions

For prerelease versions (alpha, beta, rc):

```bash
# Tag as v0.2.0-beta.1
# The publish workflow will detect the prerelease suffix and publish to the `next` dist-tag
```

Install prerelease versions with:

```bash
npm install @weaveio/opencode_attest@next
```

## CI/CD

- **ci.yml**: Runs on every push/PR to main — typecheck, tests, audit
- **publish.yml**: Runs on GitHub release or manual dispatch — build, verify, publish to npm
- **codeql.yml**: Weekly security scanning + on push/PR to main
