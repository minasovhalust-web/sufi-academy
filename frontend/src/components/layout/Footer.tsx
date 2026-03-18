import Link from 'next/link'

const StarIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-white">
      <div className="container-base py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="text-[var(--color-primary)]">
                <StarIcon />
              </div>
              <h3 className="font-semibold text-sm">Академия Суфийской Философии</h3>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Путь знания и духовного роста
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-4">
            <h4 className="font-semibold text-sm">Ссылки</h4>
            <div className="flex flex-col gap-2">
              <Link
                href="/courses"
                className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
              >
                Курсы
              </Link>
              <Link
                href="/"
                className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
              >
                О нас
              </Link>
              <Link
                href="/"
                className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
              >
                Контакты
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-4">
            <h4 className="font-semibold text-sm">Контакты</h4>
            <div className="text-sm text-[var(--color-text-secondary)] space-y-1">
              <p>Email: info@sufi-academy.ru</p>
              <p>Телефон: +7 (999) 123-45-67</p>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--color-border)] pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-[var(--color-text-secondary)]">
            © 2024 Академия Суфийской Философии. Все права защищены.
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link
              href="/"
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
            >
              Политика конфиденциальности
            </Link>
            <Link
              href="/"
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
            >
              Условия использования
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
