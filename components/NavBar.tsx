import { getCurrentUser } from '@/lib/auth'
import { NavBarClient } from './NavBarClient'

export async function NavBar() {
  const user = await getCurrentUser()
  const isLoggedIn = !!user
  const isAdmin = user?.isAdmin === true

  return <NavBarClient isLoggedIn={isLoggedIn} isAdmin={isAdmin} />
}
