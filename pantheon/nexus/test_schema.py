from django.test import SimpleTestCase
from drf_spectacular.generators import SchemaGenerator


class OpenAPIContractTests(SimpleTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.schema = SchemaGenerator().get_schema(request=None, public=True)

    @staticmethod
    def _json_schema(operation, status_code):
        return operation["responses"][str(status_code)]["content"]["application/json"]["schema"]

    def test_representative_routes_are_documented(self):
        paths = self.schema["paths"]

        for path in (
            "/api/submit/",
            "/api/user/token/",
            "/api/operations/financial-risk/",
            "/api/operations/messages/{id}/",
            "/api/teams/chat/",
        ):
            self.assertIn(path, paths)

    def test_login_and_generation_bodies_are_typed(self):
        paths = self.schema["paths"]
        login = paths["/api/user/token/"]["post"]
        submit = paths["/api/submit/"]["post"]

        self.assertEqual(
            login["requestBody"]["content"]["application/json"]["schema"]["$ref"],
            "#/components/schemas/PasswordLoginRequestRequest",
        )
        self.assertEqual(
            self._json_schema(login, 200)["$ref"],
            "#/components/schemas/TokenPairResponse",
        )
        self.assertEqual(
            submit["requestBody"]["content"]["application/json"]["schema"]["$ref"],
            "#/components/schemas/PiiserializerRequest",
        )
        self.assertEqual(
            self._json_schema(submit, 201)["$ref"],
            "#/components/schemas/PiiSubmitResponse",
        )
        self.assertIs(
            self.schema["components"]["schemas"]["PiiserializerRequest"]["additionalProperties"],
            False,
        )
        self.assertEqual(
            self.schema["components"]["schemas"]["PiiserializerRequest"]["properties"]["full_name"]["maxLength"],
            256,
        )

    def test_financial_risk_response_and_message_id_are_typed(self):
        paths = self.schema["paths"]
        risk = paths["/api/operations/financial-risk/"]["get"]
        message = paths["/api/operations/messages/{id}/"]["get"]

        self.assertEqual(
            self._json_schema(risk, 200)["$ref"],
            "#/components/schemas/FinancialRiskResponse",
        )
        id_parameter = next(parameter for parameter in message["parameters"] if parameter["name"] == "id")
        self.assertEqual(id_parameter["schema"]["type"], "integer")
        self.assertTrue(id_parameter["required"])

    def test_token_download_documents_query_parameter_and_binary_media(self):
        download = self.schema["paths"]["/api/file/{file_type}/{id}/"]["get"]
        token_parameter = next(parameter for parameter in download["parameters"] if parameter["name"] == "token")
        content = download["responses"]["200"]["content"]

        self.assertEqual(token_parameter["in"], "query")
        self.assertTrue(token_parameter["required"])
        self.assertEqual(content["text/plain"]["schema"], {"type": "string", "format": "binary"})
        self.assertEqual(content["application/pdf"]["schema"], {"type": "string", "format": "binary"})
