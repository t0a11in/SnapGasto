import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'

import { api } from './api'
import type {
  AdminExpense,
  AdminUser,
  AppNotification,
  AuthResponse,
  Category,
  CategoryPayload,
  ExpensePayload,
  NotificationPayload,
  Role,
  SessionUser,
  UserPayload,
} from './types'

type Section = 'users' | 'expenses' | 'categories' | 'notifications'
type Session = Pick<AuthResponse, 'accessToken' | 'user'>

const sessionKey = 'snapgasto.admin.session'
const sections: Array<{ id: Section; label: string; icon: string }> = [
  { id: 'users', label: 'Usuarios', icon: '👥' },
  { id: 'expenses', label: 'Gastos', icon: '▣' },
  { id: 'categories', label: 'Categorías', icon: '◉' },
  { id: 'notifications', label: 'Notificaciones', icon: '✉' },
]

/** Entrega la consola React con los mantenedores protegidos por rol ADMIN. */
function App() {
  const [session, setSession] = useState<Session | null>(() => readSession())

  const startSession = (nextSession: Session) => {
    localStorage.setItem(sessionKey, JSON.stringify(nextSession))
    setSession(nextSession)
  }

  const endSession = () => {
    localStorage.removeItem(sessionKey)
    setSession(null)
  }

  return session ? <AdminShell session={session} onLogout={endSession} /> : <AuthScreen onSession={startSession} />
}

function readSession(): Session | null {
  try {
    const value = localStorage.getItem(sessionKey)
    return value ? (JSON.parse(value) as Session) : null
  } catch {
    localStorage.removeItem(sessionKey)
    return null
  }
}

function AuthScreen({ onSession }: { onSession: (session: Session) => void }) {
  const [registerMode, setRegisterMode] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email')).trim()
    const password = String(form.get('password'))
    const fullName = String(form.get('fullName')).trim()
    setSubmitting(true)
    setMessage('')

    try {
      const response = registerMode
        ? await api.register(fullName, email, password)
        : await api.login(email, password)

      if (response.user.role !== 'ADMIN') {
        setIsError(false)
        setMessage(
          registerMode
            ? 'Cuenta creada. Configura APP_BOOTSTRAP_ADMIN_EMAIL con este correo y reinicia la API para otorgarle el rol ADMIN.'
            : 'Esta cuenta no tiene permisos ADMIN para acceder a los mantenedores.',
        )
        return
      }
      onSession(response)
    } catch (error) {
      setIsError(true)
      setMessage(error instanceof Error ? error.message : 'No fue posible iniciar sesión.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-card">
        <p className="eyebrow">SNAPGASTO · ADMIN</p>
        <h1>Mantenedores</h1>
        <p className="muted">Administra usuarios, gastos, categorías y notificaciones.</p>
        <form className="form-stack" onSubmit={submit}>
          {registerMode && <Field label="Nombre completo" name="fullName" required />}
          <Field label="Correo electrónico" name="email" type="email" autoComplete="email" required />
          <Field label="Contraseña" name="password" type="password" autoComplete={registerMode ? 'new-password' : 'current-password'} minLength={8} required />
          {message && <Message text={message} isError={isError} />}
          <button className="button button-primary" disabled={submitting} type="submit">
            {submitting ? 'Procesando…' : registerMode ? 'Crear cuenta' : 'Ingresar'}
          </button>
        </form>
        <button className="button button-link" type="button" onClick={() => { setRegisterMode(!registerMode); setMessage('') }}>
          {registerMode ? 'Ya tengo una cuenta' : 'Crear la primera cuenta'}
        </button>
      </section>
    </main>
  )
}

function AdminShell({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const [section, setSection] = useState<Section>('users')
  const title = sections.find((item) => item.id === section)?.label ?? ''

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span>◈</span> SnapGasto</div>
        <p className="sidebar-caption">Administración</p>
        <nav>
          {sections.map((item) => (
            <button key={item.id} type="button" className={`nav-item ${section === item.id ? 'active' : ''}`} onClick={() => setSection(item.id)}>
              <span aria-hidden="true">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="account-summary">
          <strong>{session.user.fullName}</strong>
          <span>{session.user.email}</span>
          <span className="role-badge">{session.user.role}</span>
          <button className="button button-link" type="button" onClick={onLogout}>Cerrar sesión</button>
        </div>
      </aside>
      <main className="content">
        <header className="page-header">
          <div><p className="eyebrow">MANTENEDOR</p><h1>{title}</h1></div>
          <span className="api-status">API conectada</span>
        </header>
        {section === 'users' && <UsersMaintenance token={session.accessToken} currentUser={session.user} />}
        {section === 'expenses' && <ExpensesMaintenance token={session.accessToken} />}
        {section === 'categories' && <CategoriesMaintenance token={session.accessToken} />}
        {section === 'notifications' && <NotificationsMaintenance token={session.accessToken} />}
      </main>
    </div>
  )
}

function useList<T>(path: string, token: string) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setItems(await api.get<T[]>(path, token))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible cargar los datos.')
    } finally {
      setLoading(false)
    }
  }, [path, token])

  useEffect(() => { void reload() }, [reload])
  return { items, loading, error, reload }
}

function UsersMaintenance({ token, currentUser }: { token: string; currentUser: SessionUser }) {
  const { items, loading, error, reload } = useList<AdminUser>('/admin/users', token)
  const [editing, setEditing] = useState<AdminUser | null | undefined>()
  const [message, setMessage] = useState('')

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password') ?? '')
    const payload: UserPayload = {
      fullName: String(form.get('fullName')).trim(),
      email: String(form.get('email')).trim(),
      role: String(form.get('role')) as Role,
      ...(password ? { password } : {}),
    }
    try {
      if (editing) await api.put(`/admin/users/${editing.id}`, payload, token)
      else await api.post('/admin/users', payload, token)
      setEditing(undefined)
      setMessage('Usuario guardado correctamente.')
      await reload()
    } catch (requestError) { setMessage(errorMessage(requestError)) }
  }

  const remove = async (user: AdminUser) => {
    if (!confirm(`¿Eliminar a ${user.fullName}? También se eliminarán sus gastos y notificaciones.`)) return
    try { await api.remove(`/admin/users/${user.id}`, token); setMessage('Usuario eliminado.'); await reload() } catch (requestError) { setMessage(errorMessage(requestError)) }
  }

  return <section className="maintenance"><PanelActions onAdd={() => setEditing(null)} onRefresh={reload} label="Nuevo usuario" />
    {message && <Message text={message} isError={message.includes('No ') || message.includes('pued')} />}
    <DataState loading={loading} error={error} empty={items.length === 0} onRefresh={reload}>
      <Table headers={['Nombre', 'Correo', 'Rol', 'Creación', 'Acciones']}>
        {items.map((user) => <tr key={user.id}><td><strong>{user.fullName}</strong></td><td>{user.email}</td><td><span className="role-badge">{user.role}</span></td><td>{formatDate(user.createdAt)}</td><td className="actions"><button className="icon-button" onClick={() => setEditing(user)} title="Editar">✎</button><button className="icon-button danger" disabled={user.id === currentUser.id} onClick={() => void remove(user)} title="Eliminar">⌫</button></td></tr>)}
      </Table>
    </DataState>
    {editing !== undefined && <Modal title={editing ? 'Editar usuario' : 'Nuevo usuario'} onClose={() => setEditing(undefined)}><form key={editing?.id ?? 'new'} className="form-grid" onSubmit={save}><Field label="Nombre completo" name="fullName" defaultValue={editing?.fullName} required /><Field label="Correo" name="email" type="email" defaultValue={editing?.email} required /><SelectField label="Rol" name="role" defaultValue={editing?.role ?? 'USER'} options={['USER', 'ADMIN']} /><Field label={editing ? 'Nueva contraseña (opcional)' : 'Contraseña'} name="password" type="password" minLength={8} required={!editing} /><FormButtons onCancel={() => setEditing(undefined)} /></form></Modal>}
  </section>
}

function ExpensesMaintenance({ token }: { token: string }) {
  const expenses = useList<AdminExpense>('/admin/expenses', token)
  const users = useList<AdminUser>('/admin/users', token)
  const categories = useList<Category>('/admin/categories', token)
  const [editing, setEditing] = useState<AdminExpense | null | undefined>()
  const [message, setMessage] = useState('')

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const description = String(form.get('description') ?? '').trim()
    const payload: ExpensePayload = { userId: String(form.get('userId')), amount: Number(form.get('amount')), category: String(form.get('category')).trim(), date: String(form.get('date')), description: description || null, paymentMethod: String(form.get('paymentMethod')).trim() }
    try { if (editing) await api.put(`/admin/expenses/${editing.id}`, payload, token); else await api.post('/admin/expenses', payload, token); setEditing(undefined); setMessage('Gasto guardado correctamente.'); await expenses.reload() } catch (requestError) { setMessage(errorMessage(requestError)) }
  }

  const remove = async (expense: AdminExpense) => {
    if (!confirm('¿Eliminar este gasto?')) return
    try { await api.remove(`/admin/expenses/${expense.id}`, token); setMessage('Gasto eliminado.'); await expenses.reload() } catch (requestError) { setMessage(errorMessage(requestError)) }
  }

  return <section className="maintenance"><PanelActions onAdd={() => setEditing(null)} onRefresh={expenses.reload} label="Nuevo gasto" />
    {message && <Message text={message} isError={message.includes('No ')} />}
    <DataState loading={expenses.loading || users.loading || categories.loading} error={expenses.error || users.error || categories.error} empty={expenses.items.length === 0} onRefresh={expenses.reload}>
      <Table headers={['Fecha', 'Usuario', 'Categoría', 'Monto', 'Pago', 'Acciones']}>
        {expenses.items.map((expense) => <tr key={expense.id}><td>{formatSimpleDate(expense.date)}</td><td>{expense.userName}</td><td>{expense.category}</td><td><strong>{formatCurrency(expense.amount)}</strong></td><td>{expense.paymentMethod}</td><td className="actions"><button className="icon-button" onClick={() => setEditing(expense)} title="Editar">✎</button><button className="icon-button danger" onClick={() => void remove(expense)} title="Eliminar">⌫</button></td></tr>)}
      </Table>
    </DataState>
    {editing !== undefined && <Modal title={editing ? 'Editar gasto' : 'Nuevo gasto'} onClose={() => setEditing(undefined)}><form key={editing?.id ?? 'new'} className="form-grid" onSubmit={save}><SelectField label="Usuario" name="userId" defaultValue={editing?.userId ?? users.items[0]?.id ?? ''} options={users.items.map((user) => ({ value: user.id, label: `${user.fullName} · ${user.email}` }))} /><Field label="Monto" name="amount" type="number" defaultValue={editing?.amount ?? ''} min="0.01" step="0.01" required /><Field label="Categoría" name="category" defaultValue={editing?.category} list="categories" required /><datalist id="categories">{categories.items.map((category) => <option key={category.id} value={category.name} />)}</datalist><Field label="Fecha" name="date" type="date" defaultValue={editing?.date ?? today()} required /><Field label="Método de pago" name="paymentMethod" defaultValue={editing?.paymentMethod ?? 'Tarjeta'} required /><TextArea label="Descripción" name="description" defaultValue={editing?.description ?? ''} /><FormButtons onCancel={() => setEditing(undefined)} /></form></Modal>}
  </section>
}

function CategoriesMaintenance({ token }: { token: string }) {
  const { items, loading, error, reload } = useList<Category>('/admin/categories', token)
  const [editing, setEditing] = useState<Category | null | undefined>()
  const [message, setMessage] = useState('')

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const icon = String(form.get('icon') ?? '').trim()
    const payload: CategoryPayload = { name: String(form.get('name')).trim(), icon: icon || null, colorHex: String(form.get('colorHex') ?? '') || null }
    try { if (editing) await api.put(`/admin/categories/${editing.id}`, payload, token); else await api.post('/admin/categories', payload, token); setEditing(undefined); setMessage('Categoría guardada correctamente.'); await reload() } catch (requestError) { setMessage(errorMessage(requestError)) }
  }

  const remove = async (category: Category) => {
    if (!confirm(`¿Eliminar la categoría ${category.name}?`)) return
    try { await api.remove(`/admin/categories/${category.id}`, token); setMessage('Categoría eliminada.'); await reload() } catch (requestError) { setMessage(errorMessage(requestError)) }
  }

  return <section className="maintenance"><PanelActions onAdd={() => setEditing(null)} onRefresh={reload} label="Nueva categoría" />
    {message && <Message text={message} isError={message.includes('No ')} />}
    <DataState loading={loading} error={error} empty={items.length === 0} onRefresh={reload}>
      <Table headers={['Color', 'Icono', 'Nombre', 'Acciones']}>
        {items.map((category) => <tr key={category.id}><td><span className="color-dot" style={{ backgroundColor: category.colorHex ?? '#64748b' }} /></td><td>{category.icon ?? '—'}</td><td><strong>{category.name}</strong></td><td className="actions"><button className="icon-button" onClick={() => setEditing(category)} title="Editar">✎</button><button className="icon-button danger" onClick={() => void remove(category)} title="Eliminar">⌫</button></td></tr>)}
      </Table>
    </DataState>
    {editing !== undefined && <Modal title={editing ? 'Editar categoría' : 'Nueva categoría'} onClose={() => setEditing(undefined)}><form key={editing?.id ?? 'new'} className="form-grid" onSubmit={save}><Field label="Nombre" name="name" defaultValue={editing?.name} required /><Field label="Icono" name="icon" defaultValue={editing?.icon ?? ''} placeholder="Ej.: 🛒" /><ColorField label="Color" name="colorHex" defaultValue={editing?.colorHex ?? '#2563eb'} /><FormButtons onCancel={() => setEditing(undefined)} /></form></Modal>}
  </section>
}

function NotificationsMaintenance({ token }: { token: string }) {
  const notifications = useList<AppNotification>('/admin/notifications', token)
  const users = useList<AdminUser>('/admin/users', token)
  const [editing, setEditing] = useState<AppNotification | null | undefined>()
  const [message, setMessage] = useState('')

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload: NotificationPayload = { userId: String(form.get('userId')), title: String(form.get('title')).trim(), body: String(form.get('body')).trim(), read: form.get('read') === 'on' }
    try { if (editing) await api.put(`/admin/notifications/${editing.id}`, payload, token); else await api.post('/admin/notifications', payload, token); setEditing(undefined); setMessage('Notificación guardada correctamente.'); await notifications.reload() } catch (requestError) { setMessage(errorMessage(requestError)) }
  }

  const remove = async (notification: AppNotification) => {
    if (!confirm('¿Eliminar esta notificación?')) return
    try { await api.remove(`/admin/notifications/${notification.id}`, token); setMessage('Notificación eliminada.'); await notifications.reload() } catch (requestError) { setMessage(errorMessage(requestError)) }
  }

  return <section className="maintenance"><PanelActions onAdd={() => setEditing(null)} onRefresh={notifications.reload} label="Nueva notificación" />
    {message && <Message text={message} isError={message.includes('No ')} />}
    <DataState loading={notifications.loading || users.loading} error={notifications.error || users.error} empty={notifications.items.length === 0} onRefresh={notifications.reload}>
      <Table headers={['Estado', 'Usuario', 'Título', 'Mensaje', 'Creación', 'Acciones']}>
        {notifications.items.map((notification) => <tr key={notification.id}><td><span className={`status-badge ${notification.read ? 'muted-badge' : ''}`}>{notification.read ? 'Leída' : 'Pendiente'}</span></td><td>{notification.userName}</td><td><strong>{notification.title}</strong></td><td className="truncate">{notification.body}</td><td>{formatDate(notification.createdAt)}</td><td className="actions"><button className="icon-button" onClick={() => setEditing(notification)} title="Editar">✎</button><button className="icon-button danger" onClick={() => void remove(notification)} title="Eliminar">⌫</button></td></tr>)}
      </Table>
    </DataState>
    {editing !== undefined && <Modal title={editing ? 'Editar notificación' : 'Nueva notificación'} onClose={() => setEditing(undefined)}><form key={editing?.id ?? 'new'} className="form-grid" onSubmit={save}><SelectField label="Usuario" name="userId" defaultValue={editing?.userId ?? users.items[0]?.id ?? ''} options={users.items.map((user) => ({ value: user.id, label: `${user.fullName} · ${user.email}` }))} /><Field label="Título" name="title" defaultValue={editing?.title} required /><TextArea label="Mensaje" name="body" defaultValue={editing?.body ?? ''} required /><label className="checkbox-field"><input name="read" type="checkbox" defaultChecked={editing?.read ?? false} /> Marcar como leída</label><FormButtons onCancel={() => setEditing(undefined)} /></form></Modal>}
  </section>
}

function PanelActions({ onAdd, onRefresh, label }: { onAdd: () => void; onRefresh: () => void; label: string }) {
  return <div className="panel-actions"><button className="button button-secondary" type="button" onClick={onRefresh}>↻ Actualizar</button><button className="button button-primary" type="button" onClick={onAdd}>＋ {label}</button></div>
}

function DataState({ loading, error, empty, onRefresh, children }: { loading: boolean; error: string; empty: boolean; onRefresh: () => void; children: ReactNode }) {
  if (loading) return <div className="state-card">Cargando mantenedor…</div>
  if (error) return <div className="state-card error-state"><p>{error}</p><button className="button button-secondary" type="button" onClick={onRefresh}>Reintentar</button></div>
  if (empty) return <div className="state-card">No hay registros aún.</div>
  return <>{children}</>
}

function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return <div className="table-wrap"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><h2>{title}</h2><button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar">×</button></div>{children}</section></div>
}

function Field({ label, name, ...props }: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <label className="field"><span>{label}</span><input name={name} {...props} /></label>
}

function TextArea({ label, name, ...props }: { label: string; name: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <label className="field field-wide"><span>{label}</span><textarea name={name} rows={4} {...props} /></label>
}

function ColorField({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return <label className="field"><span>{label}</span><input name={name} type="color" defaultValue={defaultValue} /></label>
}

function SelectField({ label, name, options, defaultValue }: { label: string; name: string; options: Array<string | { value: string; label: string }>; defaultValue: string }) {
  return <label className="field"><span>{label}</span><select name={name} defaultValue={defaultValue} required>{options.map((option) => { const item = typeof option === 'string' ? { value: option, label: option } : option; return <option key={item.value} value={item.value}>{item.label}</option> })}</select></label>
}

function FormButtons({ onCancel }: { onCancel: () => void }) {
  return <div className="form-buttons field-wide"><button className="button button-secondary" type="button" onClick={onCancel}>Cancelar</button><button className="button button-primary" type="submit">Guardar</button></div>
}

function Message({ text, isError }: { text: string; isError: boolean }) {
  return <p className={`message ${isError ? 'message-error' : 'message-success'}`}>{text}</p>
}

function errorMessage(error: unknown) { return error instanceof Error ? error.message : 'No fue posible completar la operación.' }
function formatCurrency(value: number) { return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value) }
function formatDate(value: string) { return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) }
function formatSimpleDate(value: string) { return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(new Date(`${value}T12:00:00`)) }
function today() { return new Date().toISOString().slice(0, 10) }

export default App
