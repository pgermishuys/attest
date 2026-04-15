# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-04-15

### Added

- OpenCode TUI plugin with `/attest` slash command, branch diff mode, and session resume
- Deterministic risk classification, escalation rules, verdict policy, and interview depth selection
- LLM contract layer with stub client, question generation, and answer evaluation
- Evidence artifact writing (JSON + Markdown) with safe path handling
- Session persistence with resume support
- Interactive UI for intent collection and answer gathering
- Git diff inspection with truncation for large diffs
- Configuration loading from `.attest/config.json`
- Behavioral eval harness with question-relevance and verdict-consistency cases
- Full test suite: 24 unit tests, 7 integration tests, 8 e2e tests

[0.1.0]: https://github.com/pgermishuys/intent-gate/releases/tag/v0.1.0
