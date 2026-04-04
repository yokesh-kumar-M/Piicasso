import json
from channels.generic.websocket import AsyncWebsocketConsumer

class GenerationProgressConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # We use the user's ID as part of the group name to send targeted updates
        self.user = self.scope["user"]
        
        if self.user.is_anonymous:
            # For anonymous users, we can use a session key or generated UUID from the frontend
            # Assuming the client passes a query param `client_id` for anonymous sessions
            query_string = self.scope.get('query_string', b'').decode('utf-8')
            client_id = None
            if 'client_id=' in query_string:
                client_id = query_string.split('client_id=')[1].split('&')[0]
                
            if client_id:
                self.group_name = f"gen_anon_{client_id}"
            else:
                await self.close()
                return
        else:
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
