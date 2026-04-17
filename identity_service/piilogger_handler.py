import logging
import requests
import threading
import traceback
import sys
import os

class PiiloggerHandler(logging.Handler):
    def __init__(self, service_name):
        super().__init__()
        self.service_name = service_name
        # Fallback to local URL if not provided in environment
        self.url = os.getenv('PIILOGGER_URL', 'https://piilogger-service.onrender.com/logs')

    def emit(self, record):
        try:
            # Format the log message
            log_entry = self.format(record)
            
            # Include traceback if an exception occurred
            if record.exc_info:
                log_entry += '\n' + ''.join(traceback.format_exception(*record.exc_info))

            payload = {
                "service": self.service_name,
                "level": record.levelname,
                "message": log_entry
            }
            
            # Send log asynchronously so it doesn't block the Django request cycle
            def send_log():
                try:
                    requests.post(self.url, json=payload, timeout=2)
                except Exception:
                    pass # Fail silently if piilogger is down

            threading.Thread(target=send_log, daemon=True).start()
        except Exception:
            self.handleError(record)
