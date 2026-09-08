import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './ThemedToastContainer.css'
import { useTheme } from '../../hooks/useTheme.ts'

export function ThemedToastContainer() {
  const { theme } = useTheme()
  return (
    <ToastContainer
      position="top-right"
      autoClose={3500}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={theme === 'light' ? 'light' : 'dark'}
    />
  )
}
