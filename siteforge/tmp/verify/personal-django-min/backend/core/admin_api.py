from pathlib import Path

from django.conf import settings
from django.urls import path
from rest_framework.response import Response
from rest_framework.views import APIView

from core.owner import IsOwnerOrStaff
from core.models import Project
from core.serializers import ProjectSerializer


class AdminProjectsView(APIView):
    permission_classes = [IsOwnerOrStaff]

    def get(self, request):
        return Response(ProjectSerializer(Project.objects.order_by("order", "id"), many=True).data)

    def post(self, request):
        serializer = ProjectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = serializer.save()
        return Response(ProjectSerializer(project).data, status=201)


class AdminProjectView(APIView):
    permission_classes = [IsOwnerOrStaff]

    def _get(self, pk):
        try:
            return Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return None

    def put(self, request, pk):
        project = self._get(pk)
        if project is None:
            return Response({"detail": "Not found."}, status=404)
        serializer = ProjectSerializer(project, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        project = serializer.save()
        return Response(ProjectSerializer(project).data)

    def patch(self, request, pk):
        return self.put(request, pk)

    def delete(self, request, pk):
        deleted, _ = Project.objects.filter(pk=pk).delete()
        if not deleted:
            return Response({"detail": "Not found."}, status=404)
        return Response(status=204)

def _media_root():
    return settings.MEDIA_ROOT if settings.MEDIA_ROOT else Path(settings.BASE_DIR) / "media"


class AdminMediaView(APIView):
    permission_classes = [IsOwnerOrStaff]

    def get(self, request):
        root = _media_root()
        files = []
        if root.exists():
            for path in sorted(root.rglob("*")):
                if path.is_file() and path.suffix.lower() in (".webp", ".webp.png", ".png", ".jpg", ".jpeg", ".svg", ".gif"):
                    rel = "/media/" + path.relative_to(root).as_posix()
                    files.append({"name": path.name, "url": rel})
        return Response(files)

    def post(self, request):
        images = request.FILES.getlist("images")
        if not images:
            return Response({"detail": "No images."}, status=400)
        root = _media_root()
        root.mkdir(parents=True, exist_ok=True)
        saved = []
        from django.core.files.storage import default_storage
        for image in images[:8]:
            name = default_storage.get_available_name(image.name)
            path = root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            with path.open("wb") as dest:
                for chunk in image.chunks():
                    dest.write(chunk)
            saved.append({"url": "/media/" + name})
        return Response(saved)


urlpatterns = [
    path("projects/", AdminProjectsView.as_view()),
    path("projects/<int:pk>/", AdminProjectView.as_view()),
    path("media/", AdminMediaView.as_view()),
]
