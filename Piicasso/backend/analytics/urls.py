from django.urls import path
from .views import GlobeDataView, HelpBeaconView

urlpatterns = [
    path('globe-data/', GlobeDataView.as_view(), name='globe-data'),
    path('beacon/', HelpBeaconView.as_view(), name='help-beacon'),
]
