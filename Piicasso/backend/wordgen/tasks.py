import json
import logging
import hashlib
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from celery import shared_task
from django.core.cache import cache
from .llm_handler import build_prompt, call_gemini_api
from .views import get_rockyou_wordlist
from generator.models import GenerationHistory
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)
User = get_user_model()

@shared_task
def generate_wordlist_task(pii_data, pattern_mode, user_id, cache_key, client_id=None):
    """
    Background task to handle the heavy Gemini AI call and wordlist generation.
    Sends progress updates back via WebSockets.
    """
    channel_layer = get_channel_layer()
    group_name = f"gen_user_{user_id}" if user_id else f"gen_anon_{client_id}"

    try:
        # 1. Update status
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "generation_progress",
                "status": "Analyzing PII Data",
                "progress": 20
            }
        )

        prompt = build_prompt(pii_data, pattern_mode=pattern_mode)
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "generation_progress",
                "status": "Querying Gemini AI Engine...",
                "progress": 50
            }
        )

        wordlist_raw = call_gemini_api(prompt, pii_data=pii_data)
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "generation_progress",
                "status": "Compiling and Filtering Wordlist...",
                "progress": 80
            }
        )

        rockyou_passwords = get_rockyou_wordlist()
        ai_wordlist = [line.strip() for line in wordlist_raw.splitlines() if line.strip()]

        seen = set()
        wordlist = []
        for pwd in ai_wordlist:
            if pwd not in seen:
                wordlist.append(pwd)
                seen.add(pwd)
                
        # For simplicity, combine unique logic identical to views.py
        for pwd in rockyou_passwords:
            if pwd not in seen:
                wordlist.append(pwd)
                seen.add(pwd)

        if not wordlist:
            raise ValueError("The generated wordlist is empty. Ensure valid PII was provided.")

        wordlist_text = "\n".join(wordlist)

        # Cache the result for 24 hours
        cache.set(cache_key, wordlist_text, timeout=60 * 60 * 24)

        # Save to DB history if user is authenticated
        if user_id:
            user = User.objects.get(id=user_id)
            GenerationHistory.objects.create(
                user=user,
                pii_data=pii_data,
                wordlist=wordlist_text,
                pattern_mode=pattern_mode
            )

        # 2. Complete status
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "generation_complete",
                "status": "Generation Complete",
                "progress": 100,
                "wordlist_count": len(wordlist),
                "cache_key": cache_key
            }
        )

        return {"cache_key": cache_key, "count": len(wordlist)}

    except Exception as e:
        logger.error(f"Wordlist generation failed: {e}")
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "generation_error",
                "status": "Failed",
                "error": str(e)
            }
        )
        return {"error": str(e)}
