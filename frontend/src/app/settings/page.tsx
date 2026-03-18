'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuthStore } from '@/store/auth.store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user)

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white">
        <div className="container-base py-12">
          <h1 className="text-4xl font-bold mb-8">Настройки профиля</h1>

          {/* Profile Section */}
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Информация профиля</CardTitle>
              <CardDescription>
                Управляйте своей учетной записью и персональной информацией
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-8">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.firstName} />}
                  <AvatarFallback>{getInitials(user?.firstName || '', user?.lastName || '')}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{user?.firstName} {user?.lastName}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">{user?.email}</p>
                </div>
              </div>

              {/* Personal Info */}
              <div className="space-y-4">
                <h3 className="font-semibold">Личная информация</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Имя</Label>
                    <Input
                      id="firstName"
                      value={user?.firstName || ''}
                      disabled
                      className="bg-[var(--color-background-secondary)]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Фамилия</Label>
                    <Input
                      id="lastName"
                      value={user?.lastName || ''}
                      disabled
                      className="bg-[var(--color-background-secondary)]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-[var(--color-background-secondary)]"
                  />
                </div>

                {user?.bio && (
                  <div className="space-y-2">
                    <Label htmlFor="bio">О себе</Label>
                    <Input
                      id="bio"
                      value={user.bio}
                      disabled
                      className="bg-[var(--color-background-secondary)]"
                    />
                  </div>
                )}
              </div>

              {/* Account Info */}
              <div className="space-y-4">
                <h3 className="font-semibold">Информация аккаунта</h3>
                <div className="space-y-2">
                  <Label htmlFor="role">Роль</Label>
                  <Input
                    id="role"
                    value={
                      user?.role === 'STUDENT'
                        ? 'Студент'
                        : user?.role === 'TEACHER'
                          ? 'Учитель'
                          : 'Администратор'
                    }
                    disabled
                    className="bg-[var(--color-background-secondary)]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Статус</Label>
                  <Input
                    id="status"
                    value={user?.isActive ? 'Активен' : 'Неактивен'}
                    disabled
                    className="bg-[var(--color-background-secondary)]"
                  />
                </div>
              </div>

              <p className="text-xs text-[var(--color-text-secondary)]">
                Для изменения информации профиля свяжитесь с администратором
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
