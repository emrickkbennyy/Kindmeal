"""
KindMeal FIFO Queue Manager
Academic Module: Community Food Rescue and FIFO Allocation System

Data Structure: First-In, First-Out (FIFO) Queue
Implementation: collections.deque (Doubly Ended Queue)

FIFO Concept:
- The first element enqueued is the first element dequeued.
- Elements arrive at the REAR (tail) of the queue.
- Elements are serviced from the FRONT (head) of the queue.
- In food rescue, this ensures fairness: the oldest pending NGO request
  is fulfilled before any newer request, preventing favoritism.

Complexity Analysis:
- enqueue(): O(1) time complexity (amortized append to rear)
- dequeue(): O(1) time complexity (popleft from front)
- peek():    O(1) time complexity (direct indexing at front [0])
- is_empty():O(1) time complexity
- size():    O(1) time complexity
"""

from collections import deque
from typing import Any, List, Optional


class FIFOQueue:
    """
    In-memory FIFO Queue data structure for food rescue requests.
    
    This class wraps Python's collections.deque to expose standard
    queue operations with strict First-In, First-Out discipline.
    SQLite remains the persistent source of truth, while this queue
    maintains the runtime dispatch order.
    """

    def __init__(self):
        """Initialize an empty FIFO queue."""
        self._items: deque = deque()

    def enqueue(self, item: Any) -> None:
        """
        Add an item to the REAR (tail) of the queue.
        
        Args:
            item: The request dictionary or object to insert.
            
        Time Complexity: O(1)
        """
        self._items.append(item)

    def dequeue(self) -> Optional[Any]:
        """
        Remove and return the item from the FRONT (head) of the queue.
        
        Returns:
            The front item if the queue is not empty, else None.
            
        Time Complexity: O(1)
        """
        if self.is_empty():
            return None
        return self._items.popleft()

    def peek(self) -> Optional[Any]:
        """
        Inspect the item at the FRONT (head) without removing it.
        
        Returns:
            The front item if available, else None.
            
        Time Complexity: O(1)
        """
        if self.is_empty():
            return None
        return self._items[0]

    def peek_rear(self) -> Optional[Any]:
        """
        Inspect the item at the REAR (tail) without removing it.
        Useful for displaying queue boundaries in the UI.
        
        Time Complexity: O(1)
        """
        if self.is_empty():
            return None
        return self._items[-1]

    def is_empty(self) -> bool:
        """
        Check if the queue has no elements.
        
        Returns:
            True if empty, False otherwise.
            
        Time Complexity: O(1)
        """
        return len(self._items) == 0

    def size(self) -> int:
        """
        Get the current number of elements in the queue.
        
        Returns:
            Count of pending requests.
            
        Time Complexity: O(1)
        """
        return len(self._items)

    def to_list(self) -> List[Any]:
        """
        Return a copy of the items ordered from FRONT to REAR.
        
        Time Complexity: O(n)
        """
        return list(self._items)

    def clear(self) -> None:
        """
        Empty all items from the queue.
        """
        self._items.clear()

    def __len__(self) -> int:
        return self.size()

    def __repr__(self) -> str:
        return f"<FIFOQueue size={self.size()} front={self.peek()}>"
