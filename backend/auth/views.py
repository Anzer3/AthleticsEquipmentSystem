from django.contrib.auth import authenticate, login, logout
from rest_framework.views import APIView
from rest_framework.response import Response
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator

@method_decorator(ensure_csrf_cookie, name='dispatch')
class CsrfView(APIView):
    def get(self, request):
        return Response({"detail": "CSRF cookie set"})

class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return Response({"success": True, "username": user.username})
        return Response({"success": False, "error": "Invalid credentials"}, status=401)

class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({"success": True})

class MeView(APIView):
    def get(self, request):
        if request.user.is_authenticated:
            return Response({"username": request.user.username})
        return Response({"username": None})
