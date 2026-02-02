from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from django.views.decorators.csrf import csrf_exempt

from rest_framework.response import Response
from event.models import Category

@api_view(['POST'])
@authentication_classes([])   # 🔥 TOTO JE KLÍČ
@permission_classes([AllowAny])
@csrf_exempt
def dataload(request):
    Category.objects.get_or_create(name="Žáci - U16", defaults={"gender": 1})
    Category.objects.get_or_create(name="Dorostenci - U18", defaults={"gender": 1})
    Category.objects.get_or_create(name="Junioři - U20", defaults={"gender": 1})
    Category.objects.get_or_create(name="Muži", defaults={"gender": 1})

    Category.objects.get_or_create(name="Žákyně - U16", defaults={"gender": 0})
    Category.objects.get_or_create(name="Dorostenky - U18", defaults={"gender": 0})
    Category.objects.get_or_create(name="Juniorky - U20", defaults={"gender": 0})
    Category.objects.get_or_create(name="Ženy", defaults={"gender": 0})

    return Response({"message": "Kategorie načteny"}, status=201)
