def allow_all_users_rule(user):
    """
    JWT authentication rule: only allow active users to obtain tokens.
    Previously returned True for ALL users (including inactive/suspended),
    which meant blocked users could still get valid JWTs.
    """
    return user is not None and user.is_active
