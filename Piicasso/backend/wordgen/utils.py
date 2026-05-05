def safe_float(val, default=999.0):
    try:
        return float(val) if val is not None and val != "" else default
    except (ValueError, TypeError):
        return default
