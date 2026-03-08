---
name: python-clean-code
description: "Enforce Uncle Bob's Clean Code principles when writing, reviewing, or refactoring Python code. Use this skill whenever the user asks to write new Python code, review or critique existing Python, refactor messy code, establish coding standards. Activate any time Python quality, structure, or maintainability is in scope — even if the user does not explicitly say 'clean code'."
compatibility: "Python 3.10+"
---

# Python Clean Code Skill

Apply Uncle Bob's Clean Code principles to Python — producing code that is readable,
maintainable, and professionally structured.

---

## Core Workflow

1. **Identify the task type** — write new / review existing / refactor
2. **Apply the relevant principles** from the sections below
3. **Always show before/after** when refactoring existing code
4. **Explain the why** — briefly name which principle each change applies
5. **Load `references/principles.md`** when deeper examples are needed (see below)

---

## When to Load `references/principles.md`

Proactively load the reference file when any of these are true:

- The user asks *why* something is wrong or wants a detailed explanation
- The code review has more than 3 issues to address
- The task involves refactoring a class (needs OCP/SRP/LSP/ISP/DIP full examples)
- The user seems unfamiliar with Clean Code and needs concepts explained
- The user asks about a specific pillar by name: naming, magic values, functions,
  DRY, guard clauses, comments, formatting, classes, SOLID, Law of Demeter,
  error handling, or tests

For quick fixes or single-issue reviews, the patterns in this file are sufficient.

---

## The Core Pillars (Quick Reference)

| Pillar | Rule of Thumb |
|--------|---------------|
| **Names** | Intention-revealing, pronounceable, no encodings, one word per concept |
| **Magic Values** | No bare literals — every number/string constant gets a name |
| **Enums** | Closed sets of related values → `Enum`; single standalone values → constant |
| **Functions** | Do one thing, ≤20 lines, ≤2 args ideal, no side effects |
| **DRY** | Every piece of knowledge has one authoritative representation |
| **Guard Clauses** | Fail/return early to eliminate nested `if` pyramids |
| **Comments** | Write *why*, not *what* — code should speak |
| **Formatting** | High-level first, related code together, ≤100 chars/line |
| **Classes** | SRP, high cohesion, composition > inheritance |
| **SOLID** | SRP · OCP · LSP · ISP · DIP — each class has one job and stable contracts |
| **Law of Demeter** | Talk to direct collaborators only — avoid `a.b.c.do()` chains |
| **Error Handling** | Specific exceptions, never swallow, avoid returning `None` |
| **Tests** | F.I.R.S.T., one concept/test, AAA pattern |
| **Boy Scout Rule** | Leave every file cleaner than you found it |

---

## Decision Guide by Task

### Writing New Code
- Start with intention-revealing names before any logic
- Design functions to do exactly **one thing**
- Prefer **dataclasses** over long argument lists (>2 params)
- Use **type hints** on all public functions
- Add docstrings only on public API methods

### Reviewing Existing Code — Check in this order
1. Are names clear without needing a comment to explain them?
   - Do any identifiers use abbreviations a reader might not know? → expand them (`crf` → `constant_rate_factor`, `pix_fmt` → `pixel_format`)
2. Are there bare magic numbers or magic strings? → replace with named constants
   - Is it a **closed set** of related values (statuses, formats, presets)? → use `Enum`
   - Is it a **standalone** value (timeout, max retries, pi)? → use a constant
3. Does each function have a single, clear purpose and no hidden side effects?
4. Are there any flag arguments (e.g. `is_html: bool`)? → split into two functions
5. Are there any output arguments (function mutates its input)? → return a new value
6. Is there duplicated logic anywhere (DRY violation)? → extract a shared function
7. Are there deeply nested `if` blocks? → apply guard clauses (early return)
8. Does any call chain go `a.b.c.do()`? → Law of Demeter violation, add a method
9. Are exceptions specific and properly handled (not swallowed)?
11. Does each class have one reason to change (SRP)?
12. Do subclasses honour their parent's contract (LSP)?

### Refactoring
- Extract methods when a function exceeds ~20 lines
- Replace magic numbers/strings with named constants
- Replace `if/elif` chains with strategy pattern or dispatch dict
- Replace `None` returns with raised exceptions or Null Objects
- Replace flag args with separate named functions
- Extract duplicated blocks into a shared helper (DRY)
- Invert nested conditions into guard clauses (early return/raise)
- Replace primitive clusters with a small value object or dataclass
- Replace groups of related `CONSTANT_A / CONSTANT_B / CONSTANT_C` with an `Enum`

---

## Key Patterns

### Naming
```python
# Bad
d = 86400
def calc(x, y):
    return x * y

# Good
SECONDS_IN_A_DAY = 86400

def calculate_total_price(unit_price: float, quantity: int) -> float:
    return unit_price * quantity
```

### Expand Abbreviations — Unless Universally Known
Abbreviations make the reader do a mental lookup. Expand them unless the term
is so universally known that the full form would be *more* surprising.

| Term | Rule | Reason |
|------|------|--------|
| `url`, `id`, `api`, `fps`, `http` | Keep | Industry-wide, reader knows immediately |
| `crf` (Constant Rate Factor) | Expand → `constant_rate_factor` | Domain-specialist knowledge only |
| `pix_fmt` (pixel format) | Expand → `pixel_format` | Lazy contraction, not a real term |
| `cfg`, `ctx`, `mgr`, `util` | Expand | Saves nothing, costs clarity |
| `h`, `m`, `s` in time math | Keep in local scope | Conventional, scope is tiny |

```python
# Bad — forces reader to know FFmpeg internals to understand the signature
def encode(codec: str, crf: int, pix_fmt: str) -> None: ...

# Good — self-documenting at every call site
def encode(codec: str, constant_rate_factor: int, pixel_format: str) -> None: ...

# The FFmpeg flag name in the command stays as-is — that's a protocol detail,
# not a Python identifier the reader needs to understand.
cmd = ["-crf", str(constant_rate_factor), "-pix_fmt", pixel_format]
```

### Single-Purpose Functions
```python
# Bad — does three things
def process_user(data: dict):
    data["name"] = data["name"].strip()
    db.save(data)
    email_service.send_welcome(data["email"])

# Good
def normalize_user(data: dict) -> dict:
    return {**data, "name": data["name"].strip()}

def register_user(data: dict) -> None:
    db.save(normalize_user(data))
    send_welcome_email(data["email"])

def send_welcome_email(email: str) -> None:
    email_service.send_welcome(email)
```

### Dataclass over Long Argument Lists
```python
# Bad
def create_user(first_name, last_name, email, age, role, is_active): ...

# Good
from dataclasses import dataclass

@dataclass
class UserData:
    first_name: str
    last_name: str
    email: str
    age: int
    role: str
    is_active: bool = True

def create_user(user: UserData) -> None: ...
```

### Exceptions over None / Error Codes
```python
# Bad
def find_user(user_id: int) -> dict | None:
    return db.find(user_id)

# Good
class UserNotFoundError(Exception):
    pass

def find_user(user_id: int) -> dict:
    user = db.find(user_id)
    if not user:
        raise UserNotFoundError(f"No user found with id: {user_id}")
    return user
```

### No Flag Arguments
```python
# Bad
def render(text: str, is_html: bool) -> str:
    if is_html:
        return f"<p>{text}</p>"
    return text

# Good
def render_as_html(text: str) -> str:
    return f"<p>{text}</p>"

def render_as_plain_text(text: str) -> str:
    return text
```

### Open/Closed Principle
```python
# Bad — must modify to add new discount types
def calculate(price: float, discount_type: str) -> float:
    if discount_type == "student":
        return price * 0.9
    elif discount_type == "senior":
        return price * 0.8

# Good — extend by adding a new class, never modify existing
from abc import ABC, abstractmethod

class DiscountStrategy(ABC):
    @abstractmethod
    def apply(self, price: float) -> float: ...

class StudentDiscount(DiscountStrategy):
    def apply(self, price: float) -> float:
        return price * 0.9

class SeniorDiscount(DiscountStrategy):
    def apply(self, price: float) -> float:
        return price * 0.8

class PriceCalculator:
    def __init__(self, discount: DiscountStrategy) -> None:
        self._discount = discount

    def calculate(self, price: float) -> float:
        return self._discount.apply(price)
```

### Magic Numbers and Magic Values
```python
# Bad — reader has no idea what 86400, 3, or "A" mean
if seconds > 86400:
    tier = "A" if score >= 3 else "B"

# Good
SECONDS_IN_A_DAY = 86_400
MIN_SCORE_FOR_TIER_A = 3
TIER_A = "A"
TIER_B = "B"

if seconds > SECONDS_IN_A_DAY:
    tier = TIER_A if score >= MIN_SCORE_FOR_TIER_A else TIER_B
```

### Enums over Constants (for Closed Sets)
Use a **constant** for a single, standalone value.
Use an **`Enum`** whenever you have two or more related named values that form a closed set.

| Situation | Correct tool |
|-----------|-------------|
| `MAX_RETRIES = 3` — one config value | Constant |
| `TIMEOUT_SECONDS = 30` — one config value | Constant |
| `STATUS_QUEUED / STATUS_DONE / STATUS_ERROR` | `Enum` |
| `PRESET_FAST / PRESET_MEDIUM / PRESET_SLOW` | `Enum` |
| `FORMAT_MP4 / FORMAT_WEBM` | `Enum` |

```python
# Bad — three related constants that are really one concept
RENDER_STATUS_QUEUED = "queued"
RENDER_STATUS_DONE   = "done"
RENDER_STATUS_ERROR  = "error"

def update_status(render_id: str, status: str) -> None: ...  # accepts any string

# Good — a closed set encoded as an Enum
from enum import Enum

class RenderStatus(str, Enum):
    QUEUED = "queued"
    DONE   = "done"
    ERROR  = "error"

def update_status(render_id: str, status: RenderStatus) -> None: ...  # type-safe
```

**Use `str, Enum` (or `int, Enum`) when the value must be serialisable as a primitive** —
e.g. passed to an HTTP API, stored in a DB column, or used as a Pydantic field.
Pydantic v2 accepts the raw string `"queued"` and coerces it to `RenderStatus.QUEUED` automatically.

```python
# Enum as a Pydantic field — accepts both "medium" and VideoPreset.MEDIUM
class VideoPreset(str, Enum):
    FAST   = "fast"
    MEDIUM = "medium"
    SLOW   = "slow"

class EncodeRequest(BaseModel):
    preset: VideoPreset = VideoPreset.MEDIUM  # validated + type-safe
```

### DRY — Don't Repeat Yourself
```python
# Bad — same validation logic duplicated
def create_user(email: str) -> None:
    if "@" not in email or "." not in email:
        raise ValueError("Invalid email")
    db.insert("users", email=email)

def update_user(user_id: int, email: str) -> None:
    if "@" not in email or "." not in email:
        raise ValueError("Invalid email")
    db.update("users", user_id, email=email)

# Good — one authoritative place
def validate_email(email: str) -> None:
    if "@" not in email or "." not in email:
        raise ValueError(f"Invalid email address: {email!r}")

def create_user(email: str) -> None:
    validate_email(email)
    db.insert("users", email=email)

def update_user(user_id: int, email: str) -> None:
    validate_email(email)
    db.update("users", user_id, email=email)
```

### Guard Clauses — Early Return / Fail Fast
```python
# Bad — arrow anti-pattern, deep nesting
def process_order(order: Order) -> None:
    if order is not None:
        if order.is_paid:
            if order.items:
                for item in order.items:
                    ship(item)

# Good — guard clauses flatten the nesting
def process_order(order: Order) -> None:
    if order is None:
        raise ValueError("Order cannot be None")
    if not order.is_paid:
        raise OrderNotPaidError(order.id)
    if not order.items:
        return

    for item in order.items:
        ship(item)
```

### Law of Demeter — Talk Only to Direct Collaborators
```python
# Bad — reaches through the object graph
class OrderService:
    def get_city(self, order: Order) -> str:
        return order.customer.address.city  # violation

# Good — add a method that hides internal structure
@dataclass
class Customer:
    address: Address

    def city(self) -> str:
        return self.address.city

class OrderService:
    def get_city(self, order: Order) -> str:
        return order.customer.city()
```

### Side Effects — Functions Should Do What They Say
```python
# Bad — name implies a read, but it mutates state
def get_user(user_id: int) -> User:
    user = db.find(user_id)
    audit_log.record(f"Fetched user {user_id}")  # hidden side effect
    user.last_accessed = datetime.now()           # hidden mutation
    return user

# Good — separate the query from the command
def find_user(user_id: int) -> User:
    return db.find(user_id)

def record_user_access(user_id: int) -> None:
    audit_log.record(f"Fetched user {user_id}")
    db.update_last_accessed(user_id)
```

### Output Arguments — Return New Values, Don't Mutate Inputs
```python
# Bad — caller can't tell the dict will be modified
def enrich_user(user: dict) -> None:
    user["full_name"] = f"{user['first']} {user['last']}"

# Good — pure function returns a new value
def enrich_user(user: dict) -> dict:
    return {**user, "full_name": f"{user['first']} {user['last']}"}
```

### Primitive Obsession — Value Objects over Raw Primitives
```python
# Bad — raw strings/floats with implicit constraints nobody enforces
def transfer(amount: float, from_account: str, to_account: str) -> None: ...

# Good — domain types make constraints explicit and self-documenting
from dataclasses import dataclass

@dataclass(frozen=True)
class Money:
    amount: float
    currency: str

    def __post_init__(self) -> None:
        if self.amount < 0:
            raise ValueError("Amount cannot be negative")

@dataclass(frozen=True)
class AccountId:
    value: str

def transfer(amount: Money, from_account: AccountId, to_account: AccountId) -> None: ...
```

### SOLID — LSP, ISP, DIP
```python
# Liskov Substitution Principle — subclasses must honour the parent's contract
# Bad — Square breaks Rectangle's invariant (setting width changes height)
class Rectangle:
    def set_width(self, w: float) -> None: self.width = w
    def set_height(self, h: float) -> None: self.height = h

class Square(Rectangle):  # violates LSP
    def set_width(self, w: float) -> None:
        self.width = self.height = w

# Good — use composition or a shared abstraction instead of inheritance


# Interface Segregation Principle — don't force clients to depend on
# methods they don't use
# Bad
class Worker(ABC):
    @abstractmethod
    def work(self) -> None: ...
    @abstractmethod
    def eat(self) -> None: ...   # robots can't eat!

# Good — split into focused protocols
from typing import Protocol

class Workable(Protocol):
    def work(self) -> None: ...

class Feedable(Protocol):
    def eat(self) -> None: ...


# Dependency Inversion Principle — depend on abstractions, not concretions
# Bad
class OrderService:
    def __init__(self) -> None:
        self._repo = PostgresOrderRepository()  # hard-coded dependency

# Good — inject the abstraction
class OrderService:
    def __init__(self, repo: OrderRepository) -> None:
        self._repo = repo
```

### Pick One Word per Concept
```python
# Bad — fetch / retrieve / get / load used interchangeably for the same operation
def fetch_user(user_id: int) -> User: ...
def retrieve_order(order_id: int) -> Order: ...
def get_product(product_id: int) -> Product: ...
def load_invoice(invoice_id: int) -> Invoice: ...

# Good — pick one verb and use it consistently across the whole codebase
def get_user(user_id: int) -> User: ...
def get_order(order_id: int) -> Order: ...
def get_product(product_id: int) -> Product: ...
def get_invoice(invoice_id: int) -> Invoice: ...
```

### Clean Tests — AAA + One Concept
```python
# Bad — tests too many things at once
def test_user():
    user = User("Alice", "alice@example.com")
    assert user.name == "Alice"
    user.deactivate()
    assert not user.is_active

# Good
def test_user_has_correct_name_on_creation():
    user = User("Alice", "alice@example.com")
    assert user.name == "Alice"

def test_deactivated_user_is_not_active():
    # Arrange
    user = User("Alice", "alice@example.com")
    # Act
    user.deactivate()
    # Assert
    assert not user.is_active
```

---

## Output Format

**Writing code:** produce clean, typed, documented Python directly.

**Reviewing code**, use this structure:
```
### Issues Found
- [NAMES]   `d` → rename to `elapsed_days`
- [SRP]     `process_user` does 3 things → extract `normalize_user`, `send_welcome_email`
- [ERRORS]  returns `None` on miss → raise `UserNotFoundError`
- [FLAGS]   `process(data, dry_run=True)` → split into `process()` and `dry_run_process()`

### Refactored Code
[full rewritten code block]

### Why These Changes
[1-liner per principle applied]
```

---

## Hard Limits — Never Violate

- ❌ Never use bare magic numbers or magic strings — every literal gets a named constant
- ❌ Never use a group of related `CONSTANT_A / CONSTANT_B / CONSTANT_C` — use an `Enum`
- ❌ Never use single-letter variable names outside list comprehensions / loops
- ❌ Never duplicate logic — extract a shared function (DRY)
- ❌ Never nest more than 2 levels of `if` — apply guard clauses instead
- ❌ Never chain through `a.b.c.method()` — Law of Demeter violation
- ❌ Never leave commented-out code — delete it, git has history
- ❌ Never swallow exceptions with bare `except: pass`
- ❌ Never use flag arguments like `process(data, is_dry_run=True)`
- ❌ Never return `None` to signal "not found" — raise a specific exception
- ❌ Never write functions longer than ~20 lines without a documented reason
- ❌ Never put more than 3 parameters on a function — group into a dataclass
- ❌ Never add comments that re-state what the code does — explain *why*
- ❌ Never hard-code a dependency inside a class — inject it (DIP)
- ❌ Never let a subclass break the parent's contract (LSP)

---

## Test Prompts (for skill evaluation)
```
1.  "Review this Python function for clean code issues: [messy code]"
2.  "Write a clean Python class for a shopping cart with add, remove, and total methods"
3.  "Is this good Python? def process(data, send_email=True): db.save(data); if send_email: mail(data)"
4.  "Refactor this to follow Uncle Bob best practices: [long function doing multiple things]"
5.  "How should I handle errors in my API client?"
6.  "What's wrong with this naming? def calc(x, y, f=False): return x*y if not f else x+y"
7.  "Explain the Single Responsibility Principle with a Python example"
8.  "What are magic numbers and why are they bad? Show me an example fix."
9.  "My function has 4 levels of nested if statements — how do I clean it up?"
10. "Is this a Law of Demeter violation? order.customer.address.city"
11. "I have the same validation logic in 3 places — what's the clean way to fix it?"
12. "Explain DIP with a concrete Python example"
13. "What's primitive obsession? How do I fix it in Python?"
14. "When should I use an Enum vs a constant?"
15. "I have STATUS_PENDING, STATUS_ACTIVE, STATUS_DELETED as string constants — is that clean?"
```