import React, {useEffect, useRef} from 'react'

const services = [
  {id:1, title:'Service Completo', desc:'Inspección, limpieza y ajuste general'},
  {id:2, title:'Alineación de ruedas', desc:'Trueque y ajuste para ruedas perfectas'},
  {id:3, title:'Frenos y cambio', desc:'Ajuste y reemplazo de pastillas/cables'},
  {id:4, title:'Suspensión', desc:'Mantenimiento y servicio de amortiguadores'},
  {id:5, title:'Instalación de accesorios', desc:'Accesorios, luces, portapaquetes'},
  {id:6, title:'Personalizado', desc:'Modificaciones a medida para tu bici'},
  
]

const icons = {
  1: (<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L8 21l-2-1 1.75-4M15.75 7L17 3l2 1-1.75 4M12 12l3 3m0 0l4-4m-4 4L9 9" /></svg>),
  2: (<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" /></svg>),
  3: (<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m4-4H8" /></svg>),
  4: (<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v6m0 8v6M5 12h14" /></svg>),
  5: (<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>),
  6: (<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.567-3 3.5S10.343 15 12 15s3-1.567 3-3.5S13.657 8 12 8z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.4 15A7.966 7.966 0 0018 9.9M4.6 9A7.966 7.966 0 006 14.1" /></svg>)
}

const ServicesLanding = ()=>{
  const ref = useRef(null)

  useEffect(()=>{
    const els = ref.current?.querySelectorAll('.service-card')
    if(!els) return
    const obs = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(e.isIntersecting) e.target.classList.add('enter')
      })
    }, {threshold:0.15})
    els.forEach(el=> obs.observe(el))
    return ()=> obs.disconnect()
  },[])

  return (
    <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map(s=> (
        <article
          key={s.id}
          tabIndex={0}
          className="service-card card group opacity-0 translate-y-6 transform transition-all duration-300 hover:shadow-lg hover:scale-[1.05] hover:-translate-y-1 bg-white rounded-lg border border-transparent hover:border-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-200"
        >
          <div className="p-4 flex items-start gap-4">
            <div className="flex-shrink-0 mt-1 transform transition-transform duration-200 group-hover:scale-110">
              {icons[s.id]}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800 group-hover:text-primary-700 transition-colors duration-150">{s.title}</h3>
              <p className="text-gray-600 mt-2">{s.desc}</p>
              <div className="mt-4">
                <a
                  href="#booking"
                  className="inline-block text-primary-600 hover:underline transition-colors duration-150 group-hover:text-primary-700"
                >
                  Reservar este servicio →
                </a>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

export default ServicesLanding
