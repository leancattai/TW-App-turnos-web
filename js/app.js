// Datos mockeados (reemplazar por API/backend cuando esté)
const DATA = {
    wspDestino: "+5492604849175", // <- WhatsApp del consultorio (editar)
    especialidades: [
        { id: "clinica", nombre: "Clínica Médica" },
        { id: "pediatria", nombre: "Pediatría" },
        { id: "odontologia", nombre: "Odontología" },
        { id: "dermatologia", nombre: "Dermatología" }
    ],
    profesionales: [
        { id: 1, nombre: "Dra. Ana Pérez", esp: "clinica" },
        { id: 2, nombre: "Dr. Luis Gómez", esp: "pediatria" },
        { id: 3, nombre: "Dra. Zoe Lashes", esp: "odontologia" },
        { id: 4, nombre: "Dr. Martín Rivas", esp: "dermatologia" }
    ]
};

// Utilidades
const $ = (q) => document.querySelector(q);
const setMinFecha = () => {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth()+1).padStart(2,'0');
    const dd = String(hoy.getDate()).padStart(2,'0');
    $("#fecha").min = `${yyyy}-${mm}-${dd}`;
};

// Poblar selects
function cargarEspecialidades(){
    const sel = $("#especialidad");
    sel.innerHTML = `<option value="" disabled selected>Seleccioná</option>` +
        DATA.especialidades.map(e=>`<option value="${e.id}">${e.nombre}</option>`).join("");
}

function cargarProfesionales(filtroEsp){
    const sel = $("#profesional");
    const items = DATA.profesionales.filter(p=>!filtroEsp || p.esp===filtroEsp);
    sel.innerHTML = `<option value="" disabled selected>Seleccioná</option>` +
        items.map(p=>`<option value="${p.id}">${p.nombre}</option>`).join("");
}

function renderListas(){
    $("#especialidadesList").innerHTML = DATA.especialidades.map(e=>`
        <article class="cardItem">
            <h3>${e.nombre}</h3>
            <p>Atención de ${e.nombre.toLowerCase()} con profesionales matriculados.</p>
        </article>`).join("");
    $("#profesionalesList").innerHTML = DATA.profesionales.map(p=>{
        const esp = DATA.especialidades.find(e=>e.id===p.esp)?.nombre || "";
        return `<article class="cardItem"><h3>${p.nombre}</h3><p>${esp}</p></article>`;
    }).join("");
}

// WhatsApp builder
function construirMensajeWhatsApp(vals){
    const {especialidad, profesional, fecha, hora, nombre, telefono, nota} = vals;
    const profName = DATA.profesionales.find(p=>String(p.id)===String(profesional))?.nombre || "";
    const espName = DATA.especialidades.find(e=>e.id===especialidad)?.nombre || "";
    const texto = `Hola! Quiero confirmar un turno.%0A%0A` +
        `• Especialidad: ${espName}%0A`+
        `• Profesional: ${profName}%0A`+
        `• Fecha y hora: ${fecha} ${hora}%0A`+
        `• Paciente: ${nombre}%0A`+
        `• Teléfono: ${telefono}`+ (nota?`%0A• Nota: ${encodeURIComponent(nota)}`:"");
    return `https://wa.me/${DATA.wspDestino}?text=${texto}`;
}

function onSubmit(e){
    e.preventDefault();
    const vals = {
        especialidad: $("#especialidad").value,
        profesional: $("#profesional").value,
        fecha: $("#fecha").value,
        hora: $("#hora").value,
        nombre: $("#nombre").value.trim(),
        telefono: $("#telefono").value.trim(),
        nota: $("#nota").value.trim()
    };
    // Validación mínima
    const faltan = Object.entries(vals).filter(([k,v])=>["nota"].includes(k)?false:!v);
    if(faltan.length){
        $("#formMsg").textContent = "Completá los campos obligatorios.";
        return;
    }
    const url = construirMensajeWhatsApp(vals);
    window.open(url, "_blank");
    $("#formMsg").textContent = "Abriendo WhatsApp para confirmar…";
}

// Google Calendar quick-add (sin API, solo link ICS de evento)
function addToGoogleCalendar(){
    const f = $("#fecha").value; const h = $("#hora").value; if(!f||!h){
        $("#formMsg").textContent = "Elegí fecha y hora para agregar a Calendar."; return; }
    const dt = new Date(`${f}T${h}:00`);
    const dtEnd = new Date(dt.getTime()+30*60*1000);
    const fmt = (d)=> d.toISOString().replace(/[-:]/g,"").split(".")[0]+"Z";
    const title = encodeURIComponent("Consulta Médica / Odontológica");
    const details = encodeURIComponent("Evento creado desde Turnos Web Demo");
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(dt)}/${fmt(dtEnd)}&details=${details}`;
    window.open(url, "_blank");
}

// CTA WhatsApp en footer
function setCtaWhats(){
    const url = `https://wa.me/${DATA.wspDestino}?text=${encodeURIComponent("Hola! Quiero hacer una consulta.")}`;
    $("#ctaWhatsApp").href = url;
}

// Menu mobile
function navMobile(){
    const burger = document.getElementById("burger");
    burger?.addEventListener("click",()=>{
        const menu = document.querySelector(".menu");
        const open = getComputedStyle(menu).display === "none";
        menu.style.display = open? "flex" : "none";
        burger.setAttribute("aria-expanded", String(open));
    });
}

// Init
window.addEventListener("DOMContentLoaded",()=>{
    setMinFecha();
    cargarEspecialidades();
    cargarProfesionales();
    renderListas();
    setCtaWhats();
    navMobile();
    document.getElementById("especialidad").addEventListener("change", e=>{
    cargarProfesionales(e.target.value)
    });
    document.getElementById("formTurno").addEventListener("submit", onSubmit);
    document.getElementById("btnCal").addEventListener("click", addToGoogleCalendar);
    document.getElementById("year").textContent = new Date().getFullYear();
});

