#!/bin/sh
exec celery -A backend worker -l info
