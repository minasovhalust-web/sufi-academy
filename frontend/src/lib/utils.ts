import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'только что'
  if (minutes < 60) return `${minutes} мин. назад`
  if (hours < 24) return `${hours} ч. назад`
  return `${days} дн. назад`
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0]}${lastName[0]}`.toUpperCase()
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    STUDENT: 'Студент',
    TEACHER: 'Учитель',
    ADMIN: 'Администратор',
  }
  return labels[role] || role
}

export function getCourseStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: 'Черновик',
    PUBLISHED: 'Опубликован',
    ARCHIVED: 'Архив',
  }
  return labels[status] || status
}

export function getEnrollmentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: 'В процессе',
    COMPLETED: 'Завершен',
    CANCELLED: 'Отменен',
  }
  return labels[status] || status
}

export function getMaterialTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    VIDEO: 'Видео',
    AUDIO: 'Аудио',
    PDF: 'PDF',
    TEXT: 'Текст',
    LINK: 'Ссылка',
  }
  return labels[type] || type
}

export function colorVariantFromId(id: string): 'primary' | 'accent' | 'slate' {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const variants: ('primary' | 'accent' | 'slate')[] = ['primary', 'accent', 'slate']
  return variants[hash % variants.length]
}
