// import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
// import { AppSidebar } from "@/components/sidebar/app-sidebar"

// export default function Layout({ children }: { children: React.ReactNode }) {
//   return (
//     <SidebarProvider>
//       <AppSidebar />
//       <main>
//         <SidebarTrigger />
//         {children}
//       </main>
//     </SidebarProvider>
//   )
// }

// src/layout.tsx
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { Outlet } from "react-router-dom"; // Usamos Outlet para renderizar las rutas internas.

export default function Layout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="ml-4 mt-2"> {/* Ajusta la clase según el ancho de tu sidebar */}
        <SidebarTrigger className="" />
        <div className="p-4">
          <Outlet /> {/* Aquí se renderizan las rutas internas */}
        </div>
      </main>
    </SidebarProvider>
  );
}
