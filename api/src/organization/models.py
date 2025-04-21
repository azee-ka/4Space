# models/organization.py

from django.db import models

class Organization(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    domain = models.CharField(max_length=255, blank=True, null=True)
    type = models.CharField(
        max_length=50,
        choices=[
            ('school', 'School'),
            ('university', 'University'),
            ('startup', 'Startup'),
            ('research', 'Research Lab'),
            ('company', 'Company'),
            ('other', 'Other'),
        ],
        default='other'
    )
    require_domain_email = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
