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
import { Camera, Loader2, CheckCircle2, AlertCircle, Save } from 'lucide-react'
import type { User } from '@/types'

// ── Country list ───────────────────────────────────────────────────────────

export const COUNTRIES: { code: string; name: string; flag: string }[] = [
  { code: 'AF', name: 'Афганистан', flag: '🇦🇫' },
  { code: 'AL', name: 'Албания', flag: '🇦🇱' },
  { code: 'DZ', name: 'Алжир', flag: '🇩🇿' },
  { code: 'AD', name: 'Андорра', flag: '🇦🇩' },
  { code: 'AO', name: 'Ангола', flag: '🇦🇴' },
  { code: 'AG', name: 'Антигуа и Барбуда', flag: '🇦🇬' },
  { code: 'AR', name: 'Аргентина', flag: '🇦🇷' },
  { code: 'AM', name: 'Армения', flag: '🇦🇲' },
  { code: 'AU', name: 'Австралия', flag: '🇦🇺' },
  { code: 'AT', name: 'Австрия', flag: '🇦🇹' },
  { code: 'AZ', name: 'Азербайджан', flag: '🇦🇿' },
  { code: 'BS', name: 'Багамы', flag: '🇧🇸' },
  { code: 'BH', name: 'Бахрейн', flag: '🇧🇭' },
  { code: 'BD', name: 'Бангладеш', flag: '🇧🇩' },
  { code: 'BB', name: 'Барбадос', flag: '🇧🇧' },
  { code: 'BY', name: 'Беларусь', flag: '🇧🇾' },
  { code: 'BE', name: 'Бельгия', flag: '🇧🇪' },
  { code: 'BZ', name: 'Белиз', flag: '🇧🇿' },
  { code: 'BJ', name: 'Бенин', flag: '🇧🇯' },
  { code: 'BT', name: 'Бутан', flag: '🇧🇹' },
  { code: 'BO', name: 'Боливия', flag: '🇧🇴' },
  { code: 'BA', name: 'Босния и Герцеговина', flag: '🇧🇦' },
  { code: 'BW', name: 'Ботсвана', flag: '🇧🇼' },
  { code: 'BR', name: 'Бразилия', flag: '🇧🇷' },
  { code: 'BN', name: 'Бруней', flag: '🇧🇳' },
  { code: 'BG', name: 'Болгария', flag: '🇧🇬' },
  { code: 'BF', name: 'Буркина-Фасо', flag: '🇧🇫' },
  { code: 'BI', name: 'Бурунди', flag: '🇧🇮' },
  { code: 'CV', name: 'Кабо-Верде', flag: '🇨🇻' },
  { code: 'KH', name: 'Камбоджа', flag: '🇰🇭' },
  { code: 'CM', name: 'Камерун', flag: '🇨🇲' },
  { code: 'CA', name: 'Канада', flag: '🇨🇦' },
  { code: 'CF', name: 'ЦАР', flag: '🇨🇫' },
  { code: 'TD', name: 'Чад', flag: '🇹🇩' },
  { code: 'CL', name: 'Чили', flag: '🇨🇱' },
  { code: 'CN', name: 'Китай', flag: '🇨🇳' },
  { code: 'CO', name: 'Колумбия', flag: '🇨🇴' },
  { code: 'KM', name: 'Коморы', flag: '🇰🇲' },
  { code: 'CG', name: 'Конго', flag: '🇨🇬' },
  { code: 'CD', name: 'ДР Конго', flag: '🇨🇩' },
  { code: 'CR', name: 'Коста-Рика', flag: '🇨🇷' },
  { code: 'HR', name: 'Хорватия', flag: '🇭🇷' },
  { code: 'CU', name: 'Куба', flag: '🇨🇺' },
  { code: 'CY', name: 'Кипр', flag: '🇨🇾' },
  { code: 'CZ', name: 'Чехия', flag: '🇨🇿' },
  { code: 'DK', name: 'Дания', flag: '🇩🇰' },
  { code: 'DJ', name: 'Джибути', flag: '🇩🇯' },
  { code: 'DM', name: 'Доминика', flag: '🇩🇲' },
  { code: 'DO', name: 'Доминиканская Республика', flag: '🇩🇴' },
  { code: 'EC', name: 'Эквадор', flag: '🇪🇨' },
  { code: 'EG', name: 'Египет', flag: '🇪🇬' },
  { code: 'SV', name: 'Сальвадор', flag: '🇸🇻' },
  { code: 'GQ', name: 'Экваториальная Гвинея', flag: '🇬🇶' },
  { code: 'ER', name: 'Эритрея', flag: '🇪🇷' },
  { code: 'EE', name: 'Эстония', flag: '🇪🇪' },
  { code: 'SZ', name: 'Эсватини', flag: '🇸🇿' },
  { code: 'ET', name: 'Эфиопия', flag: '🇪🇹' },
  { code: 'FJ', name: 'Фиджи', flag: '🇫🇯' },
  { code: 'FI', name: 'Финляндия', flag: '🇫🇮' },
  { code: 'FR', name: 'Франция', flag: '🇫🇷' },
  { code: 'GA', name: 'Габон', flag: '🇬🇦' },
  { code: 'GM', name: 'Гамбия', flag: '🇬🇲' },
  { code: 'GE', name: 'Грузия', flag: '🇬🇪' },
  { code: 'DE', name: 'Германия', flag: '🇩🇪' },
  { code: 'GH', name: 'Гана', flag: '🇬🇭' },
  { code: 'GR', name: 'Греция', flag: '🇬🇷' },
  { code: 'GD', name: 'Гренада', flag: '🇬🇩' },
  { code: 'GT', name: 'Гватемала', flag: '🇬🇹' },
  { code: 'GN', name: 'Гвинея', flag: '🇬🇳' },
  { code: 'GW', name: 'Гвинея-Бисау', flag: '🇬🇼' },
  { code: 'GY', name: 'Гайана', flag: '🇬🇾' },
  { code: 'HT', name: 'Гаити', flag: '🇭🇹' },
  { code: 'HN', name: 'Гондурас', flag: '🇭🇳' },
  { code: 'HU', name: 'Венгрия', flag: '🇭🇺' },
  { code: 'IS', name: 'Исландия', flag: '🇮🇸' },
  { code: 'IN', name: 'Индия', flag: '🇮🇳' },
  { code: 'ID', name: 'Индонезия', flag: '🇮🇩' },
  { code: 'IR', name: 'Иран', flag: '🇮🇷' },
  { code: 'IQ', name: 'Ирак', flag: '🇮🇶' },
  { code: 'IE', name: 'Ирландия', flag: '🇮🇪' },
  { code: 'IL', name: 'Израиль', flag: '🇮🇱' },
  { code: 'IT', name: 'Италия', flag: '🇮🇹' },
  { code: 'JM', name: 'Ямайка', flag: '🇯🇲' },
  { code: 'JP', name: 'Япония', flag: '🇯🇵' },
  { code: 'JO', name: 'Иордания', flag: '🇯🇴' },
  { code: 'KZ', name: 'Казахстан', flag: '🇰🇿' },
  { code: 'KE', name: 'Кения', flag: '🇰🇪' },
  { code: 'KI', name: 'Кирибати', flag: '🇰🇮' },
  { code: 'KW', name: 'Кувейт', flag: '🇰🇼' },
  { code: 'KG', name: 'Киргизия', flag: '🇰🇬' },
  { code: 'LA', name: 'Лаос', flag: '🇱🇦' },
  { code: 'LV', name: 'Латвия', flag: '🇱🇻' },
  { code: 'LB', name: 'Ливан', flag: '🇱🇧' },
  { code: 'LS', name: 'Лесото', flag: '🇱🇸' },
  { code: 'LR', name: 'Либерия', flag: '🇱🇷' },
  { code: 'LY', name: 'Ливия', flag: '🇱🇾' },
  { code: 'LI', name: 'Лихтенштейн', flag: '🇱🇮' },
  { code: 'LT', name: 'Литва', flag: '🇱🇹' },
  { code: 'LU', name: 'Люксембург', flag: '🇱🇺' },
  { code: 'MG', name: 'Мадагаскар', flag: '🇲🇬' },
  { code: 'MW', name: 'Малави', flag: '🇲🇼' },
  { code: 'MY', name: 'Малайзия', flag: '🇲🇾' },
  { code: 'MV', name: 'Мальдивы', flag: '🇲🇻' },
  { code: 'ML', name: 'Мали', flag: '🇲🇱' },
  { code: 'MT', name: 'Мальта', flag: '🇲🇹' },
  { code: 'MH', name: 'Маршалловы Острова', flag: '🇲🇭' },
  { code: 'MR', name: 'Мавритания', flag: '🇲🇷' },
  { code: 'MU', name: 'Маврикий', flag: '🇲🇺' },
  { code: 'MX', name: 'Мексика', flag: '🇲🇽' },
  { code: 'FM', name: 'Микронезия', flag: '🇫🇲' },
  { code: 'MD', name: 'Молдова', flag: '🇲🇩' },
  { code: 'MC', name: 'Монако', flag: '🇲🇨' },
  { code: 'MN', name: 'Монголия', flag: '🇲🇳' },
  { code: 'ME', name: 'Черногория', flag: '🇲🇪' },
  { code: 'MA', name: 'Марокко', flag: '🇲🇦' },
  { code: 'MZ', name: 'Мозамбик', flag: '🇲🇿' },
  { code: 'MM', name: 'Мьянма', flag: '🇲🇲' },
  { code: 'NA', name: 'Намибия', flag: '🇳🇦' },
  { code: 'NR', name: 'Науру', flag: '🇳🇷' },
  { code: 'NP', name: 'Непал', flag: '🇳🇵' },
  { code: 'NL', name: 'Нидерланды', flag: '🇳🇱' },
  { code: 'NZ', name: 'Новая Зеландия', flag: '🇳🇿' },
  { code: 'NI', name: 'Никарагуа', flag: '🇳🇮' },
  { code: 'NE', name: 'Нигер', flag: '🇳🇪' },
  { code: 'NG', name: 'Нигерия', flag: '🇳🇬' },
  { code: 'NO', name: 'Норвегия', flag: '🇳🇴' },
  { code: 'OM', name: 'Оман', flag: '🇴🇲' },
  { code: 'PK', name: 'Пакистан', flag: '🇵🇰' },
  { code: 'PW', name: 'Палау', flag: '🇵🇼' },
  { code: 'PA', name: 'Панама', flag: '🇵🇦' },
  { code: 'PG', name: 'Папуа — Новая Гвинея', flag: '🇵🇬' },
  { code: 'PY', name: 'Парагвай', flag: '🇵🇾' },
  { code: 'PE', name: 'Перу', flag: '🇵🇪' },
  { code: 'PH', name: 'Филиппины', flag: '🇵🇭' },
  { code: 'PL', name: 'Польша', flag: '🇵🇱' },
  { code: 'PT', name: 'Португалия', flag: '🇵🇹' },
  { code: 'QA', name: 'Катар', flag: '🇶🇦' },
  { code: 'RO', name: 'Румыния', flag: '🇷🇴' },
  { code: 'RU', name: 'Россия', flag: '🇷🇺' },
  { code: 'RW', name: 'Руанда', flag: '🇷🇼' },
  { code: 'KN', name: 'Сент-Китс и Невис', flag: '🇰🇳' },
  { code: 'LC', name: 'Сент-Люсия', flag: '🇱🇨' },
  { code: 'VC', name: 'Сент-Винсент и Гренадины', flag: '🇻🇨' },
  { code: 'WS', name: 'Самоа', flag: '🇼🇸' },
  { code: 'SM', name: 'Сан-Марино', flag: '🇸🇲' },
  { code: 'ST', name: 'Сан-Томе и Принсипи', flag: '🇸🇹' },
  { code: 'SA', name: 'Саудовская Аравия', flag: '🇸🇦' },
  { code: 'SN', name: 'Сенегал', flag: '🇸🇳' },
  { code: 'RS', name: 'Сербия', flag: '🇷🇸' },
  { code: 'SC', name: 'Сейшелы', flag: '🇸🇨' },
  { code: 'SL', name: 'Сьерра-Леоне', flag: '🇸🇱' },
  { code: 'SG', name: 'Сингапур', flag: '🇸🇬' },
  { code: 'SK', name: 'Словакия', flag: '🇸🇰' },
  { code: 'SI', name: 'Словения', flag: '🇸🇮' },
  { code: 'SB', name: 'Соломоновы Острова', flag: '🇸🇧' },
  { code: 'SO', name: 'Сомали', flag: '🇸🇴' },
  { code: 'ZA', name: 'ЮАР', flag: '🇿🇦' },
  { code: 'SS', name: 'Южный Судан', flag: '🇸🇸' },
  { code: 'ES', name: 'Испания', flag: '🇪🇸' },
  { code: 'LK', name: 'Шри-Ланка', flag: '🇱🇰' },
  { code: 'SD', name: 'Судан', flag: '🇸🇩' },
  { code: 'SR', name: 'Суринам', flag: '🇸🇷' },
  { code: 'SE', name: 'Швеция', flag: '🇸🇪' },
  { code: 'CH', name: 'Швейцария', flag: '🇨🇭' },
  { code: 'SY', name: 'Сирия', flag: '🇸🇾' },
  { code: 'TW', name: 'Тайвань', flag: '🇹🇼' },
  { code: 'TJ', name: 'Таджикистан', flag: '🇹🇯' },
  { code: 'TZ', name: 'Танзания', flag: '🇹🇿' },
  { code: 'TH', name: 'Таиланд', flag: '🇹🇭' },
  { code: 'TL', name: 'Тимор-Лесте', flag: '🇹🇱' },
  { code: 'TG', name: 'Того', flag: '🇹🇬' },
  { code: 'TO', name: 'Тонга', flag: '🇹🇴' },
  { code: 'TT', name: 'Тринидад и Тобаго', flag: '🇹🇹' },
  { code: 'TN', name: 'Тунис', flag: '🇹🇳' },
  { code: 'TR', name: 'Турция', flag: '🇹🇷' },
  { code: 'TM', name: 'Туркменистан', flag: '🇹🇲' },
  { code: 'TV', name: 'Тувалу', flag: '🇹🇻' },
  { code: 'UG', name: 'Уганда', flag: '🇺🇬' },
  { code: 'UA', name: 'Украина', flag: '🇺🇦' },
  { code: 'AE', name: 'ОАЭ', flag: '🇦🇪' },
  { code: 'GB', name: 'Великобритания', flag: '🇬🇧' },
  { code: 'US', name: 'США', flag: '🇺🇸' },
  { code: 'UY', name: 'Уругвай', flag: '🇺🇾' },
  { code: 'UZ', name: 'Узбекистан', flag: '🇺🇿' },
  { code: 'VU', name: 'Вануату', flag: '🇻🇺' },
  { code: 'VE', name: 'Венесуэла', flag: '🇻🇪' },
  { code: 'VN', name: 'Вьетнам', flag: '🇻🇳' },
  { code: 'YE', name: 'Йемен', flag: '🇾🇪' },
  { code: 'ZM', name: 'Замбия', flag: '🇿🇲' },
  { code: 'ZW', name: 'Зимбабве', flag: '🇿🇼' },
]

/** Возвращает флаг + название страны по коду */
export function getCountryLabel(code: string | null | undefined): string {
  if (!code) return ''
  const c = COUNTRIES.find((x) => x.code === code)
  return c ? `${c.flag} ${c.name}` : code
}

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
