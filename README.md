# KindMeal — Community Food Rescue and FIFO Allocation System

> **Tagline:** Rescue Food. Serve Communities.  
> **Academic Subject:** Data Structures & Algorithms (FIFO Queue Implementation)  
> **Tech Stack:** React 19 (Vite), Python (Flask REST API), SQLite (`backend/kindmeal.db`)

---

## 1. Project Overview

KindMeal connects food donors (canteens, bakeries, restaurants, caterers) with community organizations (NGOs, shelters, community kitchens) in need of surplus food.

### The Central Data Structure: FIFO Queue (First-In, First-Out)
- **FRONT (Head)**: The oldest pending request is processed first for allocation.
- **REAR (Tail)**: Newly submitted requests enter at the back of the queue.
- **Fairness Guarantee**: No request can bypass an older request. Allocation is deterministic and fair.

---

## 2. Exactly Three Main Pages

1. **Home (`HomePage.jsx`)**: Explains KindMeal, displays real-time statistics (available food by unit, pending queue size, completed rescues), and provides a concise 3-step FIFO guide.
2. **Available Food (`AvailableFoodPage.jsx`)**: Displays verified food donor listings, real-time stock levels, category filters, and opens the request form. Zero-stock listings are clearly flagged as out of stock.
3. **Rescue Queue (`RescueQueuePage.jsx`)**: Displays the live FIFO Queue with prominent FRONT and REAR indicators, donor avatars, the "Allocate Front Request" action, the waiting table, and persistent allocation history.

---

## 3. Technology Stack

- **Frontend**: React 19, Vite, Vanilla CSS design system, Lucide icons.
- **Backend**: Python 3, Flask REST API, Flask-CORS.
- **Queue**: `collections.deque`-based `FIFOQueue` in `backend/queue_manager.py` with $O(1)$ operations (`enqueue`, `dequeue`, `peek`, `is_empty`, `size`).
- **Database**: SQLite (`backend/kindmeal.db`) with foreign key enforcement and transactional rollbacks (`BEGIN IMMEDIATE`).

---

## 4. How to Run Locally

### Terminal 1: Python Flask Backend
```powershell
cd "c:\Users\acer\Desktop\kindest meal project"

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install requirements
pip install -r backend/requirements.txt

# Run backend
python backend/app.py
```
*API will run at `http://127.0.0.1:5000`.*

### Terminal 2: React Vite Frontend
```powershell
cd "c:\Users\acer\Desktop\kindest meal project"

# Start Vite dev server (node_modules is already installed)
npm run dev
# (or if PowerShell restricts npm.ps1: npm.cmd run dev)
```
*Frontend will open at `http://localhost:5173`.*

---

## 5. Automated Backend Tests

To run the automated test suite testing all 16 business rules and FIFO queue operations against an isolated SQLite test database:
```powershell
python backend/test_queue_and_db.py
```

---

## 6. Project Documentation

- **[`CODE_WALKTHROUGH.md`](./CODE_WALKTHROUGH.md)**: Detailed technical walkthrough of Python queue methods, database transactions, API design, and component architecture.
- **[`VIVA_QUESTIONS.md`](./VIVA_QUESTIONS.md)**: Common viva exam questions and concise answers for college presentations.
