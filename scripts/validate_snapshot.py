from __future__ import annotations

import argparse
import json
from pathlib import Path

try:
    from .schemas import Snapshot
except ImportError:
    from schemas import Snapshot


PRIVATE_MARKERS = ["api_key", "oauth_token", "client_confidential", "database_url", "private_key"]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("snapshot")
    args = parser.parse_args()
    path = Path(args.snapshot)
    payload = json.loads(path.read_text(encoding="utf-8"))
    Snapshot.model_validate(payload)
    lowered = json.dumps(payload).lower()
    leaked = [marker for marker in PRIVATE_MARKERS if marker in lowered]
    if leaked:
        raise SystemExit(f"Private markers found in snapshot: {leaked}")
    print(f"Validated {path} with {len(payload['etfs'])} ETFs and {len(payload['tickets'])} tickets.")


if __name__ == "__main__":
    main()
