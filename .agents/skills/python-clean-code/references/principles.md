# Python Clean Code — Detailed Principles Reference

## 1. Meaningful Names

### Use Intention-Revealing Names
Names should answer WHY something exists, WHAT it does, and HOW it is used.

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

### Avoid Disinformation and Encodings
```python
# Bad
account_list = {"alice": 100}   # it's a dict, not a list
strCustomerName = "Alice"       # Hungarian notation
customer_name_string = "Alice"  # noise word

# Good
accounts = {"alice": 100}
customer_name = "Alice"
```

### Use Pronounceable and Searchable Names
```python
# Bad
yyyymmdd = datetime.date.today()
n = 5  # magic number

# Good
current_date = datetime.date.today()
MAX_RETRIES = 5
```

### Expand Abbreviations — Unless Universally Known
An abbreviation forces the reader to perform a mental lookup. If they have to stop
and think "what does `crf` stand for?", the name has failed.

**Keep** an abbreviation only when the full form would surprise a reader more than
the abbreviation — i.e. it is truly universal within a broad audience.

| Abbreviation | Decision | Reason |
|---|---|---|
| `url`, `id`, `http`, `api` | Keep | Universal, full form rarely used |
| `fps` (frames per second) | Keep | Standard in all media contexts |
| `crf` (Constant Rate Factor) | **Expand** | Known to FFmpeg specialists only |
| `pix_fmt` (pixel format) | **Expand** | Lazy contraction, not a real term |
| `cfg`, `ctx`, `mgr`, `req`, `resp` | **Expand** | Save nothing, cost clarity |
| `h`, `m`, `s` in a 3-line time function | Keep locally | Conventional, scope is tiny |

```python
# Bad — caller must know FFmpeg internals to understand what they are passing
def create_video(codec: str, crf: int, pix_fmt: str) -> None: ...

create_video(codec="libx264", crf=18, pix_fmt="yuv420p")
# ↑ What is 18? What is "yuv420p"? Only an FFmpeg user knows.

# Good — self-documenting at every call site
def create_video(
    codec: str,
    constant_rate_factor: int,   # 0 (lossless) – 51 (worst); 23 is default
    pixel_format: str,
) -> None: ...

create_video(codec="libx264", constant_rate_factor=18, pixel_format="yuv420p")
# ↑ A new reader can understand the intent without consulting documentation.
```

**Key insight:** the FFmpeg *flag* name (`-crf`, `-pix_fmt`) lives in the command string —
that is a protocol detail. The Python *parameter* name is what communicates intent to the
next developer. They are independent concerns.

```python
# The flag stays as FFmpeg expects it; the Python name stays human-readable
cmd = ["-crf", str(constant_rate_factor), "-pix_fmt", pixel_format]
```

### Avoid Mental Mapping
Single-letter names force readers to keep a mental translation table in their head.
Use meaningful names even in short loops when the meaning is not obvious.
```python
# Bad — what is r? what is t?
for r in results:
    t += r.val

# Good
for result in results:
    total += result.value
```

### Pick One Word per Concept
Choose a single verb for each operation type and use it everywhere in the codebase.
```python
# Bad — fetch / retrieve / get / load used interchangeably
def fetch_user(user_id: int) -> User: ...
def retrieve_order(order_id: int) -> Order: ...
def load_invoice(invoice_id: int) -> Invoice: ...

# Good — consistent vocabulary
def get_user(user_id: int) -> User: ...
def get_order(order_id: int) -> Order: ...
def get_invoice(invoice_id: int) -> Invoice: ...
```

### Name Classes as Nouns, Functions as Verbs
```python
# Bad
class ProcessData: ...
def data(user): ...

# Good
class DataProcessor: ...
def fetch_user_profile(user_id: int) -> dict: ...
```

---

## 2. Magic Numbers and Magic Values

A **magic number** (or magic value) is any bare literal — numeric, string, boolean — whose
meaning is not obvious from context. They are dangerous because:

- The same literal may appear in multiple places; changing one copy silently misses the others (DRY violation)
- The reader must guess the intent; the name would make it explicit

### Replace Every Bare Literal with a Named Constant
```python
# Bad — what does 86400 mean? what is 3? what is "admin"?
if elapsed > 86400:
    ...
if retries > 3:
    ...
if user["role"] == "admin":
    ...

# Good
SECONDS_IN_A_DAY = 86_400
MAX_RETRIES = 3
ADMIN_ROLE = "admin"

if elapsed > SECONDS_IN_A_DAY:
    ...
if retries > MAX_RETRIES:
    ...
if user["role"] == ADMIN_ROLE:
    ...
```

### Enum vs Constant — Decision Guide

| Situation | Use |
|-----------|-----|
| Single standalone config value (`MAX_RETRIES`, `TIMEOUT_S`) | **Constant** |
| Set of related named codes / labels / options | **Enum** |
| Two or more constants sharing a common prefix (`STATUS_*`, `PRESET_*`) | **Enum** |
| Value needs iteration, membership testing, or exhaustive matching | **Enum** |
| Value serialised to JSON / DB and must round-trip from a raw string | **`str, Enum`** |
| Value has an associated numeric property (e.g. resolution → pixel height) | **`int, Enum`** |

### Use Enums for Closed Sets of Related Values
When two or more related named values form a closed set, encode them as an `Enum`.
Using separate constants allows invalid values, invites typos, and provides no
exhaustive-match guarantee.

```python
# Bad — three constants that are really one concept; accepts any string
RENDER_STATUS_QUEUED = "queued"
RENDER_STATUS_DONE   = "done"
RENDER_STATUS_ERROR  = "error"

def update_render(render_id: str, status: str) -> None:
    if status == RENDER_STATUS_DONE:   # typo-prone string comparison
        ...

# Good — closed set, type-safe, IDE-autocompleted
from enum import Enum

class RenderStatus(str, Enum):
    QUEUED = "queued"
    DONE   = "done"
    ERROR  = "error"

def update_render(render_id: str, status: RenderStatus) -> None:
    if status == RenderStatus.DONE:
        ...
```

### `str, Enum` — Serialisable Enums for APIs and Pydantic
Inherit from both `str` and `Enum` when the value must travel as a plain string
(HTTP API, database column, JSON payload). The enum member **is** the string, so no
manual `.value` calls are needed, and Pydantic v2 coerces `"queued"` → `RenderStatus.QUEUED`
automatically.

```python
class VideoPreset(str, Enum):
    FAST   = "fast"
    MEDIUM = "medium"
    SLOW   = "slow"

# Works transparently as a string — no .value needed
cmd = ["ffmpeg", "-preset", VideoPreset.MEDIUM]  # passes "medium" directly

# Pydantic field accepts both the enum member and the raw string
class EncodeRequest(BaseModel):
    preset: VideoPreset = VideoPreset.MEDIUM

EncodeRequest(preset="fast")            # coerced to VideoPreset.FAST ✓
EncodeRequest(preset=VideoPreset.SLOW)  # direct ✓
EncodeRequest(preset="turbo")           # ValidationError ✓
```

### `int, Enum` — Enums with Meaningful Numeric Values

```python
class VideoResolution(int, Enum):
    P480  = 480
    P720  = 720
    P1080 = 1080
    P1440 = 1440
    K4    = 2160

# Use .value to access the height directly — no separate lookup dict needed
def scale_to(width: int, height: int, target: VideoResolution) -> tuple[int, int]:
    aspect = width / height
    new_h  = target.value          # 720, 1080, etc. — no dict lookup
    new_w  = int(new_h * aspect)
    return new_w, new_h
```

### Common Exceptions — Zero and One Are Usually Fine
```python
# These are self-evident and do not need a constant
items[0]          # first element
range(len(items)) # standard iteration
if count == 0:    # emptiness check
```

---

## 3. Functions and Command-Query Separation

### Do One Thing (Single Responsibility)
```python
# Bad — does too much
def process_user(user_data: dict):
    user_data["name"] = user_data["name"].strip()
    db.save(user_data)
    email_service.send_welcome(user_data["email"])
    print(f"User {user_data['name']} created")

# Good — each function has one job
def normalize_user(user_data: dict) -> dict:
    return {**user_data, "name": user_data["name"].strip()}

def register_user(user_data: dict) -> None:
    clean_data = normalize_user(user_data)
    db.save(clean_data)
    send_welcome_email(clean_data["email"])

def send_welcome_email(email: str) -> None:
    email_service.send_welcome(email)
```

### Keep Functions Small
A function should rarely exceed 20 lines. If you need to scroll, it is too long.

### Limit Arguments (Ideal: 0-2, Max: 3)
```python
# Bad
def create_user(first_name, last_name, email, age, role, is_active):
    ...

# Good — use a dataclass
from dataclasses import dataclass

@dataclass
class UserData:
    first_name: str
    last_name: str
    email: str
    age: int
    role: str
    is_active: bool = True

def create_user(user: UserData) -> None:
    ...
```

### Avoid Flag Arguments
```python
# Bad — flag argument signals the function does two things
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

### Command-Query Separation
Functions should either DO something or RETURN something — not both.
```python
# Bad
def save_and_get_id(user: dict) -> int:
    db.save(user)
    return db.last_insert_id()

# Good
def save_user(user: dict) -> None:
    db.save(user)

def get_last_user_id() -> int:
    return db.last_insert_id()
```

### Prefer Exceptions Over Error Codes
```python
# Bad
def find_user(user_id: int) -> dict | int:
    user = db.find(user_id)
    if not user:
        return -1
    return user

# Good
class UserNotFoundError(Exception):
    pass

def find_user(user_id: int) -> dict:
    user = db.find(user_id)
    if not user:
        raise UserNotFoundError(f"No user found with id: {user_id}")
    return user
```

---

## 4. DRY — Don't Repeat Yourself

Every piece of knowledge must have a **single, authoritative representation** in the system.
Duplication is the root of many maintenance problems: fix the bug in one copy and silently
leave it in the other.

### Extract Duplicated Logic into a Shared Function
```python
# Bad — validation logic copied in three places
def create_user(email: str) -> None:
    if "@" not in email or "." not in email:
        raise ValueError("Invalid email")
    db.insert("users", email=email)

def update_email(user_id: int, email: str) -> None:
    if "@" not in email or "." not in email:
        raise ValueError("Invalid email")
    db.update("users", user_id, email=email)

# Good — one authoritative validation function
def validate_email(email: str) -> None:
    if "@" not in email or "." not in email:
        raise ValueError(f"Invalid email address: {email!r}")

def create_user(email: str) -> None:
    validate_email(email)
    db.insert("users", email=email)

def update_email(user_id: int, email: str) -> None:
    validate_email(email)
    db.update("users", user_id, email=email)
```

### DRY in Data — Use a Single Source of Truth
```python
# Bad — field list maintained in two places
REQUIRED_FIELDS = ["name", "email", "role"]

@dataclass
class User:
    name: str
    email: str
    role: str

def validate(data: dict) -> None:
    for field in REQUIRED_FIELDS:  # out of sync the moment a field is added/removed
        if field not in data:
            raise ValueError(f"Missing: {field}")

# Good — derive from the dataclass itself
import dataclasses

@dataclass
class User:
    name: str
    email: str
    role: str

def validate(data: dict) -> None:
    for field in dataclasses.fields(User):
        if field.name not in data:
            raise ValueError(f"Missing: {field.name}")
```

---

## 5. Guard Clauses — Fail Fast, Return Early

Deeply nested `if` blocks (the "arrow anti-pattern") are hard to read. Guard clauses
invert the condition and return/raise early, keeping the happy path flat.

### Replace Nested Ifs with Guard Clauses
```python
# Bad — pyramid of doom, happy path buried at the bottom
def process_order(order: Order) -> Receipt:
    if order is not None:
        if order.is_paid:
            if order.items:
                if inventory.has_stock(order.items):
                    receipt = fulfil(order)
                    return receipt

# Good — each guard eliminates invalid state immediately
def process_order(order: Order) -> Receipt:
    if order is None:
        raise ValueError("Order cannot be None")
    if not order.is_paid:
        raise OrderNotPaidError(order.id)
    if not order.items:
        raise EmptyOrderError(order.id)
    if not inventory.has_stock(order.items):
        raise InsufficientStockError(order.items)

    return fulfil(order)
```

### Guard Clauses in Loops
```python
# Bad — main logic wrapped in a condition
for user in users:
    if user.is_active:
        if user.has_permission("export"):
            export(user)

# Good — skip early, keep the body flat
for user in users:
    if not user.is_active:
        continue
    if not user.has_permission("export"):
        continue
    export(user)
```

---

## 6. Side Effects and Output Arguments

### No Hidden Side Effects
A function's name is its contract. If it says "get", it should only read.
Hidden mutations surprise callers and make code hard to test.
```python
# Bad — name implies a pure read, but it mutates state
def get_next_id(counter: dict) -> int:
    counter["value"] += 1          # hidden side effect
    return counter["value"]

# Good — separate query from command
def current_id(counter: dict) -> int:
    return counter["value"]

def increment_counter(counter: dict) -> None:
    counter["value"] += 1
```

### Avoid Output Arguments — Return New Values
Passing an object in order to modify it forces the caller to track invisible mutations.
```python
# Bad — caller cannot tell the dict will be modified
def enrich_user(user: dict) -> None:
    user["full_name"] = f"{user['first']} {user['last']}"

# Good — pure function returns a new value; original is untouched
def enrich_user(user: dict) -> dict:
    return {**user, "full_name": f"{user['first']} {user['last']}"}
```

---

## 7. Comments

### Don't Comment Bad Code — Rewrite It
```python
# Bad
# Check if employee is eligible for benefits
if employee.age > 65 and employee.tenure > 2 and not employee.part_time:
    ...

# Good
if employee.is_eligible_for_benefits():
    ...
```

### Acceptable Comments
```python
# Legal / licensing header
# Copyright (c) 2024 Acme Corp. All rights reserved.

# Explaining WHY, not WHAT
# We use MD5 here for legacy compatibility only — not for security.
checksum = hashlib.md5(data).hexdigest()

# TODO notes (use sparingly)
# TODO: Replace with async implementation once the service supports it.

# Public API docstrings
def calculate_interest(principal: float, rate: float, years: int) -> float:
    """
    Calculate compound interest.

    Args:
        principal: Initial investment amount in dollars.
        rate: Annual interest rate as a decimal (e.g., 0.05 for 5%).
        years: Investment duration in years.

    Returns:
        Total value after compound interest is applied.
    """
    return principal * (1 + rate) ** years
```

### Never Do This
```python
# Bad: Redundant comment
# Set i to 0
i = 0

# Bad: Commented-out code — just delete it, git has history
# old_price = item.base_price * 1.1
price = item.base_price * 1.2

# Bad: Misleading comment
# Returns user age
def get_user_name(user_id: int) -> str: ...
```

---

## 8. Formatting

### Vertical Ordering — High Level First
Place callers above callees. Readers should be able to read top-to-bottom.

```python
# Good — high-level orchestration at the top
def process_order(order_id: int) -> None:
    order = fetch_order(order_id)
    validate_order(order)
    charge_customer(order)
    send_confirmation(order)

def fetch_order(order_id: int) -> Order: ...
def validate_order(order: Order) -> None: ...
def charge_customer(order: Order) -> None: ...
def send_confirmation(order: Order) -> None: ...
```

### Vertical Density — Related Code Stays Together
```python
# Bad — unnecessary blank lines break flow
class Order:

    order_id: int

    customer_id: int

# Good
class Order:
    order_id: int
    customer_id: int
    total: float
```

### Line Length
Keep lines under 100 characters. PEP 8 recommends 79; 99-100 is a practical modern limit.

---

## 9. Classes and SOLID

### Single Responsibility Principle (SRP)
```python
# Bad — class knows too much
class UserManager:
    def save_user(self, user): ...
    def send_email(self, user): ...
    def generate_report(self, user): ...

# Good — separate concerns
class UserRepository:
    def save(self, user: User) -> None: ...

class EmailService:
    def send_welcome(self, user: User) -> None: ...

class UserReportGenerator:
    def generate(self, user: User) -> Report: ...
```

### Prefer Composition Over Inheritance
```python
# Bad — deep inheritance hierarchy
class Animal: ...
class Mammal(Animal): ...
class Dog(Mammal): ...

# Good — compose behaviours
class Dog:
    def __init__(self, breed: str, trainer: Trainer) -> None:
        self.breed = breed
        self._trainer = trainer

    def perform_trick(self, trick: str) -> None:
        self._trainer.execute(trick)
```

### Open/Closed Principle
```python
# Bad — must modify class to add new discount type
class PriceCalculator:
    def calculate(self, price: float, discount_type: str) -> float:
        if discount_type == "student":
            return price * 0.9
        elif discount_type == "senior":
            return price * 0.8

# Good — extend via abstraction
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

### Liskov Substitution Principle (LSP)
Subclasses must be fully substitutable for their parent — they must honour the parent's
invariants, not weaken preconditions, and not strengthen postconditions.
```python
# Bad — Square breaks Rectangle's invariant (setting width also changes height)
class Rectangle:
    def __init__(self, width: float, height: float) -> None:
        self.width = width
        self.height = height

    def area(self) -> float:
        return self.width * self.height

class Square(Rectangle):  # LSP violation
    def __init__(self, side: float) -> None:
        super().__init__(side, side)

    def set_width(self, w: float) -> None:
        self.width = self.height = w   # surprises callers of Rectangle

# Good — use a shared abstraction, not inheritance
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

class Rectangle(Shape):
    def __init__(self, width: float, height: float) -> None:
        self.width = width
        self.height = height

    def area(self) -> float:
        return self.width * self.height

class Square(Shape):
    def __init__(self, side: float) -> None:
        self.side = side

    def area(self) -> float:
        return self.side ** 2
```

### Interface Segregation Principle (ISP)
No client should be forced to depend on methods it does not use. Split fat interfaces
into focused protocols.
```python
# Bad — Robot is forced to implement eat() which makes no sense for it
from abc import ABC, abstractmethod

class Worker(ABC):
    @abstractmethod
    def work(self) -> None: ...

    @abstractmethod
    def eat(self) -> None: ...   # robots cannot eat

class Robot(Worker):
    def work(self) -> None: ...
    def eat(self) -> None:
        raise NotImplementedError  # forced stub — ISP violation

# Good — split into small, focused protocols
from typing import Protocol

class Workable(Protocol):
    def work(self) -> None: ...

class Feedable(Protocol):
    def eat(self) -> None: ...

class HumanWorker:
    def work(self) -> None: ...
    def eat(self) -> None: ...

class RobotWorker:
    def work(self) -> None: ...   # only implements what it needs
```

### Dependency Inversion Principle (DIP)
High-level modules should not depend on low-level modules. Both should depend on
abstractions. Inject dependencies; never instantiate them inside a class.
```python
# Bad — OrderService is hard-coupled to a specific database implementation
class OrderService:
    def __init__(self) -> None:
        self._repo = PostgresOrderRepository()  # hard-coded, untestable

    def get_order(self, order_id: int) -> Order:
        return self._repo.find(order_id)

# Good — depend on an abstraction; inject the implementation
from typing import Protocol

class OrderRepository(Protocol):
    def find(self, order_id: int) -> Order: ...
    def save(self, order: Order) -> None: ...

class OrderService:
    def __init__(self, repo: OrderRepository) -> None:
        self._repo = repo  # any conforming implementation works

    def get_order(self, order_id: int) -> Order:
        return self._repo.find(order_id)

# In production
service = OrderService(repo=PostgresOrderRepository())

# In tests
service = OrderService(repo=FakeOrderRepository())
```

---

## 10. Law of Demeter — Don't Talk to Strangers

A method should only call methods on:
1. `self`
2. Objects passed as arguments
3. Objects it creates locally
4. Direct component/attribute objects

Reaching through the object graph (`a.b.c.method()`) creates tight coupling and
makes refactoring painful.

```python
# Bad — OrderService knows about Customer's internal structure
class OrderService:
    def get_city(self, order: Order) -> str:
        return order.customer.address.city  # reaches through two levels

# Good — each object provides a method that hides its internal structure
@dataclass
class Address:
    street: str
    city: str

@dataclass
class Customer:
    name: str
    address: Address

    def city(self) -> str:           # hide the internal Address
        return self.address.city

@dataclass
class Order:
    customer: Customer

    def customer_city(self) -> str:  # hide the internal Customer
        return self.customer.city()

class OrderService:
    def get_city(self, order: Order) -> str:
        return order.customer_city()  # talks only to its direct collaborator
```

---

## 11. Primitive Obsession — Value Objects over Raw Primitives

Using raw strings, ints, and floats for domain concepts loses type safety, allows
invalid values, and duplicates validation logic everywhere.
Replace primitive clusters with small, focused value objects.

```python
# Bad — raw primitives with no validation or meaning
def transfer(amount: float, from_account: str, to_account: str) -> None:
    if amount < 0:
        raise ValueError("Negative amount")
    if len(from_account) != 10:
        raise ValueError("Invalid account number")
    ...

# Good — each domain concept is its own type
from dataclasses import dataclass

@dataclass(frozen=True)
class Money:
    amount: float
    currency: str

    def __post_init__(self) -> None:
        if self.amount < 0:
            raise ValueError(f"Amount cannot be negative: {self.amount}")
        if not self.currency:
            raise ValueError("Currency cannot be empty")

@dataclass(frozen=True)
class AccountNumber:
    value: str

    def __post_init__(self) -> None:
        if len(self.value) != 10 or not self.value.isdigit():
            raise ValueError(f"Invalid account number: {self.value!r}")

def transfer(amount: Money, from_account: AccountNumber, to_account: AccountNumber) -> None:
    ...  # validation is already guaranteed by the types
```

---

## 12. Error Handling

### Use Specific Exceptions
```python
# Bad
try:
    process(data)
except Exception:
    pass  # swallowing errors silently

# Good
try:
    process(data)
except ValueError as e:
    logger.error("Invalid data format: %s", e)
    raise
except ConnectionError as e:
    logger.error("Database unreachable: %s", e)
    raise ServiceUnavailableError("Temporary outage") from e
```

### Do Not Return None — Raise or Use Null Object
```python
# Bad — caller must always check for None
def find_config(key: str) -> dict | None:
    return configs.get(key)

# Good — raise or use a safe default
def find_config(key: str) -> dict:
    config = configs.get(key)
    if config is None:
        raise KeyError(f"Configuration key '{key}' not found")
    return config
```

---

## 13. Tests — F.I.R.S.T. Principles

| Principle | Meaning |
|-----------|---------|
| Fast | Tests run in milliseconds |
| Independent | No test depends on another |
| Repeatable | Same result every run |
| Self-Validating | Pass or fail — no manual check |
| Timely | Written alongside or before production code |

### One Concept Per Test
```python
# Bad — testing too many things
def test_user():
    user = User("Alice", "alice@example.com")
    assert user.name == "Alice"
    assert user.email == "alice@example.com"
    user.deactivate()
    assert not user.is_active
    user.activate()
    assert user.is_active

# Good — focused tests with clear names
def test_user_has_correct_name_on_creation():
    user = User("Alice", "alice@example.com")
    assert user.name == "Alice"

def test_user_is_active_by_default():
    user = User("Alice", "alice@example.com")
    assert user.is_active

def test_deactivated_user_is_not_active():
    user = User("Alice", "alice@example.com")
    user.deactivate()
    assert not user.is_active
```

### Arrange-Act-Assert (AAA)
```python
def test_calculate_total_price_applies_quantity():
    # Arrange
    unit_price = 10.0
    quantity = 3

    # Act
    total = calculate_total_price(unit_price, quantity)

    # Assert
    assert total == 30.0
```

---

## 14. The Boy Scout Rule

Always leave the code cleaner than you found it.

Before every commit, improve something — a name, a bloated function, a missing test,
a stale comment. Small, continuous improvements prevent code rot.
