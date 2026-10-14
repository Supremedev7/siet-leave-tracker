import 'react'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { AppRouter } from '@/routes/AppRouter'
import { Toaster } from 'sonner'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRouter />
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              fontFamily: 'Montserrat, sans-serif',
              fontSize: '13px',
              fontWeight: '500',
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
