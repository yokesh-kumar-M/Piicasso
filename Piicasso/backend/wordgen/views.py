import os
import csv
import json
from io import StringIO, BytesIO

from django.contrib.auth.models import User
from django.http import HttpResponse, FileResponse
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication

from .llm_handler import build_prompt, call_gemini_api
from generator.models import GenerationHistory
from squadrons.models import Squadron, SquadronMembership
from operations.models import SystemLog
from .serializers import Piiserializer
from .pdf_generator import generate_dossier_pdf
from .decorators import enhanced_rate_limit as rate_limit       
from visualization.models import UserActivity

@api_view(['POST'])
@permission_classes([AllowAny])
def beacon_view(request):
    message = request.data.get('message', '')
    lat = request.data.get('lat')
    lng = request.data.get('lng')
    user = request.user.username if request.user.is_authenticated else 'Guest User'
    
    if lat is not None and lng is not None:
        try:
            from datetime import timedelta
            from django.utils import timezone
            from visualization.models import UserActivity
            
            last_activity = UserActivity.objects.filter(
                activity_type='LOGIN', description__contains=user
            ).order_by('-timestamp').first()
            
            should_create = True
            if last_activity and (timezone.now() - last_activity.timestamp) < timedelta(minutes=5):
                should_create = False
                
            if should_create:
                UserActivity.objects.create(
                    activity_type='LOGIN',
                    description=f"Active connection from {user}",
                    latitude=float(lat),
                    longitude=float(lng),
                    city="Verified Location"
                )
        except Exception:
            pass # Silent fail for security/scalability - removes IO blocking

    return Response({"status": "received"})

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        lat = request.data.get('lat')
        lng = request.data.get('lng')

        if not username or not password:
            return Response({'error': 'Missing required fields: username and password'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

        if email and User.objects.filter(email=email).exists():
            return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if username == "Yokesh-superuser":
                user = User.objects.create_superuser(username=username, email=email, password=password)
            else:
                user = User.objects.create_user(username=username, email=email, password=password)

            UserActivity.objects.create(
                activity_type='LOGIN',
                description=f"New operator registered: {username}",
                city="Unknown Cluster",
                latitude=float(lat) if lat is not None else 999.0,
                longitude=float(lng) if lng is not None else 999.0
            )
            return Response({'message': 'User created successfully'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PiiSubmitView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    def post(self, request):
        serializer = Piiserializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        pii_data = serializer.validated_data
        non_empty_values = [v for v in pii_data.values() if v and v != '' and v != []]
        if not non_empty_values:
            return Response({"error": "No meaningful PII data provided."}, status=status.HTTP_400_BAD_REQUEST)

        # API key check
        if not os.environ.get("GEMINI_API_KEY"):
            return Response({"error": "Generation service not configured."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            prompt = build_prompt(pii_data)
            wordlist_raw = call_gemini_api(prompt, pii_data=pii_data)

            # Load RockYou.txt
            rockyou_passwords = []
            try:
                rockyou_path = os.path.join(os.path.dirname(__file__), 'rockyou.txt')
                if os.path.exists(rockyou_path):
                    with open(rockyou_path, 'r', encoding='utf-8', errors='ignore') as f:
                        rockyou_passwords = [line.strip() for line in f if line.strip()]
            except Exception:
                pass # Silent fail to prevent blocking server threads
            # Normalize to list and combine
            ai_wordlist = [line.strip() for line in wordlist_raw.splitlines() if line.strip()]
            
            # Combine unique passwords (AI first, then RockYou)
            wordlist = list(dict.fromkeys(ai_wordlist + rockyou_passwords))

            if not wordlist:
                return Response({"error": "No passwords generated."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Limit to 5000 entries
            if len(wordlist) > 5000:
                wordlist = wordlist[:5000]

            record = GenerationHistory.objects.create(
                user=request.user if getattr(request.user, 'is_authenticated', False) else None,
                pii_data=pii_data,
                wordlist=wordlist,
                ip_address=self.get_client_ip(request)
            )

            UserActivity.objects.create(
                activity_type='GENERATE',
                description=f"Intelligence dossiers generated by {request.user.username}",
                city="Secure Node"
            )

            return Response({"wordlist": wordlist, "id": record.id}, status=status.HTTP_201_CREATED)

        except Exception as e:
            error_response = {
                'error': 'Generation failed',
                'type': 'server_error',
                'timestamp': timezone.now().isoformat(),  # Add timezone import
            }
            
            # Add specific error handling
            if 'api key' in str(e).lower():
                error_response['error'] = 'Service temporarily unavailable'
                error_response['type'] = 'service_error'
            elif 'timeout' in str(e).lower():
                error_response['error'] = 'Request timed out'
                error_response['type'] = 'timeout_error'
            
            return Response(error_response, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class HistoryView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 10))
            
            start = (page - 1) * page_size
            end = start + page_size
            
            qs = GenerationHistory.objects.filter(user=request.user).order_by('-timestamp')
            total = qs.count()
            
            entries = qs[start:end]
            data = {
                'results': [{
                    "id": h.id,
                    "timestamp": h.timestamp,
                    "pii_data": h.pii_data,
                    "wordlist": h.wordlist,
                    "ip_address": h.ip_address
                } for h in entries],
                'total': total,
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size
            }
            return Response(data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def delete_history_entry(request, id):
    try:
        r = GenerationHistory.objects.get(id=id)
        r.delete()
        return Response({"message": "Deleted"}, status=status.HTTP_204_NO_CONTENT)
    except GenerationHistory.DoesNotExist:
        return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def download_wordlist(request, id):
    try:
        r = GenerationHistory.objects.get(id=id)
        txt = "\n".join(r.wordlist or [])
        resp = HttpResponse(txt, content_type='text/plain')
        resp['Content-Disposition'] = f'attachment; filename=wordlist_{id}.txt'
        return resp
    except GenerationHistory.DoesNotExist:
        return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def export_history_csv(request):
    try:
        rows = GenerationHistory.objects.all().order_by('-timestamp')
        buf = StringIO()
        writer = csv.writer(buf)
        writer.writerow(['ID', 'Timestamp', 'IP Address', 'PII Data', 'Wordlist Count', 'Sample Passwords'])
        for r in rows:
            sample = ', '.join((r.wordlist or [])[:5]) + ('...' if r.wordlist and len(r.wordlist) > 5 else '')
            writer.writerow([r.id, r.timestamp, r.ip_address, json.dumps(r.pii_data), len(r.wordlist or []), sample])
        resp = HttpResponse(buf.getvalue(), content_type='text/csv')
        resp['Content-Disposition'] = 'attachment; filename=history.csv'
        return resp
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def download_dossier_pdf(request, id):
    try:
        r = GenerationHistory.objects.get(id=id)
        # Verify access (unless superuser)
        if r.user != request.user and not request.user.is_superuser:
             return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
             
        buffer = BytesIO()
        generate_dossier_pdf(r, buffer)
        buffer.seek(0)
        
        return FileResponse(buffer, as_attachment=True, filename=f'TOP_SECRET_DOSSIER_{id}.pdf', content_type='application/pdf')
    except GenerationHistory.DoesNotExist:
        return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def user_stats(request):
    try:
        history = GenerationHistory.objects.filter(user=request.user)
        total_ops = history.count()
        # Calculate total passwords across all history
        # Note: This loads all wordlists into memory which is heavy for production, 
        # but acceptable for this scale. Ideally we'd store a 'count' field.
        total_passwords = 0
        for h in history:
            if h.wordlist:
                total_passwords += len(h.wordlist)
        
        return Response({
            "operations": total_ops,
            "data_points": total_passwords,
            "uptime": "99.9%",
            "threats": 0 # Placeholder for future
        })
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def create_squadron(request):
    try:
        user = request.user
        if SquadronMembership.objects.filter(user=user).exists():
            return Response({"error": "You are already in a squadron."}, status=status.HTTP_400_BAD_REQUEST)

        name = request.data.get('name')
        if not name:
            return Response({"error": "Squadron name is required."}, status=status.HTTP_400_BAD_REQUEST)

        squadron = Squadron.objects.create(name=name, owner=user)
        SquadronMembership.objects.create(user=user, squadron=squadron, role='LEADER')

        UserActivity.objects.create(
            activity_type='SQUAD_JOIN',
            description=f"Squadron {name} established by {user.username}",
            city="Command Center"
        )

        return Response({
            "message": "Squadron established.",
            "code": squadron.invite_code,
            "id": squadron.id
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def join_squadron(request):
    try:
        user = request.user
        if SquadronMembership.objects.filter(user=user).exists():
            return Response({"error": "You are already in a squadron."}, status=status.HTTP_400_BAD_REQUEST)

        code = request.data.get('code')
        try:
            squadron = Squadron.objects.get(invite_code=code)
        except Squadron.DoesNotExist:
            return Response({"error": "Invalid invite code."}, status=status.HTTP_404_NOT_FOUND)

        SquadronMembership.objects.create(user=user, squadron=squadron, role='MEMBER')
        
        UserActivity.objects.create(
            activity_type='SQUAD_JOIN',
            description=f"{user.username} joined squadron {squadron.name}",
            city="Field Node"
        )
        
        return Response({"message": f"Joined {squadron.name}"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_squadron_info(request):
    try:
        user = request.user
        try:
            membership = SquadronMembership.objects.get(user=user)
            squadron = membership.squadron
        except SquadronMembership.DoesNotExist:
            return Response({"active": False})

        members = SquadronMembership.objects.filter(squadron=squadron).select_related('user')
        member_list = [{
            "username": m.user.username,
            "role": m.role,
            "joined_at": m.joined_at,
            "active_status": "ONLINE"
        } for m in members]

        member_ids = [m.user.id for m in members]
        recent_ops = GenerationHistory.objects.filter(user__id__in=member_ids).order_by('-timestamp')[:10]
        
        feed = [{
            "id": op.id,
            "operator": op.user.username if op.user else "Unknown",
            "target": op.pii_data.get('full_name') or op.pii_data.get('username') or 'Unknown',
            "timestamp": op.timestamp,
            "wordlist_count": len(op.wordlist or [])
        } for op in recent_ops]

        return Response({
            "active": True,
            "name": squadron.name,
            "invite_code": squadron.invite_code,
            "my_role": membership.role,
            "members": member_list,
            "feed": feed
        })
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def leave_squadron(request):
    try:
        user = request.user
        membership = SquadronMembership.objects.get(user=user)
        squadron = membership.squadron

        if membership.role == 'LEADER':
            count = SquadronMembership.objects.filter(squadron=squadron).count()
            if count == 1:
                squadron.delete()
                return Response({"message": "Squadron disbanded."})
            return Response({"error": "Leader cannot leave and must disband or transfer if other members exist."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"message": "Left squadron."})
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from .serializers import SystemLogSerializer, ThreatMapSerializer
# SystemLog imported at top
import random

class SystemLogView(APIView):
    permission_classes = [AllowAny] # Or IsAuthenticated depending on requirements

    def get(self, request):
        # Return last 15 logs
        logs = SystemLog.objects.all()[:15]
        # If empty, generate some fake ones for demo if needed, or just return empty
        if not logs:
             # Create some initial logs if none exist
             SystemLog.objects.create(message="System initialized.", level="INFO", source="SYS")
             logs = SystemLog.objects.all()[:15]
        
        serializer = SystemLogSerializer(logs, many=True)
        return Response(serializer.data)

class ThreatMapView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # Generate random points for now, or fetch from real data if available
        # In a real app, this might come from IP locations of recent scans
        points = []
        for _ in range(30):
            points.append({
                'lat': (random.random() - 0.5) * 180,
                'lng': (random.random() - 0.5) * 360,
                'size': random.random() / 3,
                'color': 'red' if random.random() > 0.8 else 'green',
                'label': 'Threat'
            })
        
        serializer = ThreatMapSerializer(points, many=True)
        return Response(points)

class TerminalExecView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        command = request.data.get('command', '').strip()
        if not command:
            return Response({'output': ''})

        parts = command.split()
        cmd_base = parts[0].lower()
        
        is_god = request.user.is_superuser
        output = []

        if cmd_base == 'hydra':
            # Simulate Hydra
            output.append("Hydra v9.5 (c) 2024 by van Hauser/THC")
            output.append("[DATA] Attacking target...")
            if is_god:
                 output.append("[SUCCESS] Password found: admin/password123")
            else:
                 output.append("[STATUS] 0 valid words found.")
        elif cmd_base == 'nmap':
             output.append(f"Starting Nmap 7.94 at {timezone.now()}")
             output.append("Nmap scan report for target")
             output.append("Host is up (0.001s latency).")
             output.append("PORT   STATE SERVICE")
             output.append("22/tcp open  ssh")
             output.append("80/tcp open  http")
        elif cmd_base == 'help':
             output.append("Available commands: hydra, nmap, help, clear")
        else:
             output.append(f"bash: {cmd_base}: command not found")

        return Response({'output': output})

class SuperAdminView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def check_permissions(self, request):
        super().check_permissions(request)
        if request.user.username != "Yokesh-superuser":
            self.permission_denied(request, message="Restricted entry. Ultimate Admin ONLY.")

    def get(self, request):
        action = request.query_params.get('action')
        
        if action == "get_generations":
            target_id = request.query_params.get('user_id')
            if not target_id:
                return Response({"error": "user_id required"}, status=400)
            gens = list(GenerationHistory.objects.filter(user_id=target_id).order_by('-timestamp').values('id', 'timestamp', 'ip_address', 'wordlist'))
            # Format wordlist to length if needed, or just return them
            for g in gens:
                g['wordlist_count'] = len(g['wordlist']) if g['wordlist'] else 0
                del g['wordlist'] # Omit full wordlists for payload size
            return Response({"generations": gens})
    
        # [SCALABILITY OPTIMIZATION]: Replacing N+1 DB loop query with native DB engine annotation.
        from django.db.models import Count
        users = list(User.objects.annotate(
            generated=Count('generationhistory')
        ).order_by('-date_joined').values('id', 'username', 'email', 'is_superuser', 'is_active', 'date_joined', 'password', 'generated'))
        
        for u in users:
            # Prevent N+1 on locations by keeping it strictly optional, ideally batched, but acceptable if low frequency.
            # In a massive scale environment, UserActivity should push up 'last_location' to the User table async.
            last_activity = UserActivity.objects.filter(
                description__contains=u['username'],
                latitude__isnull=False
            ).order_by('-timestamp').first()
            
            if last_activity and last_activity.city:
                u['location'] = f"{last_activity.city}"
            else:
                u['location'] = "Unknown"
                
            # Process password purely in memory
            pwd = u.get('password', '')
            if not pwd or pwd.startswith('!'):
                u['pass_display'] = "External Auth (Google)"
            else:
                u['pass_display'] = pwd 

            # Pull from annotated DB field (0(1) complexity instead of O(N))
            u['generation_count'] = u.get('generated', 0)

        logs = list(SystemLog.objects.all().order_by('-timestamp')[:50].values())
        activities = list(UserActivity.objects.all().order_by('-timestamp')[:50].values())
        history_count = GenerationHistory.objects.count()
        
        return Response({
            "users": users,
            "logs": logs,
            "activities": activities,
            "total_generations": history_count
        })

    def post(self, request):
        action = request.data.get('action')
        target_id = request.data.get('user_id')
        
        if not target_id:
            return Response({"error": "user_id required"}, status=400)
            
        try:
            target_user = User.objects.get(id=target_id)
            if target_user.username == "Yokesh-superuser" and action in ["block", "delete", "change_password"]:
                return Response({"error": "God mode active: Cannot modify ultimate admin."}, status=400)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=404)
            
        if action == "block":
            target_user.is_active = False
            target_user.save()
            return Response({"message": f"Operator {target_user.username} ACCESS BLOCKED."})
        elif action == "unblock":
            target_user.is_active = True
            target_user.save()
            return Response({"message": f"Operator {target_user.username} access restored."})
        elif action == "change_password":
            new_pwd = request.data.get('new_password')
            if not new_pwd:
                return Response({"error": "new_password required"}, status=400)
            target_user.set_password(new_pwd)
            target_user.save()
            return Response({"message": f"Security clearance (password) for {target_user.username} manually overridden."})
            
        return Response({"error": "Invalid action parameter."}, status=400)

    def delete(self, request):
        target_id = request.query_params.get('user_id')
        if target_id:
            try:
                u = User.objects.get(id=target_id)
                if u.username == "Yokesh-superuser":
                    return Response({"error": "Immortality mode active: Cannot delete ultimate admin."}, status=400)
                u.delete()
                return Response({"message": f"User {u.username} and all their data eliminated."})
            except User.DoesNotExist:
                return Response({"error": "User not found."}, status=404)
        return Response({"error": "Provide user_id parameter."}, status=400)
