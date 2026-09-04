import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

/**
 * Código de terceros que vive dentro del repo: shadcn (`components.json`), animate-ui y los
 * gráficos. Se genera con la CLI y se vuelve a bajar cuando hay que actualizarlo, así que no se
 * edita a mano — arreglar sus hallazgos nos alejaría de upstream y haría conflictuar la próxima
 * actualización. Se compila y se testea como todo lo demás; sólo no se lo audita con nuestras
 * reglas. `src/components/shared` NO entra acá: eso lo escribimos nosotros.
 */
const VENDORED_UI = [
  'src/components/ui/**',
  'src/components/animate-ui/**',
  'src/components/charts/**',
  'src/hooks/**',
]

export default defineConfig([
  globalIgnores(['dist', 'src/routeTree.gen.ts']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Un nombre que arranca con guion bajo es la forma de decir "existe por la firma, no lo uso".
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    /**
     * Los archivos de ruta de TanStack Router.
     *
     * La regla pide que un archivo exporte sólo componentes, para que Fast Refresh pueda
     * reemplazarlos sin perder el estado. Un archivo de ruta está obligado a exportar además su
     * `Route`, que es lo que el plugin lee para generar `routeTree.gen.ts`: la regla es
     * inaplicable acá por construcción, no es algo que se pueda arreglar escribiendo mejor.
     *
     * Apagarla es lo que hace que el lint sirva de gate: si no, cada ruta nueva suma dos errores
     * y el número crece para siempre hasta que nadie lo mira.
     */
    files: ['src/routes/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: VENDORED_UI,
    rules: {
      'react-refresh/only-export-components': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
])
