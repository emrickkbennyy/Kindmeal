# KindMeal — Code Walkthrough & Architecture Guide

## 1. Project Overview & Architecture

**KindMeal** is a full-stack community food rescue platform designed to demonstrate the real-world application of the **First-In, First-Out (FIFO) Queue** data structure.

The architecture connects three integrated layers:
1. **Frontend (React 19 + Vite)**: A responsive, minimalist UI with exactly three main pages (`Home`, `Available Food`, `Rescue Queue`).
2. **Backend (Python 3 + Flask REST API)**: Manages in-memory FIFO dispatch order via `collections.deque` and processes allocation requests deterministically.
3. **Database (SQLite — `backend/kindmeal.db`)**: The authoritative persistent source of truth enforcing foreign keys, transactional atomicity, and stock isolation.

```
┌────────────────────────────────────────────────────────┐
│                   React 19 / Vite UI                   │
│   HomePage  │  AvailableFoodPage  │  RescueQueuePage   │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP JSON (src/services/api.js)
                            ▼
┌────────────────────────────────────────────────────────┐
│                  Flask REST API (app.py)               │
│   GET /api/donors  POST /api/requests  POST /process   │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
       Enqueue / Dequeue                 │ Transactional
       Operations (O(1))                 │ Commit / Rollback
                ▼                        ▼
┌───────────────────────────────┐ ┌──────────────────────┐
│  FIFOQueue (queue_manager.py) │ │ SQLite (database.py) │
│   collections.deque (RAM)     │ │   kindmeal.db (Disk) │
└───────────────────────────────┘ └──────────────────────┘
```

---

## 2. FIFO Queue Implementation (`backend/queue_manager.py`)

The queue is implemented in Python using `collections.deque` (doubly ended queue), which provides $O(1)$ amortized time complexity for operations at both ends.

```python
from collections import deque
from typing import Any, Optional

class FIFOQueue:
    def __init__(self):
        self._items: deque = deque()

    def enqueue(self, item: Any) -> None:
        """Adds request to the REAR (tail) of the queue. O(1) time."""
        self._items.append(item)

    def dequeue(self) -> Optional[Any]:
        """Removes and returns request from FRONT (head). O(1) time."""
        if self.is_empty():
            return None
        return self._items.popleft()

    def peek(self) -> Optional[Any]:
        """Inspects FRONT item without removing it. O(1) time."""
        if self.is_empty():
            return None
        return self._items[0]

    def peek_rear(self) -> Optional[Any]:
        """Inspects REAR item without removing it. O(1) time."""
        if self.is_empty():
            return None
        return self._items[-1]

    def is_empty(self) -> bool:
        """Returns True if queue contains zero elements. O(1) time."""
        return len(self._items) == 0

    def size(self) -> int:
        """Returns number of pending requests. O(1) time."""
        return len(self._items)
```

### Key Queue Concepts Explained Simply:
- **FRONT (Head)**: The oldest pending request in the system. All allocations take place **only** from the FRONT.
- **REAR (Tail)**: The newest arrival in the system. Any newly submitted NGO request is placed here.
- **Enqueue**: Appending an element to the rear (`self._items.append(item)`).
- **Dequeue**: Removing the oldest element from the front (`self._items.popleft()`).
- **Peek**: Examining the front element without altering the queue (`self._items[0]`).
- **Time Complexity**: Every primary operation runs in **$O(1)$ constant time**.

---

## 3. Database Schema & Persistence (`backend/database.py`)

SQLite acts as the persistent authority. The schema consists of three relational tables:

```sql
-- 1. Donors Table (Specific donor stock and details)
CREATE TABLE donors (
    donor_id TEXT PRIMARY KEY,
    donor_name TEXT NOT NULL,
    food_category TEXT NOT NULL,
    food_description TEXT,
    available_quantity INTEGER NOT NULL CHECK(available_quantity >= 0),
    unit TEXT NOT NULL,
    location TEXT NOT NULL,
    pickup_deadline TEXT NOT NULL,
    dietary TEXT,
    prep_time TEXT,
    type_badge TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Requests Table (Monotonically increasing queue_sequence guarantees strict FIFO)
CREATE TABLE requests (
    queue_sequence INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id TEXT NOT NULL UNIQUE,
    ngo_name TEXT NOT NULL,
    donor_id TEXT NOT NULL,
    requested_quantity INTEGER NOT NULL CHECK(requested_quantity > 0),
    contact_person TEXT,
    target_beneficiary TEXT,
    request_timestamp TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'cancelled')),
    FOREIGN KEY (donor_id) REFERENCES donors (donor_id) ON DELETE RESTRICT
);

-- 3. Allocations Table (Immutable completed rescue history)
CREATE TABLE allocations (
    allocation_id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL UNIQUE,
    donor_id TEXT NOT NULL,
    ngo_name TEXT NOT NULL,
    allocated_quantity INTEGER NOT NULL CHECK(allocated_quantity > 0),
    allocation_timestamp TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES requests (request_id) ON DELETE RESTRICT,
    FOREIGN KEY (donor_id) REFERENCES donors (donor_id) ON DELETE RESTRICT
);
```

---

## 4. Atomic Transaction & Insufficient Stock Policy

When an allocation is triggered, the backend executes an atomic SQLite transaction (`BEGIN IMMEDIATE`):

```python
def execute_allocation_transaction(request_id: str, db_path: str = DB_PATH):
    conn = get_db_connection(db_path)
    try:
        conn.isolation_level = None
        cursor = conn.cursor()
        cursor.execute("BEGIN IMMEDIATE;")

        # 1. Fetch request under lock and verify pending status
        cursor.execute("SELECT * FROM requests WHERE request_id = ?;", (request_id,))
        req = cursor.fetchone()
        if req['status'] != 'pending':
            cursor.execute("ROLLBACK;")
            raise RequestAlreadyProcessedError(...)

        # 2. Check selected donor's real-time inventory
        cursor.execute("SELECT * FROM donors WHERE donor_id = ?;", (req['donor_id'],))
        donor = cursor.fetchone()

        if donor['available_quantity'] < req['requested_quantity']:
            cursor.execute("ROLLBACK;")
            raise InsufficientStockError(
                f"Insufficient stock at {donor['donor_name']}. "
                f"Requested {req['requested_quantity']} {donor['unit']}, but only {donor['available_quantity']} remain."
            )

        # 3. Deduct inventory ONLY from the targeted donor
        new_quantity = donor['available_quantity'] - req['requested_quantity']
        cursor.execute("UPDATE donors SET available_quantity = ? WHERE donor_id = ?;",
                       (new_quantity, req['donor_id']))

        # 4. Mark request completed
        cursor.execute("UPDATE requests SET status = 'completed' WHERE request_id = ?;", (request_id,))

        # 5. Record allocation history
        cursor.execute("INSERT INTO allocations (...) VALUES (...);", (...))

        cursor.execute("COMMIT;")
        return allocation_result
    except Exception:
        conn.execute("ROLLBACK;")
        raise
```

### Policy on Insufficient Stock:
- A request is **permanently tied to its donor**. We never silently substitute food from another donor.
- If the FRONT request cannot be fulfilled due to low stock, the transaction rolls back, preserving the request at the FRONT.
- The request is **not skipped or discarded**. A clear error is returned to the user explaining why fulfillment must wait.

---

## 5. Flask REST API Endpoints (`backend/app.py`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Verifies server and database connection |
| `GET` | `/api/donors` | Retrieves all donors with current stock |
| `GET` | `/api/queue` | Returns pending requests in FIFO order |
| `GET` | `/api/queue/front` | Peeks the FRONT pending request |
| `POST` | `/api/requests` | Enqueues a new request at the REAR |
| `POST` | `/api/queue/process` | Deterministically dequeues and allocates FRONT request |
| `GET` | `/api/allocations` | Returns history of completed rescues |
| `GET` | `/api/dashboard/stats` | Returns aggregated platform metrics |
| `POST` | `/api/demo/reset` | Resets SQLite database and queue to demo state |

---

## 6. Frontend Integration (`src/services/api.js` & `RescueContext.jsx`)

1. **`src/services/api.js`**: Reusable HTTP client communicating with `http://127.0.0.1:5000` using the Fetch API.
2. **`src/context/RescueContext.jsx`**: Centralized state management:
   - On initial mount, calls `api.getDonors()`, `api.getQueue()`, `api.getAllocations()`, and `api.getDashboardStats()`.
   - `enqueueRequest()` posts payload to Flask and reloads latest queue position.
   - `dequeueRequest()` requests backend allocation and updates donor stock immediately.
   - Offline detection: If Flask is not running, gracefully alerts user via a banner without crashing.

---

## 7. How to Run KindMeal Locally

### Backend Setup:
```powershell
# 1. Open PowerShell in project directory
cd "c:\Users\acer\Desktop\kindest meal project"

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
.\venv\Scripts\Activate.ps1

# 4. Install dependencies
pip install -r backend/requirements.txt

# 5. Start Flask REST API
python backend/app.py
```
*Backend runs on `http://127.0.0.1:5000`.*

### Frontend Setup (Second Terminal):
```powershell
# 1. In project directory
cd "c:\Users\acer\Desktop\kindest meal project"

# 2. Start Vite development server
npm run dev
# (or if PowerShell execution policy restricts npm.ps1, run: npm.cmd run dev)
```
*Frontend opens at `http://localhost:5173`.*

### Running Automated Backend Tests:
```powershell
python backend/test_queue_and_db.py
```
*All 16 unit and integration test cases run against an isolated SQLite test database.*
