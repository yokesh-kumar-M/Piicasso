# Aligns the PasswordAnalysis.pii_data column with the EncryptedJSONField model
# definition. The original migration created the column as JSONField which
# enforces a JSON_VALID CHECK on SQLite/Postgres — incompatible with the Fernet
# ciphertext (plain base64 text) that the model writes at runtime.

from django.db import migrations, models

import generator.fields


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
    ]
