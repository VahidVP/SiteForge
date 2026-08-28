from django.conf import settings
from django.core.signing import BadSignature, SignatureExpired, dumps, loads
from rest_framework.permissions import BasePermission

OWNER_SALT = "siteforge.owner"


def issue_owner_token():
    return dumps({"owner": True}, salt=OWNER_SALT)


def is_valid_owner_token(token):
    if not token:
        return False
    try:
        data = loads(token, salt=OWNER_SALT, max_age=60 * 60 * 24 * 30)
        return bool(data.get("owner"))
    except (SignatureExpired, BadSignature, Exception):
        return False


class IsOwnerOrStaff(BasePermission):
    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated and request.user.is_staff:
            return True
        auth = request.headers.get("Authorization", "")
        prefix = "Owner "
        token = auth[len(prefix):].strip() if auth.startswith(prefix) else ""
        return is_valid_owner_token(token)
