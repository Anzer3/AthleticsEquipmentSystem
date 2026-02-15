from django.contrib.auth import authenticate, login, logout
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.views.decorators.csrf import ensure_csrf_cookie

@api_view(['GET'])
@ensure_csrf_cookie
def csrf_view(request):
    return Response({"detail": "CSRF cookie set"})

@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        return Response({"success": True, "username": user.username})
    return Response({"success": False, "error": "Invalid credentials"}, status=401)

@api_view(['POST'])
def logout_view(request):
    logout(request)
    return Response({"success": True})

@api_view(['GET'])
def me_view(request):
    if request.user.is_authenticated:
        return Response({"username": request.user.username})
    return Response({"username": None})
