import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Dashboard from './Dashboard'
import Editor from './Editor'
import './sheet.css'

// Data router so the Editor can use useBlocker() to guard unsaved changes.
const router = createBrowserRouter([
  { path: '/', element: <Dashboard /> },
  { path: '/sheet/:id', element: <Editor /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
