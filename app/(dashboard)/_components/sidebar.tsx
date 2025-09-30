import Logo from './logo'
import { SidebarRoutes } from './sidebar-routes'

const Sidebar = () => {
  return (
    <div className="flex h-full flex-col overflow-y-auto border-r bg-background/95 backdrop-blur-sm">
      <div className="px-6 py-6">
        <Logo />
      </div>
      <div className="flex w-full flex-col px-0">
        <SidebarRoutes />
      </div>
    </div>
  )
}

export default Sidebar