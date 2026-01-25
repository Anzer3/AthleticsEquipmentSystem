from django.db import models
import uuid

# category athletes compete in
class Category(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=30)
    gender = models.SmallIntegerField(choices=[(0, 'Women'), (1, 'Men')], default=0)
    def __str__(self):
        return self.name

# location of the event
class Location(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=30)
    description = models.TextField(blank=True)
    def __str__(self):
        return self.name

# status of the event
class EventStatus(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    display_text = models.CharField(max_length=30)
    description = models.TextField(blank=True)
    def __str__(self):
        return self.display_text

# overall event model
class Event(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=30)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    status = models.ForeignKey(EventStatus, on_delete=models.SET_NULL, null=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True)
    def __str__(self):
        return self.name