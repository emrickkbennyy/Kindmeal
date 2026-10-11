"""
KindMeal Backend Test Suite
Automated verification for all 16 core business rules and FIFO queue operations.
Uses an isolated temporary SQLite database for test runs.
"""

import os
import sys
import tempfile
import unittest

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from queue_manager import FIFOQueue
import database
from database import (
    InsufficientStockError,
    RequestAlreadyProcessedError,
    DonorNotFoundError,
    init_db,
    get_all_donors,
    get_donor_by_id,
    get_pending_requests,
    create_request,
    execute_allocation_transaction,
    get_allocations_history,
    get_dashboard_statistics
)


class TestFIFOQueueUnit(unittest.TestCase):
    """Unit tests for the Python FIFOQueue class."""

    def setUp(self):
        self.q = FIFOQueue()

    def test_01_empty_queue_behaviour(self):
        """Test 1: Empty queue returns is_empty=True, size=0, and None on peek/dequeue."""
        self.assertTrue(self.q.is_empty())
        self.assertEqual(self.q.size(), 0)
        self.assertIsNone(self.q.peek())
        self.assertIsNone(self.q.dequeue())
        self.assertIsNone(self.q.peek_rear())

    def test_02_enqueue_operation(self):
        """Test 2: enqueue adds items to the REAR and increases size."""
        self.q.enqueue({'id': 1, 'name': 'First'})
        self.assertFalse(self.q.is_empty())
        self.assertEqual(self.q.size(), 1)
        self.assertEqual(self.q.peek()['name'], 'First')
        self.assertEqual(self.q.peek_rear()['name'], 'First')

    def test_03_peek_operation(self):
        """Test 3: peek returns FRONT item without removing it."""
        self.q.enqueue({'id': 1, 'name': 'First'})
        self.q.enqueue({'id': 2, 'name': 'Second'})
        front = self.q.peek()
        self.assertEqual(front['id'], 1)
        self.assertEqual(self.q.size(), 2, "peek() must not remove items")

    def test_04_dequeue_operation(self):
        """Test 4: dequeue removes and returns the FRONT item."""
        self.q.enqueue({'id': 'A'})
        self.q.enqueue({'id': 'B'})
        removed = self.q.dequeue()
        self.assertEqual(removed['id'], 'A')
        self.assertEqual(self.q.size(), 1)
        self.assertEqual(self.q.peek()['id'], 'B')

    def test_05_correct_fifo_order(self):
        """Test 5: Strict First-In, First-Out order is maintained across multiple items."""
        items = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon']
        for item in items:
            self.q.enqueue(item)

        dequeued_items = []
        while not self.q.is_empty():
            dequeued_items.append(self.q.dequeue())

        self.assertEqual(dequeued_items, items, "Items must dequeue in exact arrival order")


class TestKindMealBusinessRules(unittest.TestCase):
    """Integration tests verifying SQLite persistence, FIFO integrity, and business logic."""

    def setUp(self):
        """Create a dedicated temporary SQLite database for each test method."""
        self.temp_db_fd, self.temp_db_path = tempfile.mkstemp(suffix='.db')
        os.close(self.temp_db_fd)
        init_db(self.temp_db_path)

    def tearDown(self):
        """Clean up temporary test database."""
        if os.path.exists(self.temp_db_path):
            try:
                os.remove(self.temp_db_path)
            except Exception:
                pass

    def test_06_request_creation_and_persistence(self):
        """Test 6: Request creation persists in SQLite with pending status."""
        req = create_request(
            ngo_name="Sunshine Relief",
            donor_id="listing-1",
            requested_quantity=15,
            request_timestamp="02:30 PM",
            db_path=self.temp_db_path
        )
        self.assertEqual(req['ngo_name'], "Sunshine Relief")
        self.assertEqual(req['status'], "pending")
        self.assertEqual(req['requested_quantity'], 15)

        # Confirm persisted in pending list
        pending = get_pending_requests(self.temp_db_path)
        matching = [p for p in pending if p['request_id'] == req['request_id']]
        self.assertEqual(len(matching), 1)

    def test_07_invalid_request_rejection(self):
        """Test 7: Reject invalid (negative or zero) quantities."""
        with self.assertRaises(ValueError):
            create_request("Test NGO", "listing-1", 0, "12:00 PM", db_path=self.temp_db_path)

        with self.assertRaises(ValueError):
            create_request("Test NGO", "listing-1", -10, "12:00 PM", db_path=self.temp_db_path)

    def test_08_unknown_donor_rejection(self):
        """Test 8: Reject request referencing nonexistent donor ID."""
        with self.assertRaises(DonorNotFoundError):
            create_request("Test NGO", "nonexistent-donor-999", 10, "12:00 PM", db_path=self.temp_db_path)

    def test_09_insufficient_stock_rejection(self):
        """Test 9: Reject request or allocation when requested quantity exceeds available donor stock."""
        # Initial listing-1 has 100 available. Requesting 150 must fail at validation.
        with self.assertRaises(ValueError):
            create_request("Greedy NGO", "listing-1", 150, "12:00 PM", db_path=self.temp_db_path)

        # Test transaction rejection when donor stock runs dry later
        conn = database.get_db_connection(self.temp_db_path)
        conn.execute("UPDATE donors SET available_quantity = 5 WHERE donor_id = 'listing-1';")
        conn.commit()
        conn.close()

        # req-1 in seed requests 20 meals from listing-1. Should fail allocation due to stock=5.
        with self.assertRaises(InsufficientStockError):
            execute_allocation_transaction("req-1", db_path=self.temp_db_path)

    def test_10_donor_specific_inventory_deduction(self):
        """Test 10: Allocation deducts inventory ONLY from the specified donor."""
        donor_1_before = get_donor_by_id("listing-1", self.temp_db_path)['available_quantity']
        donor_2_before = get_donor_by_id("listing-2", self.temp_db_path)['available_quantity']

        # req-1 is for 20 meals from listing-1
        result = execute_allocation_transaction("req-1", db_path=self.temp_db_path)
        self.assertEqual(result['allocated_quantity'], 20)

        donor_1_after = get_donor_by_id("listing-1", self.temp_db_path)['available_quantity']
        donor_2_after = get_donor_by_id("listing-2", self.temp_db_path)['available_quantity']

        self.assertEqual(donor_1_after, donor_1_before - 20, "Target donor must decrease by 20")
        self.assertEqual(donor_2_after, donor_2_before, "Unrelated donor must remain completely unchanged")

    def test_11_no_negative_inventory(self):
        """Test 11: Inventory can never become negative."""
        # Attempting to allocate more than stock raises error and prevents negative value
        conn = database.get_db_connection(self.temp_db_path)
        conn.execute("UPDATE donors SET available_quantity = 10 WHERE donor_id = 'listing-1';")
        conn.commit()
        conn.close()

        with self.assertRaises(InsufficientStockError):
            execute_allocation_transaction("req-1", db_path=self.temp_db_path)

        donor = get_donor_by_id("listing-1", self.temp_db_path)
        self.assertGreaterEqual(donor['available_quantity'], 0)

    def test_12_no_double_allocation(self):
        """Test 12: Cannot process the same request twice."""
        # First allocation succeeds
        execute_allocation_transaction("req-1", db_path=self.temp_db_path)

        # Second attempt on req-1 must raise RequestAlreadyProcessedError
        with self.assertRaises(RequestAlreadyProcessedError):
            execute_allocation_transaction("req-1", db_path=self.temp_db_path)

    def test_13_allocation_history_persistence(self):
        """Test 13: Successful allocations are recorded in allocations table with donor details."""
        execute_allocation_transaction("req-1", db_path=self.temp_db_path)

        history = get_allocations_history(self.temp_db_path)
        self.assertGreaterEqual(len(history), 1)
        record = history[0]
        self.assertEqual(record['request_id'], 'req-1')
        self.assertEqual(record['ngo_name'], 'Agaram Foundations')
        self.assertEqual(record['allocated_quantity'], 20)
        self.assertEqual(record['donor_name'], 'MCC Community Canteen')

    def test_14_queue_restoration_after_restart(self):
        """Test 14: Pending queue is restored in exact sequence from SQLite on reboot."""
        # 4 initial pending requests exist: req-1, req-2, req-3, req-4
        rebuilt_queue = FIFOQueue()
        for r in get_pending_requests(self.temp_db_path):
            rebuilt_queue.enqueue(r)

        self.assertEqual(rebuilt_queue.size(), 4)
        self.assertEqual(rebuilt_queue.peek()['request_id'], 'req-1')
        self.assertEqual(rebuilt_queue.peek_rear()['request_id'], 'req-4')

    def test_15_failed_allocation_rollback(self):
        """Test 15: If allocation fails, the entire transaction is rolled back."""
        # Artificially set stock to 5
        conn = database.get_db_connection(self.temp_db_path)
        conn.execute("UPDATE donors SET available_quantity = 5 WHERE donor_id = 'listing-1';")
        conn.commit()
        conn.close()

        try:
            execute_allocation_transaction("req-1", db_path=self.temp_db_path)
        except InsufficientStockError:
            pass

        # Verify req-1 is still 'pending' (not marked completed!)
        pending = get_pending_requests(self.temp_db_path)
        req1 = next((p for p in pending if p['request_id'] == 'req-1'), None)
        self.assertIsNotNone(req1, "Failed request must remain in pending queue")
        self.assertEqual(req1['status'], 'pending')

        # Verify no allocation record was created
        history = get_allocations_history(self.temp_db_path)
        self.assertEqual(len(history), 0)

    def test_16_consistent_request_statuses(self):
        """Test 16: Status transitions correctly from 'pending' to 'completed'."""
        pending_before = get_pending_requests(self.temp_db_path)
        self.assertTrue(any(r['request_id'] == 'req-1' and r['status'] == 'pending' for r in pending_before))

        execute_allocation_transaction("req-1", db_path=self.temp_db_path)

        pending_after = get_pending_requests(self.temp_db_path)
        self.assertFalse(any(r['request_id'] == 'req-1' for r in pending_after))


if __name__ == '__main__':
    unittest.main(verbosity=2)
