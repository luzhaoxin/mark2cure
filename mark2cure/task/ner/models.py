from django.db import models
from .managers import EntityRecognitionAnnotationManager
from django.forms.models import model_to_dict


class EntityRecognitionAnnotation(models.Model):
    # Only access through Document.Annotation.metadata.RelationAnnotation
    DISEASE = 0
    GENE = 1
    TREATMENT = 2
    TYPE_CHOICES = (
        (DISEASE, 'Disease'),
        (GENE, 'Gene'),
        (TREATMENT, 'Treatment')
    )
    type_idx = models.IntegerField(choices=TYPE_CHOICES, blank=True, null=True)

    text = models.TextField(blank=True, null=True)

    # (WARNING) Different than BioC
    # This is always the start position relative
    # to the section, not the entire document
    start = models.IntegerField(blank=True, null=True)

    objects = EntityRecognitionAnnotationManager()

