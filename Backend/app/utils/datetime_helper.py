from datetime import datetime, timezone

def utc_now():
    """
    Returns current naive UTC datetime for MySQL compatibility without deprecation warning.
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)
