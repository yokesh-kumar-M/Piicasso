"""Repair PII rows left plaintext by the original encrypted-field migration.

Migration 0003 originally altered JSON to text without transforming existing
values. This idempotent repair encrypts only values that are not already valid
Fernet tokens, making it safe for upgraded and freshly installed systems. The
reverse path reapplies the encryption invariant instead of exposing PII.
"""

from django.db import migrations


def encrypt_plaintext_rows(apps, schema_editor):
    import json

    from cryptography.fernet import Fernet, InvalidToken
    from django.conf import settings

    fek = settings.FIELD_ENCRYPTION_KEY
    if isinstance(fek, (list, tuple)):
        fek = fek[0]
    fernet = Fernet(fek.encode() if isinstance(fek, str) else fek)

    with schema_editor.connection.cursor() as cursor:
        cursor.execute("SELECT id, pii_data FROM password_security_passwordanalysis")
        rows = cursor.fetchall()
        for row_id, value in rows:
            if value is None:
                continue
            plaintext = value if isinstance(value, str) else json.dumps(value, ensure_ascii=False)
            try:
                fernet.decrypt(plaintext.encode())
            except InvalidToken:
                encrypted = fernet.encrypt(plaintext.encode()).decode()
                cursor.execute(
                    "UPDATE password_security_passwordanalysis SET pii_data = %s WHERE id = %s",
                    [encrypted, row_id],
                )


class Migration(migrations.Migration):
    dependencies = [
        ("password_security", "0004_alter_passwordanalysis_password_hash_and_more"),
    ]

    operations = [
        migrations.RunPython(encrypt_plaintext_rows, encrypt_plaintext_rows),
    ]
