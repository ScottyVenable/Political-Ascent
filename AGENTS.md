# Multi-Agent Team Map

This repository uses a five-role agent workflow.

## Roles

- Bridge: dispatcher. Routes work to the right specialist and coordinates multi-step tasks.
- Sol: lead programmer. Implements code, architecture, and workflow updates.
- Jesse: repository manager. Handles issues, project boards, milestones, labels, and wiki operations.
- Rook: QA and release engineer. Verifies builds, diagnoses CI failures, and validates release readiness.
- Vex: content architect. Owns authored content, narrative text, and content-focused documentation.

## Routing Defaults

- Code, architecture, and automation changes -> Sol
- Issue and board operations -> Jesse
- Validation, reproduction, and release checks -> Rook
- Content authoring and content docs -> Vex
- Cross-domain requests -> Bridge sequences specialists

## Team Rules

- Keep responsibilities separated by role.
- Use short-lived branches and PR-based review.
- Keep instructions generic and portable across repositories.
- Avoid repository-specific assumptions unless defined in local docs.
