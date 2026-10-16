"""Casos de uso. No dependen de HTTP ni conocen detalles de las vistas."""

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from uuid import uuid4

import bcrypt
import jwt
from django.conf import settings

from .errors import bad_request, conflict, not_found, unauthorized
from .models import AppNotification, AppUser, Category, Expense, Income
from .validation import (
    normalized_email, optional_text, required_text, validated_date,
    validated_income_type, validated_money, validated_month,
    validated_password, validated_uuid,
)


def now():
    return datetime.now(timezone.utc)


def user_response(user):
    return {"id": str(user.id), "fullName": user.full_name, "email": user.email, "role": user.role}


def admin_user_response(user):
    return {**user_response(user), "createdAt": user.created_at.isoformat()}


def category_response(category):
    return {"id": str(category.id), "name": category.name, "icon": category.icon, "colorHex": category.color_hex}


def expense_response(expense):
    return {"id": str(expense.id), "amount": float(expense.amount), "category": expense.category, "date": expense.expense_date.isoformat(), "description": expense.description, "paymentMethod": expense.payment_method}


def admin_expense_response(expense):
    return {**expense_response(expense), "userId": str(expense.user_id), "userName": expense.user.full_name}


def income_response(income):
    return {"id": str(income.id), "amount": float(income.amount), "type": income.income_type, "date": income.income_date.isoformat(), "description": income.description}


def notification_response(notification):
    return {"id": str(notification.id), "userId": str(notification.user_id), "userName": notification.user.full_name, "title": notification.title, "body": notification.body, "read": notification.is_read, "createdAt": notification.created_at.isoformat()}


class TokenService:
    def create(self, subject: str) -> str:
        issued_at = now()
        return jwt.encode({"sub": subject, "iat": issued_at, "exp": issued_at + timedelta(minutes=settings.JWT_EXPIRATION_MINUTES)}, settings.JWT_SECRET, algorithm="HS256")

    def subject(self, token: str) -> str:
        try:
            subject = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])["sub"]
            if not subject:
                raise ValueError("missing sub")
            return subject
        except (jwt.PyJWTError, KeyError, ValueError):
            raise unauthorized()


def hash_password(value: str) -> str:
    return bcrypt.hashpw(value.encode(), bcrypt.gensalt(rounds=10, prefix=b"2a")).decode()


class AuthService:
    def __init__(self, store, identity_provider=None, tokens=None):
        self.store = store
        self.identity_provider = identity_provider
        self.tokens = tokens or TokenService()

    def register(self, body):
        email = normalized_email(body.get("email"))
        if self.store.find_user_by_email(email):
            raise conflict("Ya existe una cuenta con ese correo.")
        user = AppUser(id=uuid4(), full_name=required_text(body.get("fullName"), "nombre", 120), email=email, password=hash_password(validated_password(body.get("password"))), role="ADMIN" if settings.BOOTSTRAP_ADMIN_EMAIL == email else "USER", created_at=now())
        self.store.save_user(user)
        return self.auth_response(user)

    def login(self, body):
        user = self.store.find_user_by_email(normalized_email(body.get("email")))
        value = validated_password(body.get("password"))
        if not user or not bcrypt.checkpw(value.encode(), user.password.encode()):
            raise unauthorized("Correo o contraseña incorrectos.")
        return self.auth_response(user)

    def login_with_google(self, body):
        if not self.identity_provider:
            raise ApiError(503, "El acceso con Google no está configurado.")
        identity = self.identity_provider.verify(required_text(body.get("idToken"), "token de Firebase"))
        user = self.store.find_user_by_firebase_uid(identity["uid"]) or self.store.find_user_by_email(identity["email"])
        if not user:
            user = AppUser(id=uuid4(), full_name=identity["displayName"][:120], email=identity["email"], password=hash_password(str(uuid4())), firebase_uid=identity["uid"], role="ADMIN" if settings.BOOTSTRAP_ADMIN_EMAIL == identity["email"] else "USER", created_at=now())
        elif user.firebase_uid and user.firebase_uid != identity["uid"]:
            raise conflict("Este correo ya está vinculado a otra cuenta Google.")
        else:
            user.firebase_uid = identity["uid"]
        self.store.save_user(user)
        return self.auth_response(user)

    def auth_response(self, user):
        return {"accessToken": self.tokens.create(user.email), "user": user_response(user)}


class ExpenseService:
    def __init__(self, store): self.store = store
    def list_for(self, user): return [expense_response(item) for item in self.store.list_expenses(user.id)]
    def create(self, body, user):
        expense = Expense(id=uuid4(), user=user, amount=validated_money(body.get("amount")), category=required_text(body.get("category"), "categoría", 80), expense_date=validated_date(body.get("date")), description=optional_text(body.get("description"), "descripción", 500), payment_method=required_text(body.get("paymentMethod"), "método de pago", 60), created_at=now())
        return expense_response(self.store.save_expense(expense))
    def delete(self, expense_id, user):
        expense = self.store.find_expense_by_id(validated_uuid(expense_id, "gasto"))
        if not expense or expense.user_id != user.id: raise not_found("Gasto no encontrado.")
        self.store.delete_expense(expense)


class IncomeService:
    def __init__(self, store): self.store = store

    def list_for(self, user, requested_month):
        month = validated_month(requested_month)
        return [income_response(item) for item in self.store.list_incomes(user.id, month, self._month_end(month))]

    def summary_for(self, user, requested_month):
        month = validated_month(requested_month)
        tarjeta = Decimal("0.00")
        fisico = Decimal("0.00")
        for income in self.store.list_incomes(user.id, month, self._month_end(month)):
            if income.income_type == "TARJETA": tarjeta += income.amount
            if income.income_type == "FISICO": fisico += income.amount
        return {"month": month.strftime("%Y-%m"), "totalTarjeta": float(tarjeta), "totalFisico": float(fisico), "total": float(tarjeta + fisico)}

    def create(self, body, user):
        income = Income(id=uuid4(), user=user, amount=validated_money(body.get("amount")), income_type=validated_income_type(body.get("type")), income_date=validated_date(body.get("date")), description=optional_text(body.get("description"), "descripción", 500), created_at=now())
        return income_response(self.store.save_income(income))

    def update(self, income_id, body, user):
        income = self._owned_income(income_id, user)
        income.amount, income.income_type, income.income_date, income.description = validated_money(body.get("amount")), validated_income_type(body.get("type")), validated_date(body.get("date")), optional_text(body.get("description"), "descripción", 500)
        return income_response(self.store.save_income(income))

    def delete(self, income_id, user): self.store.delete_income(self._owned_income(income_id, user))

    def _owned_income(self, income_id, user):
        income = self.store.find_income_by_id(validated_uuid(income_id, "ingreso"))
        if not income or income.user_id != user.id: raise not_found("Ingreso no encontrado.")
        return income

    def _month_end(self, month):
        return (month.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)


class AdminService:
    def __init__(self, store): self.store = store
    def list_users(self): return [admin_user_response(item) for item in self.store.list_users()]
    def create_user(self, body):
        email = normalized_email(body.get("email"))
        if self.store.find_user_by_email(email): raise conflict("Ya existe una cuenta con ese correo.")
        user = AppUser(id=uuid4(), full_name=required_text(body.get("fullName"), "nombre", 120), email=email, password=hash_password(validated_password(body.get("password"))), role=self.role(body.get("role")), created_at=now())
        return admin_user_response(self.store.save_user(user))
    def update_user(self, user_id, body):
        user = self.user(user_id); email = normalized_email(body.get("email")); duplicate = self.store.find_user_by_email(email)
        if duplicate and duplicate.id != user.id: raise conflict("Ya existe una cuenta con ese correo.")
        user.full_name, user.email, user.role = required_text(body.get("fullName"), "nombre", 120), email, self.role(body.get("role"))
        if value := validated_password(body.get("password"), required=False): user.password = hash_password(value)
        return admin_user_response(self.store.save_user(user))
    def delete_user(self, user_id, current_user):
        user = self.user(user_id)
        if user.id == current_user.id: raise bad_request("No puedes eliminar tu propia cuenta.")
        self.store.delete_user(user)

    def list_categories(self): return [category_response(item) for item in self.store.list_categories()]
    def create_category(self, body):
        name = required_text(body.get("name"), "nombre", 80)
        if self.store.find_category_by_name(name): raise conflict("Ya existe una categoría con ese nombre.")
        return category_response(self.store.save_category(Category(id=uuid4(), name=name, icon=optional_text(body.get("icon"), "icono", 80), color_hex=self.color(body.get("colorHex")))))
    def update_category(self, category_id, body):
        category = self.category(category_id); name = required_text(body.get("name"), "nombre", 80); duplicate = self.store.find_category_by_name(name)
        if duplicate and duplicate.id != category.id: raise conflict("Ya existe una categoría con ese nombre.")
        category.name, category.icon, category.color_hex = name, optional_text(body.get("icon"), "icono", 80), self.color(body.get("colorHex"))
        return category_response(self.store.save_category(category))
    def delete_category(self, category_id): self.store.delete_category(self.category(category_id))

    def list_expenses(self): return [admin_expense_response(item) for item in self.store.list_expenses()]
    def create_expense(self, body): return admin_expense_response(self.save_expense(None, body))
    def update_expense(self, expense_id, body): self.expense(expense_id); return admin_expense_response(self.save_expense(expense_id, body))
    def delete_expense(self, expense_id): self.store.delete_expense(self.expense(expense_id))

    def list_notifications(self): return [notification_response(item) for item in self.store.list_notifications()]
    def create_notification(self, body): return notification_response(self.save_notification(None, body))
    def update_notification(self, notification_id, body): self.notification(notification_id); return notification_response(self.save_notification(notification_id, body))
    def delete_notification(self, notification_id): self.store.delete_notification(self.notification(notification_id))

    def save_expense(self, expense_id, body):
        user = self.user(body.get("userId")); expense = self.expense(expense_id) if expense_id else Expense(id=uuid4(), created_at=now())
        expense.user, expense.amount, expense.category, expense.expense_date, expense.description, expense.payment_method = user, validated_money(body.get("amount")), required_text(body.get("category"), "categoría", 80), validated_date(body.get("date")), optional_text(body.get("description"), "descripción", 500), required_text(body.get("paymentMethod"), "método de pago", 60)
        return self.store.save_expense(expense)
    def save_notification(self, notification_id, body):
        user = self.user(body.get("userId")); item = self.notification(notification_id) if notification_id else AppNotification(id=uuid4(), created_at=now())
        item.user, item.title, item.body, item.is_read = user, required_text(body.get("title"), "título", 140), required_text(body.get("body"), "mensaje", 1000), bool(body.get("read"))
        return self.store.save_notification(item)
    def role(self, value):
        if value not in ("ADMIN", "USER"): raise bad_request("El rol es obligatorio.")
        return value
    def color(self, value):
        color = optional_text(value, "color", 7)
        if color and (len(color) != 7 or color[0] != "#" or any(char not in "0123456789abcdefABCDEF" for char in color[1:])): raise bad_request("El color debe usar formato hexadecimal #RRGGBB.")
        return color
    def user(self, value):
        user = self.store.find_user_by_id(validated_uuid(value, "usuario"))
        if not user: raise not_found("Usuario no encontrado.")
        return user
    def category(self, value):
        category = self.store.find_category_by_id(validated_uuid(value, "categoría"))
        if not category: raise not_found("Categoría no encontrada.")
        return category
    def expense(self, value):
        expense = self.store.find_expense_by_id(validated_uuid(value, "gasto"))
        if not expense: raise not_found("Gasto no encontrado.")
        return expense
    def notification(self, value):
        item = self.store.find_notification_by_id(validated_uuid(value, "notificación"))
        if not item: raise not_found("Notificación no encontrada.")
        return item


# Se importa al final para evitar una dependencia circular de errores en los caminos normales.
from .errors import ApiError
