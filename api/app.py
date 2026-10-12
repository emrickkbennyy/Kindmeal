"""
KindMeal Flask REST API
Academic Module: Community Food Rescue and FIFO Allocation System

Architecture:
- Flask REST API exposing endpoints to React frontend
- Synchronized with Python FIFOQueue (collections.deque)
- Authoritative persistence in SQLite (backend/kindmeal.db)
"""

import os
from flask import Flask, jsonify, request
from flask_cors import CORS

try:
    from database import (
        DB_PATH,
        DonorNotFoundError,
        InsufficientStockError,
        RequestAlreadyProcessedError,
        create_request,
        execute_allocation_transaction,
        get_all_donors,
        get_allocations_history,
        get_dashboard_statistics,
        get_donor_by_id,
        get_pending_requests,
        init_db,
        reset_database_to_demo
    )
    from queue_manager import FIFOQueue
except ImportError:
    from backend.database import (
        DB_PATH,
        DonorNotFoundError,
        InsufficientStockError,
        RequestAlreadyProcessedError,
        create_request,
        execute_allocation_transaction,
        get_all_donors,
        get_allocations_history,
        get_dashboard_statistics,
        get_donor_by_id,
        get_pending_requests,
        init_db,
        reset_database_to_demo
    )
    from backend.queue_manager import FIFOQueue

app = Flask(__name__)
# Enable CORS for local Vite development and production Vercel deployment
CORS(app, resources={r"/*": {"origins": "*"}})

# Global in-memory FIFO Queue instance
# Strict FIFO discipline: FRONT is served first, new arrivals enter at REAR.
fifo_queue = FIFOQueue()


def sync_queue_from_db(db_path: str = DB_PATH) -> None:
    """
    Hydrate the in-memory FIFO queue from SQLite pending requests.
    Guarantees queue state survives backend restarts and browser refreshes.
    SQLite is the authoritative source of truth.
    """
    fifo_queue.clear()
    pending = get_pending_requests(db_path)
    for req in pending:
        fifo_queue.enqueue(req)


# Initialize DB schema and hydrate queue on startup
init_db(DB_PATH)
sync_queue_from_db(DB_PATH)


@app.route('/', methods=['GET'])
def root_index():
    """Root status endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'KindMeal Food Rescue API',
        'endpoints': '/api/health, /api/donors, /api/queue, /api/requests, /api/allocations'
    }), 200


@app.route('/api/health', methods=['GET'])
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify backend status."""
    return jsonify({
        'status': 'healthy',
        'service': 'KindMeal Food Rescue API',
        'queue_size': fifo_queue.size(),
        'database': 'SQLite connected'
    }), 200


@app.route('/api/donors', methods=['GET'])
@app.route('/donors', methods=['GET'])
def list_donors():
    """Retrieve all food donors and their current inventory."""
    donors = get_all_donors(DB_PATH)
    return jsonify({
        'success': True,
        'count': len(donors),
        'donors': donors
    }), 200


@app.route('/api/donors/<donor_id>', methods=['GET'])
@app.route('/donors/<donor_id>', methods=['GET'])
def get_donor(donor_id):
    """Retrieve details for a single donor."""
    donor = get_donor_by_id(donor_id, DB_PATH)
    if not donor:
        return jsonify({'success': False, 'error': f"Donor '{donor_id}' not found."}), 404
    return jsonify({'success': True, 'donor': donor}), 200


@app.route('/api/queue', methods=['GET'])
@app.route('/queue', methods=['GET'])
def get_queue():
    """
    Get all pending requests currently in the FIFO queue.
    Returns queue with FRONT and REAR indicators.
    """
    sync_queue_from_db(DB_PATH)
    items = fifo_queue.to_list()
    return jsonify({
        'success': True,
        'size': len(items),
        'is_empty': fifo_queue.is_empty(),
        'front': fifo_queue.peek(),
        'rear': fifo_queue.peek_rear(),
        'queue': items
    }), 200


@app.route('/api/queue/front', methods=['GET'])
@app.route('/queue/front', methods=['GET'])
def get_queue_front():
    """Peek the FRONT item of the FIFO queue without dequeuing."""
    sync_queue_from_db(DB_PATH)
    front_item = fifo_queue.peek()
    return jsonify({
        'success': True,
        'has_front': front_item is not None,
        'front': front_item
    }), 200


@app.route('/api/requests', methods=['POST'])
@app.route('/requests', methods=['POST'])
def submit_request():
    """
    Submit a new food rescue request from an NGO.
    
    Workflow:
    1. Validate required fields in payload.
    2. Validate quantity > 0.
    3. Validate donor existence and donor stock.
    4. Save to SQLite requests table (status='pending').
    5. Append to in-memory FIFO queue at REAR.
    6. Return newly enqueued request with queue position.
    """
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'Invalid JSON request body.'}), 400

    ngo_name = data.get('ngo_name')
    donor_id = data.get('donor_id')
    requested_quantity = data.get('requested_quantity')
    request_timestamp = data.get('request_timestamp')
    contact_person = data.get('contact_person', 'Volunteer Lead')
    target_beneficiary = data.get('target_beneficiary', 'NGO / Community Partner')

    if not ngo_name or not str(ngo_name).strip():
        return jsonify({'success': False, 'error': 'Organization / NGO name is required.'}), 400

    if not donor_id:
        return jsonify({'success': False, 'error': 'Selected food donor is required.'}), 400

    try:
        requested_quantity = int(requested_quantity)
    except (ValueError, TypeError):
        return jsonify({'success': False, 'error': 'Requested quantity must be a valid integer.'}), 400

    if requested_quantity <= 0:
        return jsonify({'success': False, 'error': 'Requested quantity must be greater than zero.'}), 400

    if not request_timestamp:
        from datetime import datetime
        request_timestamp = datetime.now().strftime("%I:%M %p")

    try:
        new_request = create_request(
            ngo_name=ngo_name,
            donor_id=donor_id,
            requested_quantity=requested_quantity,
            request_timestamp=request_timestamp,
            contact_person=contact_person,
            target_beneficiary=target_beneficiary,
            db_path=DB_PATH
        )

        # Enqueue to runtime FIFO Queue at REAR
        fifo_queue.enqueue(new_request)

        return jsonify({
            'success': True,
            'message': f"Request for {ngo_name} added to the rescue queue.",
            'position': fifo_queue.size(),
            'request': new_request
        }), 201

    except DonorNotFoundError as e:
        return jsonify({'success': False, 'error': str(e)}), 404
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': f"Failed to save request: {str(e)}"}), 500


@app.route('/api/queue/process', methods=['POST'])
@app.route('/queue/process', methods=['POST'])
def process_front_request():
    """
    Process the FRONT request of the FIFO Queue.
    
    Academic Rule:
    - The backend deterministically processes ONLY the FRONT request.
    - The frontend cannot choose an arbitrary request to allocate.
    - Strict First-In, First-Out order is maintained.
    - If donor inventory is insufficient, the request is preserved in the queue
      and an informative error is returned.
    """
    sync_queue_from_db(DB_PATH)
    if fifo_queue.is_empty():
        return jsonify({
            'success': False,
            'error': 'Queue is empty. No pending requests to process.'
        }), 400

    # 1. Peek FRONT request
    front_item = fifo_queue.peek()
    request_id = front_item['request_id']

    try:
        # 2. Execute transactional allocation in SQLite
        allocation_result = execute_allocation_transaction(request_id, DB_PATH)

        # 3. On database commit success, remove FRONT from FIFO queue
        dequeued_item = fifo_queue.dequeue()

        # 4. Fetch updated donors and dashboard stats
        updated_donors = get_all_donors(DB_PATH)
        stats = get_dashboard_statistics(DB_PATH)

        return jsonify({
            'success': True,
            'message': f"Request for {dequeued_item['ngo_name']} successfully fulfilled.",
            'allocation': allocation_result,
            'dequeued_request': dequeued_item,
            'remaining_queue_size': fifo_queue.size(),
            'next_front': fifo_queue.peek(),
            'updated_donors': updated_donors,
            'dashboard_stats': stats
        }), 200

    except InsufficientStockError as e:
        # Request remains in queue at FRONT. Order is preserved.
        return jsonify({
            'success': False,
            'error_type': 'INSUFFICIENT_STOCK',
            'error': str(e),
            'front_preserved': True
        }), 400

    except RequestAlreadyProcessedError as e:
        # Out-of-sync guard: refresh in-memory queue from SQLite
        sync_queue_from_db(DB_PATH)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 409

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f"Allocation transaction failed: {str(e)}"
        }), 500


@app.route('/api/allocations', methods=['GET'])
@app.route('/allocations', methods=['GET'])
def list_allocations():
    """Retrieve history of completed allocations."""
    history = get_allocations_history(DB_PATH)
    return jsonify({
        'success': True,
        'count': len(history),
        'allocations': history
    }), 200


@app.route('/api/dashboard/stats', methods=['GET'])
@app.route('/dashboard/stats', methods=['GET'])
def get_stats():
    """Retrieve live platform statistics directly from SQLite."""
    stats = get_dashboard_statistics(DB_PATH)
    return jsonify({
        'success': True,
        'stats': stats
    }), 200


@app.route('/api/demo/reset', methods=['POST'])
@app.route('/demo/reset', methods=['POST'])
def reset_demo():
    """
    Reset SQLite database to the clean initial demo state and
    re-sync the in-memory FIFO queue.
    """
    reset_database_to_demo(DB_PATH)
    sync_queue_from_db(DB_PATH)
    return jsonify({
        'success': True,
        'message': 'Demonstration state reset successfully.',
        'queue_size': fifo_queue.size(),
        'donors': get_all_donors(DB_PATH),
        'stats': get_dashboard_statistics(DB_PATH)
    }), 200


if __name__ == '__main__':
    # Run Flask on local port 5000
    print("KindMeal Flask API running on http://127.0.0.1:5000")
    app.run(host='127.0.0.1', port=5000, debug=True)
