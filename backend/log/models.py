from django.db import models
import uuid

# log entry
class LogEntry(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    action = models.CharField(max_length=100)
    user = models.CharField(max_length=100) # later can be ForeignKey to User model
    detail = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"ID: {str(self.uuid)[:8]} - Action: {self.action} - User: {self.user} - Timestamp: {self.timestamp}"