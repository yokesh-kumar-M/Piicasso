from django.urls import path
from .views import GlobeDataView

urlpatterns = [
    path('globe-data/', GlobeDataView.as_view(), name='globe-data'),
]
