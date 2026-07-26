import json

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.db import models


def _get_fernet():
    key = settings.FIELD_ENCRYPTION_KEY
    if isinstance(key, (list, tuple)):
        key = key[0]
    return Fernet(key.encode() if isinstance(key, str) else key)


class EncryptedJSONField(models.TextField):
    """
    TextField that transparently Fernet-encrypts JSON data using FIELD_ENCRYPTION_KEY.
    Ciphertext is stored as base64 text; the database never sees plaintext PII.
    """

    def from_db_value(self, value, expression, connection):
        if value is None:
            return None
        return json.loads(_get_fernet().decrypt(value.encode()).decode())

    def get_prep_value(self, value):
        if value is None:
            return None
        if isinstance(value, str):
            # Django may prepare an already-encrypted value more than once
            # during migrations or bulk operations. Only bypass encryption when
            # the value is verifiably a Fernet token; arbitrary strings must
            # never be written to this PII column as plaintext.
            try:
                _get_fernet().decrypt(value.encode())
            except (InvalidToken, TypeError, ValueError):
                pass
            else:
                return value
        return _get_fernet().encrypt(json.dumps(value, ensure_ascii=False).encode()).decode()

    def to_python(self, value):
        if isinstance(value, (dict, list)):
            return value
        if value is None:
            return None
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return value
