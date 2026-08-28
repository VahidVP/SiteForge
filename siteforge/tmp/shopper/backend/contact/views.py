from rest_framework.generics import CreateAPIView

from .models import ContactMessage
from .serializers import ContactMessageSerializer


class ContactMessageCreateView(CreateAPIView):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
