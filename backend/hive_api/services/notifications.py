from __future__ import annotations


def dispatch_notification(message: str, *, channel: str = "shortcut") -> None:
    # Placeholder for future notification backends (Shortcuts, Web Push, etc.)
    print(f"[notification:{channel}] {message}")
