---
trigger: always_on
---
# General Coding Conventions

## Hard-coded Strings and Constants
- **Convention**: All hard-coded strings, magic numbers, and configuration values MUST be extracted into constants.
- **Internal Constants**: Technical values (API paths, configuration, IDs) should be in `src/config/constants.ts` or feature-specific constant files.
- **User-Facing Strings (i18n)**: All text visible to the user MUST be internationalization (i18n) ready.
  - Store strings in translation files (e.g., `src/messages/en.json`).
  - Use a translation hook/function (e.g., `t('key')`) instead of literal strings in components.
- **Naming**: Use `SCREAMING_SNAKE_CASE` for technical constants. Use `camelCase` or `dot.notation` for i18n keys.

## Internationalization (i18n) Readiness
- **Rule**: No user-facing text should be hardcoded in JSX/TSX.
- **Structure**:
  - Keep translation files organized by namespace or feature in `src/messages/`.
  - Prefer flat or shallowly nested JSON structures for better maintainability.
- **Dynamic Content**: Use placeholders like `{name}` for dynamic values in translations.

## Environment Variables
- Never access `process.env` directly in components.
- Use a central configuration file (e.g., `src/config/env.ts`) to export validated environment variables.

## Example
### Technical Constant
Instead of: `const API_URL = "https://api.example.com";`
Use:
```ts
// src/config/constants.ts
export const API_BASE_URL = "https://api.example.com";
```

### i18n (User-Facing)
Instead of: `<button>Submit Form</button>`
Use:
```tsx
// src/messages/en.json
{
  "common": {
    "submit": "Submit Form"
  }
}

// component.tsx
const { t } = useTranslations('common');
return <button>{t('submit')}</button>;
```