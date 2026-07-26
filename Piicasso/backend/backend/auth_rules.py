def allow_all_users_rule(user):
    """
    JWT authentication rule: only active users can obtain tokens.
    Name kept for backward compatibility with settings reference.
    """
    return user is not None and user.is_active
