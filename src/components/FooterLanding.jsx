import React from 'react'

const FooterLanding = ()=>{
  return (
    <footer className="bg-gray-900 text-gray-200 py-12 mt-12">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <img src="/logo.png" alt="logo footer" className='h-24 pb-0' />
          <p className="text-sm mt-2">Service profesional. Atención rápida y personalizada.</p>
        </div>
        <div>
          <h5 className="font-semibold pb-1">Contacto</h5>
          <p className="text-sm text-primary-600">Suc. Santiago 485</p>
          <p className="text-sm mt-1">Tel: +54 9 381 301-9203</p>
          <p className="text-sm text-primary-600 mt-3">Suc. Solano Vera 75</p>
          <p className="text-sm mt-1">Tel: +54 9 381 350-0955</p>
          <p className="text-sm text-primary-600 mt-3">Suc. Av. Perón 139</p>
          <p className="text-sm mt-1">Tel: +54 9 381 473-9136</p>
        </div>
        <div>
          <h5 className="font-semibold">Horarios</h5>
          <p className="text-sm mt-2">Lun - Vie: 08:30 - 13:00 | 17:00 - 21:00</p>
          <p className="text-sm">Sáb: 08:30 - 13:00</p>
        </div>
      </div>
      <div className="container mx-auto px-6 mt-8 text-center text-sm text-gray-500">© {new Date().getFullYear()} Grupo yuhmak. Todos los derechos reservados.</div>
    </footer>
  )
}

export default FooterLanding
