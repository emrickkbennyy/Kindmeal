import os
import sys

# Ensure current directory and root are in Python path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)
for path in [CURRENT_DIR, ROOT_DIR]:
    if path not in sys.path:
        sys.path.insert(0, path)

try:
    from app import app, init_db, sync_queue_from_db, DB_PATH
except ImportError:
    from backend.app import app, init_db, sync_queue_from_db, DB_PATH

# Hydrate SQLite tables and FIFO queue when serverless instance starts
try:
    init_db(DB_PATH)
    sync_queue_from_db(DB_PATH)
except Exception as e:
    print(f"Serverless initialization note: {e}")
