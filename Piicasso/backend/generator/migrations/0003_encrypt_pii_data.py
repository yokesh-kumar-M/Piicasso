"""
Migration: encrypt pii_data at rest.

Operation order matters:
  1. AlterField  — changes the DB column from jsonb → text (PostgreSQL casts
                   existing jsonb values to their text representation, i.e.
                   plain JSON strings).  SQLite already stores JSONField as
                   text, so the column type is unchanged there.
  2. RunPython   — reads each row's plain JSON string via raw SQL (deliberately
                   bypassing the ORM so the decryption path is never triggered
                   on pre-migration plaintext), encrypts it with Fernet, and
                   writes the ciphertext back.

Reverse migration: noop — encrypted rows cannot be trivially reversed to the
original jsonb format without the encryption key and a custom data step.
"""

from django.db import migrations

from generator.fields import EncryptedJSONField


def encrypt_existing_pii_data(apps, schema_editor):
    from cryptography.fernet import Fernet
    from django.conf import settings

    fek = settings.FIELD_ENCRYPTION_KEY
    if isinstance(fek, (list, tuple)):
        fek = fek[0]
    fernet = Fernet(fek.encode() if isinstance(fek, str) else fek)

    # Raw SQL: the ORM would try to decrypt values that are still plaintext.
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            "SELECT id, pii_data FROM generator_generationhistory"
        )
        rows = cursor.fetchall()
        for row_id, plaintext in rows:
            if plaintext is not None:
                encrypted = fernet.encrypt(plaintext.encode()).decode()
                cursor.execute(
                    "UPDATE generator_generationhistory"
                    " SET pii_data = %s WHERE id = %s",
                    [encrypted, row_id],
                )


class Migration(migrations.Migration):

    dependencies = [
        ("generator", "0002_generationhistory_wordlist_count_and_more"),
    ]

    operations = [
        # Step 1: change column type (jsonb → text in Postgres; no-op in SQLite)
        migrations.AlterField(
            model_name="generationhistory",
            name="pii_data",
            field=EncryptedJSONField(),
        ),
        # Step 2: encrypt the now-plaintext rows in place
        migrations.RunPython(
            encrypt_existing_pii_data,
            migrations.RunPython.noop,
        ),
    ]
