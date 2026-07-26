# Aligns the PasswordAnalysis.pii_data column with the EncryptedJSONField model
# definition. The original migration created the column as JSONField which
# enforces a JSON_VALID CHECK on SQLite/Postgres — incompatible with the Fernet
# ciphertext (plain base64 text) that the model writes at runtime.

from django.db import migrations

import generator.fields


def encrypt_existing_pii_data(apps, schema_editor):
    """Encrypt pre-existing JSON values after the column becomes text."""
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


def decrypt_existing_pii_data(apps, schema_editor):
    """Restore plaintext JSON before the field is changed back to JSONField."""
    from cryptography.fernet import Fernet, InvalidToken
    from django.conf import settings

    fek = settings.FIELD_ENCRYPTION_KEY
    if isinstance(fek, (list, tuple)):
        fek = fek[0]
    fernet = Fernet(fek.encode() if isinstance(fek, str) else fek)

    with schema_editor.connection.cursor() as cursor:
        cursor.execute("SELECT id, pii_data FROM password_security_passwordanalysis")
        rows = cursor.fetchall()
        for row_id, encrypted in rows:
            if encrypted is None:
                continue
            try:
                plaintext = fernet.decrypt(encrypted.encode()).decode()
            except (InvalidToken, AttributeError):
                continue
            cursor.execute(
                "UPDATE password_security_passwordanalysis SET pii_data = %s WHERE id = %s",
                [plaintext, row_id],
            )


class Migration(migrations.Migration):
    dependencies = [
        ("password_security", "0002_passwordauditlog"),
    ]

    operations = [
        migrations.AlterField(
            model_name="passwordanalysis",
            name="pii_data",
            field=generator.fields.EncryptedJSONField(blank=True, null=True),
        ),
        migrations.RunPython(encrypt_existing_pii_data, decrypt_existing_pii_data),
    ]
