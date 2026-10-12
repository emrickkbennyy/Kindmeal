"""
KindMeal Database Management Module
Handles SQLite schema, connection management, transactional allocation,
and persistent seed records.

Database file: backend/kindmeal.db
"""

import os
import sqlite3
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

def get_default_db_path() -> str:
    # On Vercel and AWS Lambda serverless runtimes, only /tmp is writable
    if os.environ.get('VERCEL') or os.environ.get('AWS_LAMBDA_FUNCTION_NAME'):
        return os.path.join('/tmp', 'kindmeal.db')
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), 'kindmeal.db')


DB_PATH = get_default_db_path()


class InsufficientStockError(Exception):
    """Raised when donor inventory is less than the requested allocation quantity."""
    pass


class RequestAlreadyProcessedError(Exception):
    """Raised when trying to allocate a request that is not in pending status."""
    pass


class DonorNotFoundError(Exception):
    """Raised when the donor referenced by a request does not exist."""
    pass


def get_db_connection(db_path: str = DB_PATH) -> sqlite3.Connection:
    """
    Create and return a SQLite connection with foreign key enforcement
    and dict-like row factory.
    """
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: str = DB_PATH) -> None:
    """
    Initialize SQLite schema and seed demo records only if tables are new/empty.
    Preserves existing data across normal server restarts.
    """
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = get_db_connection(db_path)
    try:
        cursor = conn.cursor()

        # 1. DONORS TABLE
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS donors (
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
        """)

        # 2. REQUESTS TABLE (Strict sequence for FIFO tie-breaking)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS requests (
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
        """)

        # 3. ALLOCATIONS TABLE (Completed History)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS allocations (
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
        """)

        conn.commit()

        # Seed initial records ONLY if donors table is empty
        cursor.execute("SELECT COUNT(*) FROM donors;")
        if cursor.fetchone()[0] == 0:
            seed_initial_data(conn)

    finally:
        conn.close()


def seed_initial_data(conn: sqlite3.Connection) -> None:
    """
    Populate the 6 standard donors and 4 initial pending demo requests.
    Matches the original initialData.js records exactly.
    """
    cursor = conn.cursor()

    donors_data = [
        (
            'listing-1', 'MCC Community Canteen', 'Cooked Meals',
            'Freshly prepared vegetarian meals, packed and ready for pickup in eco-friendly warm containers.',
            100, 'meals', 'Chennai', 'Pickup before 2:00 PM',
            'Pure Vegetarian · Nutritionally Balanced', 'Cooked 45 mins ago', 'Hot Meals'
        ),
        (
            'listing-2', 'FreshBite Bakery', 'Bakery Items',
            'Fresh bakery items from today\'s surplus, including artisanal loaves, rolls, and packaged buns.',
            60, 'packs', 'Avadi', 'Pickup before 5:00 PM',
            'Eggless Varieties · Sealed Packs', 'Baked Fresh Morning', 'Baked Goods'
        ),
        (
            'listing-3', 'Green Leaf Restaurant', 'Packaged Meals',
            'Nutritious balanced packaged meal boxes from our lunch catering service, ready for immediate handover.',
            80, 'meals', 'Chennai', 'Pickup before 3:30 PM',
            'Rice, Lentils, Veggies · Sealed', 'Packed at 12:15 PM', 'Lunch Boxes'
        ),
        (
            'listing-4', 'Annapoorna Kitchens', 'Cooked Meals',
            'Wholesome hot South Indian meals with sambar rice, vegetable curry, and freshly pressed chapatis.',
            75, 'meals', 'Chennai', 'Pickup before 4:00 PM',
            'Pure Vegetarian · Ready to Eat', 'Cooked 30 mins ago', 'Hot Meals'
        ),
        (
            'listing-5', 'Golden Crust Bakes', 'Bakery Items',
            'Surplus whole wheat sandwich breads, milk buns, and evening snack biscuits in protective wraps.',
            45, 'packs', 'Avadi', 'Pickup before 6:00 PM',
            '100% Vegetarian · Fresh Stock', 'Baked Today', 'Baked Goods'
        ),
        (
            'listing-6', 'Sunrise Catering', 'Packaged Meals',
            'Portioned corporate lunch boxes with vegetable biryani, raita, and seasonal steamed vegetables.',
            50, 'meals', 'Chennai', 'Pickup before 5:30 PM',
            'Sealed Containers · Insulated', 'Packed 1 hr ago', 'Bento Packs'
        )
    ]

    cursor.executemany("""
        INSERT INTO donors (
            donor_id, donor_name, food_category, food_description,
            available_quantity, unit, location, pickup_deadline,
            dietary, prep_time, type_badge
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, donors_data)

    # Initial demonstration requests from initialData.js
    requests_data = [
        (
            'req-1', 'Agaram Foundations', 'listing-1', 20,
            'Sister Theresa', 'NGO / Community Partner', '11:49 AM', 'pending'
        ),
        (
            'req-2', 'Asir Ilam Foundations', 'listing-4', 75,
            'David Kumar', 'NGO / Community Partner', '11:50 AM', 'pending'
        ),
        (
            'req-3', 'Care Foundation', 'listing-2', 30,
            'Ananya Sharma', 'NGO / Community Partner', '11:54 AM', 'pending'
        ),
        (
            'req-4', 'Help Foundation', 'listing-3', 25,
            'Ravi Verma', 'NGO / Community Partner', '11:58 AM', 'pending'
        )
    ]

    cursor.executemany("""
        INSERT INTO requests (
            request_id, ngo_name, donor_id, requested_quantity,
            contact_person, target_beneficiary, request_timestamp, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    """, requests_data)

    conn.commit()


def reset_database_to_demo(db_path: str = DB_PATH) -> None:
    """
    Explicitly reset database tables back to the clean demo state.
    Used for live demonstrations and testing viva workflows.
    """
    conn = get_db_connection(db_path)
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM allocations;")
        cursor.execute("DELETE FROM requests;")
        cursor.execute("DELETE FROM donors;")
        conn.commit()
        seed_initial_data(conn)
    finally:
        conn.close()


def get_all_donors(db_path: str = DB_PATH) -> List[Dict[str, Any]]:
    """Retrieve all donors ordered by donor ID."""
    conn = get_db_connection(db_path)
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM donors ORDER BY donor_id ASC;")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def get_donor_by_id(donor_id: str, db_path: str = DB_PATH) -> Optional[Dict[str, Any]]:
    """Retrieve a single donor by donor_id."""
    conn = get_db_connection(db_path)
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM donors WHERE donor_id = ?;", (donor_id,))
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def get_pending_requests(db_path: str = DB_PATH) -> List[Dict[str, Any]]:
    """
    Retrieve all pending requests in strict FIFO order (by queue_sequence ASC).
    Joins donor details so the frontend has complete donor metadata.
    """
    conn = get_db_connection(db_path)
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                r.queue_sequence,
                r.request_id,
                r.ngo_name,
                r.donor_id,
                r.requested_quantity,
                r.contact_person,
                r.target_beneficiary,
                r.request_timestamp,
                r.status,
                d.donor_name,
                d.food_category,
                d.unit,
                d.available_quantity as donor_available_quantity,
                d.location as donor_location
            FROM requests r
            JOIN donors d ON r.donor_id = d.donor_id
            WHERE r.status = 'pending'
            ORDER BY r.queue_sequence ASC;
        """)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def create_request(
    ngo_name: str,
    donor_id: str,
    requested_quantity: int,
    request_timestamp: str,
    contact_person: str = 'Volunteer Lead',
    target_beneficiary: str = 'NGO / Community Partner',
    db_path: str = DB_PATH
) -> Dict[str, Any]:
    """
    Create a new request in SQLite. Validates donor existence and stock.
    Does NOT deduct inventory at submission time.
    """
    conn = get_db_connection(db_path)
    try:
        cursor = conn.cursor()

        # Validate donor
        cursor.execute("SELECT * FROM donors WHERE donor_id = ?;", (donor_id,))
        donor = cursor.fetchone()
        if not donor:
            raise DonorNotFoundError(f"Donor with ID '{donor_id}' does not exist.")

        if requested_quantity <= 0:
            raise ValueError("Requested quantity must be greater than zero.")

        if requested_quantity > donor['available_quantity']:
            raise ValueError(
                f"Requested quantity ({requested_quantity}) exceeds available donor stock ({donor['available_quantity']})."
            )

        req_id = f"req-{int(datetime.now().timestamp() * 1000)}"

        cursor.execute("""
            INSERT INTO requests (
                request_id, ngo_name, donor_id, requested_quantity,
                contact_person, target_beneficiary, request_timestamp, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending');
        """, (
            req_id, ngo_name.strip(), donor_id, requested_quantity,
            contact_person, target_beneficiary, request_timestamp
        ))
        conn.commit()

        # Fetch inserted record with joined donor info
        cursor.execute("""
            SELECT 
                r.queue_sequence,
                r.request_id,
                r.ngo_name,
                r.donor_id,
                r.requested_quantity,
                r.contact_person,
                r.target_beneficiary,
                r.request_timestamp,
                r.status,
                d.donor_name,
                d.food_category,
                d.unit,
                d.available_quantity as donor_available_quantity,
                d.location as donor_location
            FROM requests r
            JOIN donors d ON r.donor_id = d.donor_id
            WHERE r.request_id = ?;
        """, (req_id,))
        new_row = cursor.fetchone()
        return dict(new_row)
    finally:
        conn.close()


def execute_allocation_transaction(
    request_id: str,
    db_path: str = DB_PATH
) -> Dict[str, Any]:
    """
    Execute atomic allocation of a pending request within a database transaction.
    
    Guarantees:
    1. Only pending requests can be allocated (prevents double allocation).
    2. Validates donor stock right before deduction.
    3. If stock is insufficient, raises InsufficientStockError and rolls back.
    4. Updates inventory exclusively for the targeted donor.
    5. Records allocation history.
    6. All changes commit atomically, or roll back completely on failure.
    """
    conn = get_db_connection(db_path)
    try:
        conn.isolation_level = None  # Explicit transaction control
        cursor = conn.cursor()
        cursor.execute("BEGIN IMMEDIATE;")

        # 1. Fetch request under lock
        cursor.execute("""
            SELECT request_id, ngo_name, donor_id, requested_quantity, status
            FROM requests
            WHERE request_id = ?;
        """, (request_id,))
        req = cursor.fetchone()

        if not req:
            cursor.execute("ROLLBACK;")
            raise ValueError(f"Request '{request_id}' not found.")

        if req['status'] != 'pending':
            cursor.execute("ROLLBACK;")
            raise RequestAlreadyProcessedError(
                f"Request '{request_id}' has already been processed (status: {req['status']})."
            )

        donor_id = req['donor_id']
        requested_qty = req['requested_quantity']

        # 2. Check donor stock
        cursor.execute("""
            SELECT donor_id, donor_name, food_category, available_quantity, unit
            FROM donors
            WHERE donor_id = ?;
        """, (donor_id,))
        donor = cursor.fetchone()

        if not donor:
            cursor.execute("ROLLBACK;")
            raise DonorNotFoundError(f"Donor '{donor_id}' not found.")

        if donor['available_quantity'] < requested_qty:
            cursor.execute("ROLLBACK;")
            raise InsufficientStockError(
                f"Insufficient stock at {donor['donor_name']}. "
                f"Requested {requested_qty} {donor['unit']}, but only {donor['available_quantity']} remain."
            )

        # 3. Deduct donor inventory
        new_quantity = donor['available_quantity'] - requested_qty
        cursor.execute("""
            UPDATE donors
            SET available_quantity = ?
            WHERE donor_id = ?;
        """, (new_quantity, donor_id))

        # 4. Mark request as completed
        cursor.execute("""
            UPDATE requests
            SET status = 'completed'
            WHERE request_id = ?;
        """, (request_id,))

        # 5. Insert allocation record
        allocation_id = f"alloc-{uuid.uuid4().hex[:8]}"
        alloc_timestamp = datetime.now().strftime("%I:%M %p")

        cursor.execute("""
            INSERT INTO allocations (
                allocation_id, request_id, donor_id, ngo_name,
                allocated_quantity, allocation_timestamp
            ) VALUES (?, ?, ?, ?, ?, ?);
        """, (
            allocation_id, request_id, donor_id, req['ngo_name'],
            requested_qty, alloc_timestamp
        ))

        cursor.execute("COMMIT;")

        return {
            'allocation_id': allocation_id,
            'request_id': request_id,
            'ngo_name': req['ngo_name'],
            'donor_id': donor_id,
            'donor_name': donor['donor_name'],
            'food_category': donor['food_category'],
            'allocated_quantity': requested_qty,
            'unit': donor['unit'],
            'remaining_donor_quantity': new_quantity,
            'allocation_timestamp': alloc_timestamp
        }

    except Exception:
        try:
            conn.execute("ROLLBACK;")
        except Exception:
            pass
        raise
    finally:
        conn.close()


def get_allocations_history(db_path: str = DB_PATH) -> List[Dict[str, Any]]:
    """Retrieve recent completed allocations ordered by most recent first."""
    conn = get_db_connection(db_path)
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                a.allocation_id,
                a.request_id,
                a.donor_id,
                a.ngo_name,
                a.allocated_quantity,
                a.allocation_timestamp,
                a.created_at,
                d.donor_name,
                d.food_category,
                d.unit
            FROM allocations a
            JOIN donors d ON a.donor_id = d.donor_id
            ORDER BY a.created_at DESC;
        """)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def get_dashboard_statistics(db_path: str = DB_PATH) -> Dict[str, Any]:
    """
    Calculate summary metrics directly from SQLite.
    Includes unit-differentiated inventory counts to prevent confusing mixed aggregations.
    """
    conn = get_db_connection(db_path)
    try:
        cursor = conn.cursor()

        # Total available inventory grouped by unit
        cursor.execute("""
            SELECT unit, SUM(available_quantity) as total_qty
            FROM donors
            GROUP BY unit;
        """)
        unit_totals = {row['unit']: row['total_qty'] for row in cursor.fetchall()}

        # Total available meals specifically (for legacy single-metric display if needed)
        cursor.execute("""
            SELECT SUM(available_quantity)
            FROM donors
            WHERE unit = 'meals';
        """)
        total_meals = cursor.fetchone()[0] or 0

        # Total available packs specifically
        cursor.execute("""
            SELECT SUM(available_quantity)
            FROM donors
            WHERE unit = 'packs';
        """)
        total_packs = cursor.fetchone()[0] or 0

        # Pending count
        cursor.execute("SELECT COUNT(*) FROM requests WHERE status = 'pending';")
        pending_count = cursor.fetchone()[0] or 0

        # Completed allocations count
        cursor.execute("SELECT COUNT(*) FROM allocations;")
        allocations_count = cursor.fetchone()[0] or 0

        # Total food allocated grouped by unit
        cursor.execute("""
            SELECT d.unit, SUM(a.allocated_quantity) as total_alloc
            FROM allocations a
            JOIN donors d ON a.donor_id = d.donor_id
            GROUP BY d.unit;
        """)
        allocated_by_unit = {row['unit']: row['total_alloc'] for row in cursor.fetchall()}

        return {
            'pending_requests_count': pending_count,
            'completed_allocations_count': allocations_count,
            'available_meals': total_meals,
            'available_packs': total_packs,
            'unit_totals': unit_totals,
            'allocated_by_unit': allocated_by_unit
        }
    finally:
        conn.close()
