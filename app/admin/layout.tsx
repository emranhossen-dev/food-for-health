import { redirect } from 'next/navigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TODO: Add authentication check here
  // For now, we'll allow access to the admin panel
  
  return (
    <div className="min-h-screen bg-gray-900">
      {children}
    </div>
  )
}
