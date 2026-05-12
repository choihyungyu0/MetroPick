# Codex Instructions

- Always inspect existing files before editing.
- Prefer small, reviewable changes.
- Keep user-facing UI copy in Korean.
- Keep code, filenames, comments, README content, and developer documentation in English unless Korean UI copy is required.
- Use strict TypeScript and avoid `any`.
- Do not hardcode secrets.
- Do not invent real prediction results or claim real model accuracy.
- Use mock data only until real public data APIs are connected.
- Keep recommendation logic deterministic and easy to review unless a production model is explicitly introduced later.
- After changes, run `npm run validate`.
- If validation fails, fix the issue before finishing.
- Summarize changed files and remaining risks at the end.
