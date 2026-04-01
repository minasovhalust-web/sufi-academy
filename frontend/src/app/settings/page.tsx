'use client'

import { useRef, useState } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuthStore } from '@/store/auth.store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getInitials } from '@/lib/utils'
import { usersApi } from '@/lib/api'
import { COUNTRIES, getCountryLabel } from '@/lib/countries'
import { Camera, Loader2, CheckCircle2, AlertCircle, Save } from 'lucide-react'
import type { User } from '@/types'


// ── Avatar upload widget ────────────────────────────────────────────────────

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

function AvatarUpload() {
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [preview, setPreview] = useState<string | null>(null)

  const initials = getInitials(user?.firstName ?? '', user?.lastName ?? '')
  const avatarSrc = preview ?? user?.avatarUrl ?? null

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setStatus('uploading')
    setErrorMsg('')
    try {
      const res = await usersApi.uploadAvatar(file)
      const updated: User = res.data
      setUser(updated)
      setPreview(null)
      setStatus('success')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Не удалось загрузить фото'
      setErrorMsg(msg)
      setStatus('error')
      setPreview(null)
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
      <div className="relative shrink-0">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center ring-2 ring-white shadow-md">
          {avatarSrc ? (
            <img src={avatarSrc} alt={user?.firstName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-indigo-600 select-none">{initials}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={status === 'uploading'}
          className="absolute -bottom-1 -right-1 bg-white border border-gray-200 shadow-sm rounded-full p-1.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
          title="Изменить фото"
        >
          {status === 'uploading' ? (
            <Loader2 className="h-3.5 w-3.5 text-indigo-500 animate-spin" />
          ) : (
            <Camera className="h-3.5 w-3.5 text-gray-500" />
          )}
        </button>
      </div>
      <div className="flex flex-col items-center sm:items-start gap-3 text-center sm:text-left">
        <div>
          <p className="font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={status === 'uploading'}
          onClick={() => fileRef.current?.click()}
          className="gap-2"
        >
          {status === 'uploading' ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Загрузка…</>
          ) : (
            <><Camera className="h-4 w-4" />Изменить фото</>
          )}
        </Button>
        <p className="text-xs text-gray-400">JPG, PNG или GIF · до 5 МБ</p>
        {status === 'success' && (
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <CheckCircle2 className="h-3.5 w-3.5" />Фото обновлено
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-1.5 text-xs text-red-500">
            <AlertCircle className="h-3.5 w-3.5" />{errorMsg}
          </div>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}

// ── Country select widget ──────────────────────────────────────────────────

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function CountrySelect() {
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const [selected, setSelected] = useState<string>(user?.country ?? '')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const isDirty = selected !== (user?.country ?? '')

  async function handleSave() {
    if (!user) return
    setSaveStatus('saving')
    setErrorMsg('')
    try {
      const res = await usersApi.updateMe(user.id, { country: selected || null })
      const updated: User = res.data
      setUser(updated)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Не удалось сохранить'
      setErrorMsg(msg)
      setSaveStatus('error')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3 items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="country">Страна</Label>
          <Select
            value={selected}
            onValueChange={(v) => { setSelected(v); setSaveStatus('idle') }}
          >
            <SelectTrigger id="country">
              <SelectValue placeholder="Выберите страну…" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleSave}
          disabled={!isDirty || saveStatus === 'saving'}
          size="sm"
          className="gap-2 shrink-0"
        >
          {saveStatus === 'saving' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Сохранить
        </Button>
      </div>
      {saveStatus === 'saved' && (
        <div className="flex items-center gap-1.5 text-xs text-green-600">
          <CheckCircle2 className="h-3.5 w-3.5" />Страна сохранена
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="flex items-center gap-1.5 text-xs text-red-500">
          <AlertCircle className="h-3.5 w-3.5" />{errorMsg}
        </div>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user)

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="container-base py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Настройки профиля</h1>

          <div className="max-w-2xl space-y-6">

            {/* ── Фото профиля ── */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Фото профиля</CardTitle>
                <CardDescription>
                  Загрузите фото, которое будет видно другим пользователям
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AvatarUpload />
              </CardContent>
            </Card>

            {/* ── Личная информация ── */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Личная информация</CardTitle>
                <CardDescription>
                  Управляйте своей учётной записью и персональной информацией
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Имя</Label>
                    <Input id="firstName" value={user?.firstName || ''} disabled className="bg-gray-50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Фамилия</Label>
                    <Input id="lastName" value={user?.lastName || ''} disabled className="bg-gray-50" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={user?.email || ''} disabled className="bg-gray-50" />
                </div>
                {user?.bio && (
                  <div className="space-y-2">
                    <Label htmlFor="bio">О себе</Label>
                    <Input id="bio" value={user.bio} disabled className="bg-gray-50" />
                  </div>
                )}
                <p className="text-xs text-gray-400 pt-2">
                  Для изменения имени или email свяжитесь с администратором
                </p>
              </CardContent>
            </Card>

            {/* ── Страна ── */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Местоположение</CardTitle>
                <CardDescription>
                  Укажите вашу страну — она будет видна преподавателям и администраторам
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CountrySelect />
              </CardContent>
            </Card>

            {/* ── Аккаунт ── */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Информация аккаунта</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Роль</Label>
                  <Input
                    id="role"
                    value={
                      user?.role === 'STUDENT' ? 'Студент'
                        : user?.role === 'TEACHER' ? 'Учитель'
                        : 'Администратор'
                    }
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Статус</Label>
                  <Input id="status" value={user?.isActive ? 'Активен' : 'Неактивен'} disabled className="bg-gray-50" />
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
