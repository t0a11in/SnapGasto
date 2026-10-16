"""Mapeos de las tablas compartidas. Nunca se administran con migraciones Django."""

import uuid
from django.db import models


class AppUser(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    full_name = models.CharField(max_length=120)
    email = models.CharField(max_length=180, unique=True)
    password = models.CharField(max_length=255)
    firebase_uid = models.CharField(max_length=128, null=True, blank=True)
    role = models.CharField(max_length=20, default="USER")
    created_at = models.DateTimeField()

    class Meta:
        db_table = "users"
        managed = False


class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.CharField(max_length=80, unique=True)
    icon = models.CharField(max_length=80, null=True, blank=True)
    color_hex = models.CharField(max_length=7, null=True, blank=True)

    class Meta:
        db_table = "categories"
        managed = False


class Expense(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    category = models.CharField(max_length=80)
    expense_date = models.DateField()
    description = models.CharField(max_length=500, null=True, blank=True)
    payment_method = models.CharField(max_length=60)
    user = models.ForeignKey(AppUser, db_column="user_id", on_delete=models.DO_NOTHING, related_name="expenses")
    created_at = models.DateTimeField()

    class Meta:
        db_table = "expenses"
        managed = False


class Income(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    income_type = models.CharField(max_length=20)
    income_date = models.DateField()
    description = models.CharField(max_length=500, null=True, blank=True)
    user = models.ForeignKey(AppUser, db_column="user_id", on_delete=models.DO_NOTHING, related_name="incomes")
    created_at = models.DateTimeField()

    class Meta:
        db_table = "incomes"
        managed = False


class AppNotification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    title = models.CharField(max_length=140)
    body = models.CharField(max_length=1000)
    is_read = models.BooleanField(default=False)
    user = models.ForeignKey(AppUser, db_column="user_id", on_delete=models.DO_NOTHING, related_name="notifications")
    created_at = models.DateTimeField()

    class Meta:
        db_table = "notifications"
        managed = False
