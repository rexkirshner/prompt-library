import { getCurrentUser } from '@/lib/auth'
import { NavBarClient } from './NavBarClient'

export async function NavBar() {
  const user = await getCurrentUser()
  const isLoggedIn = !!user

  return <NavBarClient isLoggedIn={isLoggedIn} />
}
