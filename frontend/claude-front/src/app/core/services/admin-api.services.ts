import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '../config/api.config';
import {
  AdminExpenseRequest,
  AdminExpenseResponse,
  AdminUserRequest,
  AdminUserResponse,
  CategoryRequest,
  CategoryResponse,
  NotificationRequest,
  NotificationResponse,
} from '../models';
import { AdminCrudApi } from './admin-crud-api';

@Injectable({ providedIn: 'root' })
export class AdminUsersApiService extends AdminCrudApi<AdminUserRequest, AdminUserResponse> {
  constructor() {
    super(inject(HttpClient), `${inject(API_BASE_URL)}/admin/users`);
  }
}

@Injectable({ providedIn: 'root' })
export class AdminCategoriesApiService extends AdminCrudApi<CategoryRequest, CategoryResponse> {
  constructor() {
    super(inject(HttpClient), `${inject(API_BASE_URL)}/admin/categories`);
  }
}

@Injectable({ providedIn: 'root' })
export class AdminExpensesApiService extends AdminCrudApi<AdminExpenseRequest, AdminExpenseResponse> {
  constructor() {
    super(inject(HttpClient), `${inject(API_BASE_URL)}/admin/expenses`);
  }
}

@Injectable({ providedIn: 'root' })
export class AdminNotificationsApiService extends AdminCrudApi<NotificationRequest, NotificationResponse> {
  constructor() {
    super(inject(HttpClient), `${inject(API_BASE_URL)}/admin/notifications`);
  }
}
