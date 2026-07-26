"""Post-processing hooks for constraints OpenAPI cannot infer from DRF."""


def close_strict_request_objects(result, generator, request, public):
    """Mark request serializers that explicitly reject undeclared JSON keys."""
    del generator, request, public
    schemas = result.get("components", {}).get("schemas", {})
    pii_request = schemas.get("PiiserializerRequest")
    if pii_request is not None:
        pii_request["additionalProperties"] = False
        for name, property_schema in pii_request.get("properties", {}).items():
            if name != "pattern_mode" and property_schema.get("type") == "string":
                property_schema["maxLength"] = 256
    return result
