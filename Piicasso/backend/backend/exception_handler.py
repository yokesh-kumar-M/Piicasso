"""
Enterprise-grade centralized exception handler for DRF.
Provides consistent error responses with request correlation.
"""
import logging
import traceback

from django.http import Http404
from django.core.exceptions import PermissionDenied as DjangoPermissionDenied, ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.exceptions import (
    APIException,
    AuthenticationFailed,
    NotAuthenticated,
    PermissionDenied,
    Throttled,
    ValidationError,
)
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger('wordgen')


def enterprise_exception_handler(exc, context):
    """
    Custom exception handler that:
    - Returns a consistent JSON envelope for all errors
    - Logs server errors with full traceback
    - Attaches request_id for correlation
    """
    # Let DRF handle the standard exceptions first
    response = exception_handler(exc, context)

    request = context.get('request')
    request_id = getattr(request, 'request_id', 'N/A') if request else 'N/A'

    # ── DRF already handled it ──────────────────────────────────────────────
    if response is not None:
        error_payload = _build_payload(exc, response.status_code, request_id)
        response.data = error_payload
        return response

    # ── Django-native exceptions that DRF doesn't catch ─────────────────────
    if isinstance(exc, Http404):
        return Response(
            _build_payload(exc, 404, request_id, detail='Resource not found.'),
            status=status.HTTP_404_NOT_FOUND,
        )

    if isinstance(exc, DjangoPermissionDenied):
        return Response(
            _build_payload(exc, 403, request_id, detail='Permission denied.'),
            status=status.HTTP_403_FORBIDDEN,
        )

    if isinstance(exc, DjangoValidationError):
        return Response(
            _build_payload(exc, 400, request_id, detail=str(exc)),
            status=status.HTTP_400_BAD_REQUEST,
        )

    # ── Unhandled 500 errors ────────────────────────────────────────────────
    logger.error(
        f"Unhandled exception [request_id={request_id}]: {exc}\n"
        f"{traceback.format_exc()}"
    )

    return Response(
        _build_payload(
            exc, 500, request_id,
            detail='An internal server error occurred. Our team has been notified.',
        ),
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


def _build_payload(exc, status_code, request_id, detail=None):
    """Build a consistent error response envelope."""
    if detail is None:
        if isinstance(exc, Throttled):
            detail = f'Request throttled. Retry after {exc.wait} seconds.'
        elif isinstance(exc, (AuthenticationFailed, NotAuthenticated)):
            detail = str(exc.detail) if hasattr(exc, 'detail') else 'Authentication required.'
        elif isinstance(exc, PermissionDenied):
            detail = str(exc.detail) if hasattr(exc, 'detail') else 'Permission denied.'
        elif isinstance(exc, ValidationError):
            detail = exc.detail if hasattr(exc, 'detail') else str(exc)
        elif isinstance(exc, APIException):
            detail = str(exc.detail) if hasattr(exc, 'detail') else str(exc)
        else:
            detail = str(exc) if status_code < 500 else 'Internal server error.'

    return {
        'error': True,
        'status_code': status_code,
        'detail': detail,
        'request_id': request_id,
    }
