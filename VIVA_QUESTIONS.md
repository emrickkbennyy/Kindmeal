# KindMeal — College Viva Questions & Answers
## Subject: Data Structures & Full-Stack Web Development
### Project: Community Food Rescue and FIFO Allocation System

---

### Q1. What real-world problem does KindMeal solve?
**Answer:**
KindMeal addresses perishable food waste and fair distribution. Commercial kitchens (hotels, bakeries, canteens) frequently produce edible surplus food, while local NGOs and community shelters experience shortages. KindMeal provides a transparent platform where food surplus is registered and allocated to requesting NGOs in strict order of arrival using a FIFO Queue, eliminating favoritism and manual bias.

---

### Q2. Why did you choose a FIFO Queue for this project instead of a Stack or Priority Queue?
**Answer:**
- A **Stack (LIFO — Last In, First Out)** would process the newest request first, causing earlier waiting NGOs to starve of resources and wait indefinitely.
- A **Priority Queue** based on requested meal quantity would systematically disadvantage smaller shelters or incentivize NGOs to request inflated quantities to get higher priority.
- A **FIFO Queue (First In, First Out)** guarantees **fairness and predictability**: every request is served in the exact chronological sequence it was submitted.

---

### Q3. What are FRONT and REAR in a FIFO Queue?
**Answer:**
- **REAR (Tail)**: The end of the queue where new elements enter via the **enqueue** operation. When an NGO submits a food request, it is added at the REAR.
- **FRONT (Head)**: The end of the queue where elements are removed via the **dequeue** or accessed via the **peek** operation. All allocations take place strictly at the FRONT.

---

### Q4. What are the core queue operations and their time complexities?
**Answer:**
In our Python implementation using `collections.deque`:
1. `enqueue(item)`: Appends an item to the REAR. Time Complexity: **$O(1)$ constant time**.
2. `dequeue()`: Removes and returns the item at the FRONT. Time Complexity: **$O(1)$ constant time**.
3. `peek()`: Returns the FRONT item without removing it. Time Complexity: **$O(1)$ constant time**.
4. `is_empty()`: Checks if the queue has 0 elements. Time Complexity: **$O(1)$ constant time**.
5. `size()`: Returns total pending requests. Time Complexity: **$O(1)$ constant time**.

---

### Q5. Why is `collections.deque` preferred over Python's built-in `list` for a Queue?
**Answer:**
In a standard Python `list`:
- Appending to the end (`append()`) is $O(1)$.
- Removing from the front (`pop(0)`) requires shifting all remaining $n-1$ elements in memory, which is **$O(n)$ linear time**.
`collections.deque` is implemented internally as a doubly linked list of fixed-size memory blocks, allowing both `append()` and `popleft()` in true **$O(1)$ constant time**.

---

### Q6. What happens if the FRONT request cannot be fulfilled due to insufficient donor stock?
**Answer:**
Under our strict FIFO policy:
1. The request remains permanently tied to its chosen donor. We never silently substitute another donor's stock.
2. The backend database transaction verifies stock before deduction. Because stock is insufficient, it raises `InsufficientStockError` and executes `ROLLBACK`.
3. The request is **not skipped or discarded**; it remains at the FRONT of the queue, preserving fairness until replenished or adjusted.

---

### Q7. How does the application prevent duplicate allocations and race conditions?
**Answer:**
All allocation operations in `database.py` are executed within an atomic SQLite transaction using `BEGIN IMMEDIATE`:
1. The database checks that `status == 'pending'`. If it is already marked `completed`, the transaction immediately aborts.
2. Inventory deduction, status update (`status = 'completed'`), and insertion into the `allocations` history table occur in the same transaction.
3. If any step fails, the entire transaction is rolled back, preventing partial updates or duplicate fulfillment.

---

### Q8. Why did you use SQLite instead of keeping data solely in memory or browser localStorage?
**Answer:**
- **In-Memory alone** loses all data when the Python process stops.
- **Browser localStorage** is isolated to a single client browser and cannot serve as a synchronized backend source of truth across multiple clients.
- **SQLite** provides a reliable, file-based relational database supporting ACID transactions, foreign keys (`PRAGMA foreign_keys = ON;`), and SQL integrity constraints (`CHECK(available_quantity >= 0)`).

---

### Q9. How is the queue reconstructed after restarting the backend server?
**Answer:**
On startup, `backend/app.py` runs `sync_queue_from_db()`:
```python
def sync_queue_from_db():
    fifo_queue.clear()
    pending = get_pending_requests()  # ORDER BY queue_sequence ASC
    for req in pending:
        fifo_queue.enqueue(req)
```
Because each request has an auto-incrementing `queue_sequence` primary key in SQLite, the exact chronological arrival order is restored into the in-memory queue without any data loss.

---

### Q10. How does the React frontend communicate with the Flask backend?
**Answer:**
Communication occurs through a REST API over HTTP:
- `src/services/api.js` centralizes all Fetch API calls to `http://127.0.0.1:5000`.
- Data is transmitted as JSON payloads.
- Flask-CORS enables cross-origin resource sharing between Vite (`localhost:5173`) and Flask (`127.0.0.1:5000`).
- The frontend never selects which request to allocate; it calls `POST /api/queue/process`, and the Flask backend deterministically allocates the request currently at the FRONT.
