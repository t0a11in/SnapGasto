from datetime import date
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import Mock

from django.test import SimpleTestCase

from .errors import ApiError
from .services import AuthService, ExpenseService, IncomeService, TokenService


class AuthServiceTests(SimpleTestCase):
    def test_register_normalizes_email_hashes_password_and_emits_shared_jwt(self):
        saved = []
        store = Mock()
        store.find_user_by_email.return_value = None
        store.save_user.side_effect = lambda user: saved.append(user) or user
        service = AuthService(store)

        response = service.register({"fullName": "Ana Pérez", "email": "ANA@EXAMPLE.COM", "password": "secreto123"})

        self.assertEqual(response["user"]["email"], "ana@example.com")
        self.assertTrue(saved[0].password.startswith("$2a$"))
        self.assertEqual(TokenService().subject(response["accessToken"]), "ana@example.com")


class ExpenseServiceTests(SimpleTestCase):
    def test_delete_rejects_an_expense_from_another_user(self):
        store = Mock()
        store.find_expense_by_id.return_value = SimpleNamespace(user_id="other-user")
        service = ExpenseService(store)

        with self.assertRaisesRegex(Exception, "Gasto no encontrado"):
            service.delete("11111111-1111-4111-8111-111111111111", SimpleNamespace(id="current-user"))
        store.delete_expense.assert_not_called()


class IncomeServiceTests(SimpleTestCase):
    def test_summary_separates_card_cash_and_combined_total_for_requested_month(self):
        user = SimpleNamespace(id="user-1")
        store = Mock()
        store.list_incomes.return_value = [
            SimpleNamespace(amount=Decimal("12500.00"), income_type="TARJETA"),
            SimpleNamespace(amount=Decimal("8000.00"), income_type="FISICO"),
            SimpleNamespace(amount=Decimal("2500.00"), income_type="TARJETA"),
        ]

        result = IncomeService(store).summary_for(user, "2026-10")

        self.assertEqual("2026-10", result["month"])
        self.assertEqual(15000.0, result["totalTarjeta"])
        self.assertEqual(8000.0, result["totalFisico"])
        self.assertEqual(23000.0, result["total"])

    def test_summary_uses_current_month_when_month_is_omitted(self):
        today = date.today()
        store = Mock()
        store.list_incomes.return_value = []

        result = IncomeService(store).summary_for(SimpleNamespace(id="user-1"), None)

        self.assertEqual(today.strftime("%Y-%m"), result["month"])
        self.assertEqual(0.0, result["total"])

    def test_delete_rejects_income_owned_by_another_user(self):
        store = Mock()
        store.find_income_by_id.return_value = SimpleNamespace(user_id="other-user")

        with self.assertRaises(ApiError) as error:
            IncomeService(store).delete("0c4a414a-7c0a-4170-88ed-4a21fc9a6600", SimpleNamespace(id="current-user"))

        self.assertEqual(404, error.exception.status)
        store.delete_income.assert_not_called()
