import LanguageSelector from '@/components/LanguageSelector'
import { resetPasswordForEmail } from './actions'
import { getDictionary, getLocale } from '@/dictionaries'
import { Sprout, ArrowLeft, Mail } from 'lucide-react'

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; admin?: string }>
}) {
  const params = await searchParams
  const locale = await getLocale()
  const dict = await getDictionary(locale)
  const d = dict.auth?.forgot_password || {
    title: 'Mot de passe oublié',
    desc: 'Entrez votre identifiant, téléphone ou adresse e-mail pour réinitialiser votre mot de passe.',
    email: 'Identifiant, téléphone ou e-mail',
    submit: 'Envoyer le lien',
    back_to_login: 'Retour à la connexion',
  }

  const isAdmin = params?.admin === '1'
  const message = params?.message

  const isSuccess = message && (
    message.includes('succès') ||
    message.includes('Vérifiez') ||
    message.includes('envoyé') ||
    message.includes('transmis')
  )

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8 bg-background relative">
      <div className="absolute top-4 right-4">
        <LanguageSelector currentLang={locale} />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-md">
            <Sprout className="w-7 h-7" />
          </div>
        </div>
        <div className="text-center">
          <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
            {isAdmin ? 'Espace Administration' : 'D-FERME'}
          </span>
        </div>
        <h2 className="mt-3 text-center text-2xl font-bold leading-9 tracking-tight text-foreground">
          {d.title}
        </h2>
        <p className="mt-2 text-center text-sm text-foreground-muted max-w-sm mx-auto">
          {d.desc}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface p-8 shadow-sm rounded-2xl border border-surface-border">
          {message && (
            <div
              className={`mb-6 p-4 rounded-xl text-sm font-medium text-center ${
                isSuccess
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'bg-danger/10 text-danger border border-danger/20'
              }`}
            >
              {message}
            </div>
          )}

          <form className="space-y-6" action={resetPasswordForEmail}>
            {isAdmin && <input type="hidden" name="admin" value="1" />}

            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-foreground">
                {d.email || 'Identifiant, téléphone ou e-mail'}
              </label>
              <div className="mt-2 relative">
                <input
                  id="email"
                  name="email"
                  type="text"
                  autoComplete="username"
                  placeholder="ex: ferme_ndiaye, 771234567 ou email@domaine.com"
                  required
                  className="block w-full rounded-xl border border-surface-border py-2.5 px-3.5 bg-background text-foreground shadow-xs focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>{d.submit || 'Envoyer le lien'}</span>
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-surface-border text-center">
            <a
              href={isAdmin ? '/admin/login' : '/login'}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
            >
              <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" />
              <span>{d.back_to_login || 'Retour à la connexion'}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
