from django.conf import settings
from django.core import signing
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Page
from .serializers import PageSerializer
from .owner import issue_owner_token


class PageDetailView(RetrieveAPIView):
    queryset = Page.objects.all()
    serializer_class = PageSerializer
    lookup_field = "slug"




class OwnerLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        code = str(request.data.get("code") or "").strip()
        expected = getattr(settings, "ADMIN_ACCESS_CODE", "")
        if not expected:
            return Response({"detail": "Owner access is not configured for this site."}, status=403)
        if code != expected:
            return Response({"detail": "Wrong code."}, status=400)
        return Response({"token": issue_owner_token()})
