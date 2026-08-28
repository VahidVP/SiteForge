from django.urls import path

from . import views

urlpatterns = [
    path("payments/status/", views.PaymentStatusView.as_view(), name="payment-status"),
    path("checkout/", views.CheckoutView.as_view(), name="checkout"),
    path("payment/mock/", views.MockGatewayView.as_view(), name="payment-mock"),
    path("payment/callback/", views.PaymentCallbackView.as_view(), name="payment-callback"),
    path("orders/", views.MyOrdersView.as_view(), name="my-orders"),
    path("orders/<str:code>/", views.OrderDetailView.as_view(), name="order-detail"),
    path("support/tickets/", views.TicketListCreateView.as_view(), name="tickets"),
    path("support/tickets/<int:pk>/", views.TicketThreadView.as_view(), name="ticket-thread"),
    path("support/tickets/<int:pk>/reply/", views.TicketReplyView.as_view(), name="ticket-reply"),
    path("admin/products/<int:pk>/images/", views.ProductImageUploadView.as_view(), name="admin-product-images"),
]
