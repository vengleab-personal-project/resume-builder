---
name: enforcing-clean-code
description: "Enforces Uncle Bob's Clean Code principles in JavaScript/TypeScript — naming, functions, DRY, guard clauses, SOLID, error handling, and tests. Use when writing new JS/TS code, reviewing or critiquing existing code, refactoring messy modules, or establishing coding standards. Activates whenever JS/TS quality, structure, or maintainability is in scope — even if the user does not say 'clean code' explicitly."
---

# JavaScript Clean Code

Apply Uncle Bob's Clean Code principles to JavaScript/TypeScript — producing code that is readable, maintainable, and professionally structured.

---

## Core Workflow

1. **Identify the task type** — write new / review existing / refactor
2. **Apply the relevant principles** from the sections below
3. **Always show before/after** when refactoring existing code
4. **Explain the why** — briefly name which principle each change applies
5. **Load `references/principles.md`** when deeper examples are needed (see below)

---

## When to Load `references/principles.md`

Load the reference file when any of these are true:

- The user asks *why* something is wrong or wants a detailed explanation
- The review has more than 3 issues to address
- The task involves refactoring a class (needs OCP/SRP/LSP/ISP/DIP full examples)
- The user seems unfamiliar with Clean Code and needs concepts explained
- The user asks about a specific pillar by name: naming, magic values, functions, DRY, guard clauses, comments, formatting, classes, SOLID, Law of Demeter, error handling, or tests

For quick fixes or single-issue reviews, the patterns in this file are sufficient.

---

## The Core Pillars (Quick Reference)

| Pillar | Rule of Thumb |
|--------|---------------|
| **Names** | Intention-revealing, pronounceable, no encodings, one word per concept |
| **Magic Values** | No bare literals — every number/string constant gets a name |
| **Enums** | Closed sets → `Object.freeze({})` or TS `enum`; standalone values → `const` |
| **Functions** | Do one thing, ≤20 lines, ≤2 params ideal, no side effects |
| **DRY** | Every piece of knowledge has one authoritative representation |
| **Guard Clauses** | Fail/return early to eliminate nested `if` pyramids |
| **Comments** | Write *why*, not *what* — code should speak |
| **Formatting** | High-level first, related code together, ≤100 chars/line |
| **Classes** | SRP, high cohesion, composition > inheritance |
| **SOLID** | SRP · OCP · LSP · ISP · DIP — each class has one job and stable contracts |
| **Law of Demeter** | Talk to direct collaborators only — avoid `a.b.c.do()` chains |
| **Error Handling** | Specific errors, never swallow, avoid returning `null`/`undefined` |
| **Tests** | F.I.R.S.T., one concept/test, AAA pattern |
| **Boy Scout Rule** | Leave every file cleaner than you found it |

---

## Decision Guide by Task

### Writing New Code
- Start with intention-revealing names before any logic
- Design functions to do exactly **one thing**
- Prefer **objects / interfaces** over long parameter lists (> 2 params)
- Use **JSDoc** or **TypeScript types** on all public functions
- Add comments only to explain *why*, never *what*

### Reviewing Existing Code — Check in this order
1. Are names clear without needing a comment to explain them?
   - Do any identifiers use abbreviations a reader might not know? → expand them
2. Are there bare magic numbers or magic strings? → replace with named constants
   - Is it a **closed set** of related values? → use `Object.freeze` or TS `enum`
   - Is it a **standalone** value? → use a `const`
3. Does each function have a single, clear purpose and no hidden side effects?
4. Are there any flag arguments (e.g. `process(data, true)`)? → split into two functions
5. Are there any output arguments (function mutates its input)? → return a new value
6. Is there duplicated logic anywhere (DRY violation)? → extract a shared function
7. Are there deeply nested `if` blocks? → apply guard clauses (early return)
8. Does any call chain go `a.b.c.do()`? → Law of Demeter violation, add a method
9. Are errors specific and properly handled (not swallowed with empty `catch`)?
10. Does each class have one reason to change (SRP)?
11. Do subclasses honour their parent's contract (LSP)?

### Refactoring
- Extract functions when a function exceeds ~20 lines
- Replace magic numbers/strings with named constants
- Replace `if/else if` chains with strategy pattern or dispatch object
- Replace `null` returns with thrown errors or Null Objects
- Replace flag args with separate named functions
- Extract duplicated blocks into a shared helper (DRY)
- Invert nested conditions into guard clauses (early return/throw)
- Replace primitive clusters with a small value object or plain object type
- Replace groups of related `CONSTANT_A / CONSTANT_B / CONSTANT_C` with a frozen enum object

---

## Key Patterns

### Naming
```js
// Bad
const d = 86400;
function calc(x, y) { return x * y; }

// Good
const SECONDS_IN_A_DAY = 86_400;

/** @param {number} unitPrice @param {number} quantity @returns {number} */
function calculateTotalPrice(unitPrice, quantity) {
  return unitPrice * quantity;
}
```

### Single-Purpose Functions
```js
// Bad — does three things
function processUser(data) {
  data.name = data.name.trim();
  db.save(data);
  emailService.sendWelcome(data.email);
}

// Good
function normalizeUser(data) {
  return { ...data, name: data.name.trim() };
}

function registerUser(data) {
  const clean = normalizeUser(data);
  db.save(clean);
  sendWelcomeEmail(clean.email);
}

function sendWelcomeEmail(email) {
  emailService.sendWelcome(email);
}
```

### Options Object over Long Parameter Lists
```js
// Bad
function createUser(firstName, lastName, email, age, role, isActive) { /* ... */ }

// Good
function createUser({ firstName, lastName, email, age, role, isActive = true }) { /* ... */ }
```

### Errors over null / undefined
```js
// Bad
function findUser(userId) {
  return db.find(userId); // returns null on miss
}

// Good
function findUser(userId) {
  const user = db.find(userId);
  if (!user) throw new UserNotFoundError(`No user with id: ${userId}`);
  return user;
}
```

### No Flag Arguments
```js
// Bad
function render(text, isHtml) {
  return isHtml ? `<p>${text}</p>` : text;
}

// Good
function renderAsHtml(text) { return `<p>${text}</p>`; }
function renderAsPlainText(text) { return text; }
```

### Magic Values → Named Constants / Frozen Enums
```js
// Bad
if (seconds > 86400) {
  tier = score >= 3 ? "A" : "B";
}

// Good — standalone values: const; closed set: Object.freeze
const SECONDS_IN_A_DAY = 86_400;
const MIN_SCORE_FOR_TIER_A = 3;
const Tier = Object.freeze({ A: "A", B: "B" });

if (seconds > SECONDS_IN_A_DAY) {
  tier = score >= MIN_SCORE_FOR_TIER_A ? Tier.A : Tier.B;
}
```

### Guard Clauses — Early Return / Fail Fast
```js
// Bad — arrow anti-pattern
function processOrder(order) {
  if (order) {
    if (order.isPaid) {
      if (order.items.length) {
        order.items.forEach(ship);
      }
    }
  }
}

// Good
function processOrder(order) {
  if (!order) throw new Error("Order cannot be null");
  if (!order.isPaid) throw new OrderNotPaidError(order.id);
  if (!order.items.length) return;
  order.items.forEach(ship);
}
```

### Open/Closed Principle
```js
// Bad — must modify to add new discount types
function calculate(price, discountType) {
  if (discountType === "student") return price * 0.9;
  if (discountType === "senior") return price * 0.8;
}

// Good — extend by adding a new strategy, never modify existing
class PriceCalculator {
  constructor(discountStrategy) {
    this._discount = discountStrategy;
  }
  calculate(price) {
    return this._discount.apply(price);
  }
}

const studentDiscount = { apply: (price) => price * 0.9 };
const seniorDiscount  = { apply: (price) => price * 0.8 };
```

### Clean Tests — AAA + One Concept
```js
// Bad — tests too many things at once
test("user", () => {
  const user = new User("Alice", "alice@example.com");
  expect(user.name).toBe("Alice");
  user.deactivate();
  expect(user.isActive).toBe(false);
});

// Good
test("user has correct name on creation", () => {
  const user = new User("Alice", "alice@example.com");
  expect(user.name).toBe("Alice");
});

test("deactivated user is not active", () => {
  // Arrange
  const user = new User("Alice", "alice@example.com");
  // Act
  user.deactivate();
  // Assert
  expect(user.isActive).toBe(false);
});
```

---

## Output Format

**Writing code:** produce clean, typed, documented JavaScript/TypeScript directly.

**Reviewing code**, use this structure:
```
### Issues Found
- [NAMES]   `d` → rename to `elapsedDays`
- [SRP]     `processUser` does 3 things → extract `normalizeUser`, `sendWelcomeEmail`
- [ERRORS]  returns `null` on miss → throw `UserNotFoundError`
- [FLAGS]   `process(data, true)` → split into `process()` and `dryRunProcess()`

### Refactored Code
[full rewritten code block]

### Why These Changes
[1-liner per principle applied]
```

---

## Hard Limits — Never Violate

- ❌ Never use bare magic numbers or magic strings — every literal gets a named constant
- ❌ Never use a group of related `CONSTANT_A / CONSTANT_B / CONSTANT_C` — use `Object.freeze` or TS `enum`
- ❌ Never use single-letter variable names outside arrow function bodies / short loops
- ❌ Never duplicate logic — extract a shared function (DRY)
- ❌ Never nest more than 2 levels of `if` — apply guard clauses instead
- ❌ Never chain through `a.b.c.method()` — Law of Demeter violation
- ❌ Never leave commented-out code — delete it, git has history
- ❌ Never swallow exceptions with empty `catch (e) {}`
- ❌ Never use flag arguments like `process(data, isDryRun)`
- ❌ Never return `null`/`undefined` to signal "not found" — throw a specific error
- ❌ Never write functions longer than ~20 lines without a documented reason
- ❌ Never put more than 2 positional parameters on a function — use an options object
- ❌ Never add comments that re-state what the code does — explain *why*
- ❌ Never hard-code a dependency inside a class — inject it (DIP)
- ❌ Never let a subclass break the parent's contract (LSP)

---

## Advanced Reference

For detailed explanations and extended examples of every pillar, see [references/principles.md](references/principles.md).