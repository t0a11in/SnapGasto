"""Adaptador Django ORM sobre las tablas creadas por la migración de Spring Boot."""

from django.db import transaction

from .models import AppNotification, AppUser, Category, Expense, Income


class SqlServerStore:
    def find_user_by_email(self, email): return AppUser.objects.filter(email__iexact=email).first()
    def find_user_by_firebase_uid(self, firebase_uid): return AppUser.objects.filter(firebase_uid=firebase_uid).first()
    def find_user_by_id(self, user_id): return AppUser.objects.filter(id=user_id).first()
    def list_users(self): return list(AppUser.objects.order_by("-created_at"))
    def save_user(self, user): user.save(); return user

    def delete_user(self, user):
        with transaction.atomic():
            AppNotification.objects.filter(user_id=user.id).delete()
            Expense.objects.filter(user_id=user.id).delete()
            Income.objects.filter(user_id=user.id).delete()
            user.delete()

    def list_categories(self): return list(Category.objects.order_by("name"))
    def find_category_by_id(self, category_id): return Category.objects.filter(id=category_id).first()
    def find_category_by_name(self, name): return Category.objects.filter(name__iexact=name).first()
    def save_category(self, category): category.save(); return category
    def delete_category(self, category): category.delete()

    def list_expenses(self, user_id=None):
        query = Expense.objects.select_related("user").order_by("-expense_date", "-created_at")
        return list(query.filter(user_id=user_id) if user_id else query)

    def find_expense_by_id(self, expense_id): return Expense.objects.select_related("user").filter(id=expense_id).first()
    def save_expense(self, expense): expense.save(); return Expense.objects.select_related("user").get(id=expense.id)
    def delete_expense(self, expense): expense.delete()

    def list_incomes(self, user_id, month_start, month_end):
        return list(Income.objects.filter(user_id=user_id, income_date__gte=month_start, income_date__lte=month_end).order_by("-income_date", "-created_at"))

    def find_income_by_id(self, income_id): return Income.objects.filter(id=income_id).first()
    def save_income(self, income): income.save(); return income
    def delete_income(self, income): income.delete()

    def list_notifications(self): return list(AppNotification.objects.select_related("user").order_by("-created_at"))
    def find_notification_by_id(self, notification_id): return AppNotification.objects.select_related("user").filter(id=notification_id).first()
    def save_notification(self, notification): notification.save(); return AppNotification.objects.select_related("user").get(id=notification.id)
    def delete_notification(self, notification): notification.delete()
