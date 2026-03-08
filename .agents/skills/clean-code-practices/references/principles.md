# JavaScript Clean Code — Detailed Principles Reference

## Contents
- [1. Meaningful Names](#1-meaningful-names)
- [2. Magic Numbers and Magic Values](#2-magic-numbers-and-magic-values)
- [3. Functions and Command-Query Separation](#3-functions-and-command-query-separation)
- [4. DRY — Don't Repeat Yourself](#4-dry--dont-repeat-yourself)
- [5. Guard Clauses — Fail Fast, Return Early](#5-guard-clauses--fail-fast-return-early)
- [6. Side Effects and Output Arguments](#6-side-effects-and-output-arguments)
- [7. Comments](#7-comments)
- [8. Formatting](#8-formatting)
- [9. Classes and SOLID](#9-classes-and-solid)
- [10. Law of Demeter — Don't Talk to Strangers](#10-law-of-demeter--dont-talk-to-strangers)
- [11. Primitive Obsession — Value Objects over Raw Primitives](#11-primitive-obsession--value-objects-over-raw-primitives)
- [12. Error Handling](#12-error-handling)
- [13. Tests — F.I.R.S.T. Principles](#13-tests--first-principles)
- [14. The Boy Scout Rule](#14-the-boy-scout-rule)

---

## 1. Meaningful Names

### Use Intention-Revealing Names
Names should answer WHY something exists, WHAT it does, and HOW it is used.

```js
// Bad
const d = 86400;
function calc(x, y) { return x * y; }

// Good
const SECONDS_IN_A_DAY = 86_400;

/**
 * @param {number} unitPrice
 * @param {number} quantity
 * @returns {number}
 */
function calculateTotalPrice(unitPrice, quantity) {
  return unitPrice * quantity;
}
```

### Avoid Disinformation and Encodings
```js
// Bad
const accountList = { alice: 100 };   // it's an object, not a list
const strCustomerName = "Alice";       // Hungarian notation
const customerNameString = "Alice";    // noise word

// Good
const accounts = { alice: 100 };
const customerName = "Alice";
```

### Use Pronounceable and Searchable Names
```js
// Bad
const yyyymmdd = new Date();
const n = 5; // magic number

// Good
const currentDate = new Date();
const MAX_RETRIES = 5;
```

### Expand Abbreviations — Unless Universally Known
An abbreviation forces the reader to perform a mental lookup. Expand unless the full form would surprise a reader more than the abbreviation.

| Abbreviation | Decision | Reason |
|---|---|---|
| `url`, `id`, `http`, `api` | Keep | Universal, full form rarely used |
| `fps` (frames per second) | Keep | Standard in all media contexts |
| `crf` (Constant Rate Factor) | **Expand** | Known to FFmpeg specialists only |
| `pixFmt` (pixel format) | **Expand** | Lazy contraction, not a real term |
| `cfg`, `ctx`, `mgr`, `req`, `resp` | **Expand** | Save nothing, cost clarity |
| `h`, `m`, `s` in a 3-line time function | Keep locally | Conventional, scope is tiny |

```js
// Bad — caller must know FFmpeg internals to understand parameters
function createVideo(codec, crf, pixFmt) { /* ... */ }

createVideo("libx264", 18, "yuv420p");
// ↑ What is 18? What is "yuv420p"? Only an FFmpeg user knows.

// Good — self-documenting at every call site
function createVideo({ codec, constantRateFactor, pixelFormat }) { /* ... */ }

createVideo({ codec: "libx264", constantRateFactor: 18, pixelFormat: "yuv420p" });
// ↑ A new reader understands intent without consulting documentation.
```

### Avoid Mental Mapping
Single-letter names force readers to keep a mental translation table in their head.

```js
// Bad — what is r? what is t?
let t = 0;
for (const r of results) { t += r.val; }

// Good
let total = 0;
for (const result of results) { total += result.value; }
```

### Pick One Word per Concept
Choose a single verb for each operation type and use it everywhere in the codebase.

```js
// Bad — fetch / retrieve / get / load used interchangeably
function fetchUser(userId) { /* ... */ }
function retrieveOrder(orderId) { /* ... */ }
function loadInvoice(invoiceId) { /* ... */ }

// Good — consistent vocabulary
function getUser(userId) { /* ... */ }
function getOrder(orderId) { /* ... */ }
function getInvoice(invoiceId) { /* ... */ }
```

### Name Classes as Nouns, Functions as Verbs
```js
// Bad
class ProcessData { /* ... */ }
function data(user) { /* ... */ }

// Good
class DataProcessor { /* ... */ }
function fetchUserProfile(userId) { /* ... */ }
```

---

## 2. Magic Numbers and Magic Values

A **magic number** (or magic value) is any bare literal — numeric, string, boolean — whose meaning is not obvious from context.

### Replace Every Bare Literal with a Named Constant
```js
// Bad — what does 86400 mean? what is 3? what is "admin"?
if (elapsed > 86400) { /* ... */ }
if (retries > 3) { /* ... */ }
if (user.role === "admin") { /* ... */ }

// Good
const SECONDS_IN_A_DAY = 86_400;
const MAX_RETRIES = 3;
const ADMIN_ROLE = "admin";

if (elapsed > SECONDS_IN_A_DAY) { /* ... */ }
if (retries > MAX_RETRIES) { /* ... */ }
if (user.role === ADMIN_ROLE) { /* ... */ }
```

### Constant vs Frozen Enum — Decision Guide

| Situation | Use |
|-----------|-----|
| Single standalone config value (`MAX_RETRIES`, `TIMEOUT_MS`) | **`const`** |
| Set of related named codes / labels / options | **`Object.freeze({})`** or TS `enum` |
| Two or more constants sharing a common prefix (`STATUS_*`, `PRESET_*`) | **`Object.freeze({})`** or TS `enum` |
| Value needs iteration or exhaustive matching | **`Object.freeze({})`** or TS `enum` |
| TypeScript project that needs type narrowing | **TS `enum`** or string literal union |

### Use Frozen Objects for Closed Sets of Related Values
```js
// Bad — three independent constants that are really one concept
const RENDER_STATUS_QUEUED = "queued";
const RENDER_STATUS_DONE   = "done";
const RENDER_STATUS_ERROR  = "error";

function updateRender(renderId, status) {
  if (status === RENDER_STATUS_DONE) { /* typo-prone */ }
}

// Good — closed set, immutable, IDE-autocompleted
const RenderStatus = Object.freeze({
  QUEUED: "queued",
  DONE:   "done",
  ERROR:  "error",
});

function updateRender(renderId, status) {
  if (status === RenderStatus.DONE) { /* ... */ }
}
```

### TypeScript Enums (for TS projects)
```ts
// TypeScript enum provides compile-time exhaustiveness checking
enum VideoPreset {
  FAST   = "fast",
  MEDIUM = "medium",
  SLOW   = "slow",
}

interface EncodeRequest {
  preset: VideoPreset;
}

// Exhaustive switch — TS will error if a case is missing
function describe(preset: VideoPreset): string {
  switch (preset) {
    case VideoPreset.FAST:   return "Quick encode, lower quality";
    case VideoPreset.MEDIUM: return "Balanced";
    case VideoPreset.SLOW:   return "Best quality";
  }
}
```

### Common Exceptions — Zero and One Are Usually Fine
```js
// These are self-evident and do not need a constant
items[0];              // first element
Array.from({ length: items.length }, (_, i) => i); // standard iteration
if (count === 0) { }  // emptiness check
```

---

## 3. Functions and Command-Query Separation

### Do One Thing (Single Responsibility)
```js
// Bad — does too much
function processUser(userData) {
  userData.name = userData.name.trim();
  db.save(userData);
  emailService.sendWelcome(userData.email);
  console.log(`User ${userData.name} created`);
}

// Good — each function has one job
function normalizeUser(userData) {
  return { ...userData, name: userData.name.trim() };
}

function registerUser(userData) {
  const clean = normalizeUser(userData);
  db.save(clean);
  sendWelcomeEmail(clean.email);
}

function sendWelcomeEmail(email) {
  emailService.sendWelcome(email);
}
```

### Keep Functions Small
A function should rarely exceed 20 lines. If you need to scroll, it is too long.

### Limit Arguments (Ideal: 0–2; use options object beyond that)
```js
// Bad
function createUser(firstName, lastName, email, age, role, isActive) { /* ... */ }

// Good — destructure an options object
function createUser({ firstName, lastName, email, age, role, isActive = true }) { /* ... */ }

// Call site is self-documenting
createUser({ firstName: "Alice", lastName: "Smith", email: "alice@example.com", age: 30, role: "editor" });
```

### Avoid Flag Arguments
```js
// Bad — flag argument signals the function does two things
function render(text, isHtml) {
  return isHtml ? `<p>${text}</p>` : text;
}

// Good
function renderAsHtml(text) { return `<p>${text}</p>`; }
function renderAsPlainText(text) { return text; }
```

### Command-Query Separation
Functions should either DO something or RETURN something — not both.

```js
// Bad
function saveAndGetId(user) {
  db.save(user);
  return db.lastInsertId();
}

// Good
function saveUser(user) { db.save(user); }
function getLastUserId() { return db.lastInsertId(); }
```

### Prefer Errors Over Null / Return Codes
```js
// Bad
function findUser(userId) {
  const user = db.find(userId);
  if (!user) return null;  // caller must always null-check
  return user;
}

// Good
class UserNotFoundError extends Error {
  constructor(userId) {
    super(`No user found with id: ${userId}`);
    this.name = "UserNotFoundError";
  }
}

function findUser(userId) {
  const user = db.find(userId);
  if (!user) throw new UserNotFoundError(userId);
  return user;
}
```

---

## 4. DRY — Don't Repeat Yourself

Every piece of knowledge must have a **single, authoritative representation** in the system.

### Extract Duplicated Logic into a Shared Function
```js
// Bad — validation logic copied in multiple places
function createUser(email) {
  if (!email.includes("@") || !email.includes(".")) throw new Error("Invalid email");
  db.insert("users", { email });
}

function updateEmail(userId, email) {
  if (!email.includes("@") || !email.includes(".")) throw new Error("Invalid email");
  db.update("users", userId, { email });
}

// Good — one authoritative validation function
function validateEmail(email) {
  if (!email.includes("@") || !email.includes(".")) {
    throw new Error(`Invalid email address: ${email}`);
  }
}

function createUser(email) {
  validateEmail(email);
  db.insert("users", { email });
}

function updateEmail(userId, email) {
  validateEmail(email);
  db.update("users", userId, { email });
}
```

### DRY in Data — Use a Single Source of Truth
```js
// Bad — required field list maintained separately from the schema
const REQUIRED_FIELDS = ["name", "email", "role"];

class User {
  constructor({ name, email, role }) {
    this.name = name;
    this.email = email;
    this.role = role;
  }
}

function validate(data) {
  for (const field of REQUIRED_FIELDS) {  // breaks the moment User changes
    if (!(field in data)) throw new Error(`Missing: ${field}`);
  }
}

// Good — derive required fields from the schema itself
const USER_SCHEMA = { name: "", email: "", role: "" };

function validate(data) {
  for (const field of Object.keys(USER_SCHEMA)) {
    if (!(field in data)) throw new Error(`Missing: ${field}`);
  }
}
```

---

## 5. Guard Clauses — Fail Fast, Return Early

Deeply nested `if` blocks (the "arrow anti-pattern") are hard to read. Guard clauses invert the condition and return/throw early.

### Replace Nested Ifs with Guard Clauses
```js
// Bad — pyramid of doom, happy path buried at the bottom
function processOrder(order) {
  if (order !== null) {
    if (order.isPaid) {
      if (order.items.length > 0) {
        if (inventory.hasStock(order.items)) {
          return fulfil(order);
        }
      }
    }
  }
}

// Good — each guard eliminates invalid state immediately
function processOrder(order) {
  if (!order) throw new Error("Order cannot be null");
  if (!order.isPaid) throw new OrderNotPaidError(order.id);
  if (!order.items.length) throw new EmptyOrderError(order.id);
  if (!inventory.hasStock(order.items)) throw new InsufficientStockError(order.items);

  return fulfil(order);
}
```

### Guard Clauses in Loops
```js
// Bad — main logic wrapped in a condition
for (const user of users) {
  if (user.isActive) {
    if (user.hasPermission("export")) {
      exportUser(user);
    }
  }
}

// Good — skip early, keep the body flat
for (const user of users) {
  if (!user.isActive) continue;
  if (!user.hasPermission("export")) continue;
  exportUser(user);
}
```

---

## 6. Side Effects and Output Arguments

### No Hidden Side Effects
A function's name is its contract. If it says "get", it should only read.

```js
// Bad — name implies a pure read, but it mutates state
function getNextId(counter) {
  counter.value += 1;      // hidden side effect
  return counter.value;
}

// Good — separate query from command
function currentId(counter) { return counter.value; }
function incrementCounter(counter) { counter.value += 1; }
```

### Avoid Output Arguments — Return New Values
Passing an object in order to modify it forces the caller to track invisible mutations.

```js
// Bad — caller cannot tell the object will be modified
function enrichUser(user) {
  user.fullName = `${user.first} ${user.last}`;
}

// Good — pure function returns a new value; original is untouched
function enrichUser(user) {
  return { ...user, fullName: `${user.first} ${user.last}` };
}
```

---

## 7. Comments

### Don't Comment Bad Code — Rewrite It
```js
// Bad
// Check if employee is eligible for benefits
if (employee.age > 65 && employee.tenure > 2 && !employee.partTime) { /* ... */ }

// Good
if (employee.isEligibleForBenefits()) { /* ... */ }
```

### Acceptable Comments
```js
// Legal / licensing header
// Copyright (c) 2024 Acme Corp. All rights reserved.

// Explaining WHY, not WHAT
// MD5 is used here for legacy compatibility only — not for security.
const checksum = md5(data);

// TODO notes (use sparingly)
// TODO: Replace with async implementation once the service supports it.

// Public API JSDoc
/**
 * Calculate compound interest.
 *
 * @param {number} principal - Initial investment amount in dollars.
 * @param {number} rate      - Annual interest rate as a decimal (e.g., 0.05 for 5%).
 * @param {number} years     - Investment duration in years.
 * @returns {number} Total value after compound interest is applied.
 */
function calculateInterest(principal, rate, years) {
  return principal * (1 + rate) ** years;
}
```

### Never Do This
```js
// Bad: Redundant comment
// Set i to 0
let i = 0;

// Bad: Commented-out code — just delete it, git has history
// const oldPrice = item.basePrice * 1.1;
const price = item.basePrice * 1.2;

// Bad: Misleading comment
// Returns user age
function getUserName(userId) { /* ... */ }
```

---

## 8. Formatting

### Vertical Ordering — High Level First
Place callers above callees. Readers should be able to read top-to-bottom.

```js
// Good — high-level orchestration at the top
function processOrder(orderId) {
  const order = fetchOrder(orderId);
  validateOrder(order);
  chargeCustomer(order);
  sendConfirmation(order);
}

function fetchOrder(orderId) { /* ... */ }
function validateOrder(order) { /* ... */ }
function chargeCustomer(order) { /* ... */ }
function sendConfirmation(order) { /* ... */ }
```

### Vertical Density — Related Code Stays Together
```js
// Bad — unnecessary blank lines break flow
class Order {

  orderId;

  customerId;

}

// Good
class Order {
  orderId;
  customerId;
  total;
}
```

### Line Length
Keep lines under 100 characters. Most team style guides (ESLint, Prettier) enforce 80–120; 100 is a practical modern limit.

---

## 9. Classes and SOLID

### Single Responsibility Principle (SRP)
```js
// Bad — class knows too much
class UserManager {
  saveUser(user) { /* ... */ }
  sendEmail(user) { /* ... */ }
  generateReport(user) { /* ... */ }
}

// Good — separate concerns
class UserRepository {
  save(user) { /* ... */ }
}

class EmailService {
  sendWelcome(user) { /* ... */ }
}

class UserReportGenerator {
  generate(user) { /* ... */ }
}
```

### Prefer Composition Over Inheritance
```js
// Bad — deep inheritance hierarchy
class Animal { /* ... */ }
class Mammal extends Animal { /* ... */ }
class Dog extends Mammal { /* ... */ }

// Good — compose behaviours
class Dog {
  constructor(breed, trainer) {
    this.breed = breed;
    this._trainer = trainer;
  }
  performTrick(trick) {
    this._trainer.execute(trick);
  }
}
```

### Open/Closed Principle
```js
// Bad — must modify class to add new discount type
class PriceCalculator {
  calculate(price, discountType) {
    if (discountType === "student") return price * 0.9;
    if (discountType === "senior")  return price * 0.8;
  }
}

// Good — extend via strategy objects, never modify existing
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

### Liskov Substitution Principle (LSP)
Subclasses must be fully substitutable for their parent — they must honour the parent's invariants.

```js
// Bad — Square breaks Rectangle's invariant (setting width also changes height)
class Rectangle {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }
  area() { return this.width * this.height; }
}

class Square extends Rectangle { // LSP violation
  setWidth(w) { this.width = this.height = w; } // surprises callers of Rectangle
}

// Good — use a shared abstraction, not inheritance
class Shape {
  area() { throw new Error("Not implemented"); }
}

class Rectangle extends Shape {
  constructor(width, height) { super(); this.width = width; this.height = height; }
  area() { return this.width * this.height; }
}

class Square extends Shape {
  constructor(side) { super(); this.side = side; }
  area() { return this.side ** 2; }
}
```

### Interface Segregation Principle (ISP)
No client should be forced to depend on methods it does not use.

```js
// Bad — Robot is forced to stub eat() which makes no sense for it
class Worker {
  work() { throw new Error("Not implemented"); }
  eat()  { throw new Error("Not implemented"); }  // robots cannot eat
}

class RobotWorker extends Worker {
  work() { /* ... */ }
  eat()  { /* forced stub — ISP violation */ }
}

// Good — split into small, focused "interfaces" (duck typing / TS interfaces)
class RobotWorker {
  work() { /* only implements what it needs */ }
}

class HumanWorker {
  work() { /* ... */ }
  eat()  { /* ... */ }
}
```

### Dependency Inversion Principle (DIP)
High-level modules should not depend on low-level modules. Inject dependencies; never instantiate them inside a class.

```js
// Bad — OrderService is hard-coupled to a specific database implementation
class OrderService {
  constructor() {
    this._repo = new PostgresOrderRepository(); // hard-coded, untestable
  }
  getOrder(orderId) { return this._repo.find(orderId); }
}

// Good — depend on an abstraction; inject the implementation
class OrderService {
  constructor(repo) {        // any object with .find() and .save() works
    this._repo = repo;
  }
  getOrder(orderId) { return this._repo.find(orderId); }
}

// In production
const service = new OrderService(new PostgresOrderRepository());

// In tests
const service = new OrderService(new FakeOrderRepository());
```

---

## 10. Law of Demeter — Don't Talk to Strangers

A method should only call methods on:
1. `this`
2. Objects passed as arguments
3. Objects it creates locally
4. Direct component/property objects

Reaching through the object graph (`a.b.c.method()`) creates tight coupling.

```js
// Bad — OrderService knows about Customer's internal structure
class OrderService {
  getCity(order) {
    return order.customer.address.city; // reaches through two levels
  }
}

// Good — each object provides a method that hides its internal structure
class Address {
  constructor(street, city) { this.street = street; this.city = city; }
}

class Customer {
  constructor(name, address) { this.name = name; this.address = address; }
  city() { return this.address.city; }  // hides internal Address
}

class Order {
  constructor(customer) { this.customer = customer; }
  customerCity() { return this.customer.city(); }  // hides internal Customer
}

class OrderService {
  getCity(order) {
    return order.customerCity();  // talks only to its direct collaborator
  }
}
```

---

## 11. Primitive Obsession — Value Objects over Raw Primitives

Using raw strings, numbers, and booleans for domain concepts loses type safety and duplicates validation logic everywhere.

```js
// Bad — raw primitives with no validation or meaning
function transfer(amount, fromAccount, toAccount) {
  if (amount < 0)              throw new Error("Negative amount");
  if (fromAccount.length !== 10) throw new Error("Invalid account number");
  // ...
}

// Good — each domain concept is its own type, validation is co-located
class Money {
  constructor(amount, currency) {
    if (amount < 0)    throw new Error(`Amount cannot be negative: ${amount}`);
    if (!currency)     throw new Error("Currency cannot be empty");
    this.amount   = amount;
    this.currency = currency;
    Object.freeze(this);
  }
}

class AccountNumber {
  constructor(value) {
    if (!/^\d{10}$/.test(value)) throw new Error(`Invalid account number: ${value}`);
    this.value = value;
    Object.freeze(this);
  }
}

function transfer(amount, fromAccount, toAccount) {
  // validation is already guaranteed by the types
}

transfer(new Money(100, "USD"), new AccountNumber("1234567890"), new AccountNumber("0987654321"));
```

---

## 12. Error Handling

### Use Specific Errors
```js
// Bad
try {
  process(data);
} catch (e) {
  // swallowing errors silently
}

// Good
try {
  process(data);
} catch (e) {
  if (e instanceof ValidationError) {
    logger.error("Invalid data format:", e);
    throw e;
  }
  if (e instanceof ConnectionError) {
    logger.error("Database unreachable:", e);
    throw new ServiceUnavailableError("Temporary outage", { cause: e });
  }
  throw e; // re-throw unexpected errors
}
```

### Custom Error Classes
```js
class AppError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

class UserNotFoundError extends AppError {}
class OrderNotPaidError extends AppError {}
class InsufficientStockError extends AppError {}
```

### Do Not Return null — Throw or Use a Null Object
```js
// Bad — caller must always null-check
function findConfig(key) {
  return configs[key]; // returns undefined on miss
}

// Good — throw or supply a safe default
function findConfig(key) {
  const config = configs[key];
  if (!config) throw new Error(`Configuration key '${key}' not found`);
  return config;
}
```

---

## 13. Tests — F.I.R.S.T. Principles

| Principle | Meaning |
|-----------|---------|
| **Fast** | Tests run in milliseconds |
| **Independent** | No test depends on another |
| **Repeatable** | Same result every run |
| **Self-Validating** | Pass or fail — no manual check |
| **Timely** | Written alongside or before production code |

### One Concept Per Test
```js
// Bad — testing too many things
test("user", () => {
  const user = new User("Alice", "alice@example.com");
  expect(user.name).toBe("Alice");
  expect(user.email).toBe("alice@example.com");
  user.deactivate();
  expect(user.isActive).toBe(false);
  user.activate();
  expect(user.isActive).toBe(true);
});

// Good — focused tests with clear names
test("user has correct name on creation", () => {
  const user = new User("Alice", "alice@example.com");
  expect(user.name).toBe("Alice");
});

test("user is active by default", () => {
  const user = new User("Alice", "alice@example.com");
  expect(user.isActive).toBe(true);
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

### Arrange-Act-Assert (AAA)
```js
test("calculateTotalPrice applies quantity correctly", () => {
  // Arrange
  const unitPrice = 10;
  const quantity  = 3;

  // Act
  const total = calculateTotalPrice(unitPrice, quantity);

  // Assert
  expect(total).toBe(30);
});
```

---

## 14. The Boy Scout Rule

Always leave the code cleaner than you found it.

Before every commit, improve something — a name, a bloated function, a missing test, a stale comment. Small, continuous improvements prevent code rot.
