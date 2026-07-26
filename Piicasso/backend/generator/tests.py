from django.test import SimpleTestCase

from generator.fields import EncryptedJSONField


class EncryptedJSONFieldTests(SimpleTestCase):
    def setUp(self):
        self.field = EncryptedJSONField()

    def test_plain_string_is_never_stored_verbatim(self):
        prepared = self.field.get_prep_value("sensitive-value")

        self.assertNotEqual(prepared, "sensitive-value")
        self.assertEqual(self.field.from_db_value(prepared, None, None), "sensitive-value")

    def test_verified_ciphertext_is_not_double_encrypted(self):
        prepared = self.field.get_prep_value({"email": "person@example.com"})

        self.assertEqual(self.field.get_prep_value(prepared), prepared)
        self.assertEqual(
            self.field.from_db_value(prepared, None, None),
            {"email": "person@example.com"},
        )
