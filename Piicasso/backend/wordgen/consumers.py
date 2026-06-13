import json
from channels.generic.websocket import AsyncWebsocketConsumer

class GenerationProgressConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Authentication is enforced by JWTAuthMiddleware (asgi.py): the user
        # is set from a validated access token. Reject anonymous connections
        # outright — there is no guessable anonymous channel anymore.
        self.user = self.scope["user"]

        if self.user.is_anonymous:
            await self.close(code=4401)  # 4401 = unauthorized (app-defined)
            return

        # Scope the group strictly to the authenticated user's id.
        self.group_name = f"gen_user_{self.user.id}"

        # Join generation group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()
        
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to Generation Channel',
            'group': self.group_name
        }))

    async def disconnect(self, close_code):
        # Leave generation group
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    # Receive message from room group
    async def generation_progress(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps(event))
        
    async def generation_complete(self, event):
        await self.send(text_data=json.dumps(event))
        
    async def generation_error(self, event):
        await self.send(text_data=json.dumps(event))
