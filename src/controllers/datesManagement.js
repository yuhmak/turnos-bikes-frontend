export const getDatesOfMonth = (year, month, sucursal) => {
    // Strings 'YYYY-MM-DD' armados a mano: toISOString() formatea en UTC y puede correr el dia.
    var dates = [];
    var ultimoDia = new Date(year, month, 0);
    for (var i = 1; i <= ultimoDia.getDate(); i++) {
        dates.push(`${year}-${String(month).padStart(2, "0")}-${String(i).padStart(2, "0")}`);
    }
    return dates.map(date => {
        return {
            U_Fecha: date,
            U_CantServMax: 0,
            U_CantServComplejo: 0,
            U_BPLId: sucursal,
            U_HorarioRecep: [
                { hs: '08:30', cantrecep: 0, ocupado: 0, habilitad: 'N' },
                { hs: '09:00', cantrecep: 0, ocupado: 0, habilitad: 'N' },
                { hs: '09:30', cantrecep: 0, ocupado: 0, habilitad: 'N' },
                { hs: '10:00', cantrecep: 0, ocupado: 0, habilitad: 'N' },
                { hs: '10:30', cantrecep: 0, ocupado: 0, habilitad: 'N' },
                { hs: '11:00', cantrecep: 0, ocupado: 0, habilitad: 'N' },
                { hs: '11:30', cantrecep: 0, ocupado: 0, habilitad: 'N' },
                { hs: '12:00', cantrecep: 0, ocupado: 0, habilitad: 'N' },
                { hs: '12:30', cantrecep: 0, ocupado: 0, habilitad: 'N' },
                { hs: '13:00', cantrecep: 0, ocupado: 0, habilitad: 'N' },
                { hs: '17:00', cantrecep: 0, ocupado: 0, habilitad: 'N' },
                { hs: '17:30', cantrecep: 0, ocupado: 0, habilitad: 'N' },
                { hs: '18:00', cantrecep: 0, ocupado: 0, habilitad: 'N' },
                { hs: '18:30', cantrecep: 0, ocupado: 0, habilitad: 'N' },
                { hs: '19:00', cantrecep: 0, ocupado: 0, habilitad: 'N' },
                { hs: '19:30', cantrecep: 0, ocupado: 0, habilitad: 'N' },
                { hs: '20:00', cantrecep: 0, ocupado: 0, habilitad: 'N' }
                
            ]
        }
    })
};


export const messages = {
    next: 'Siguiente',
    previous: 'Anterior',
    today: 'Hoy',
    month: 'Mes',
    day: 'Día'
}