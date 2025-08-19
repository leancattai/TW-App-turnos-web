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
  const el = $("#fecha");
  if (el) el.min = `${yyyy}-${mm}-${dd}`;
};

// Poblar selects
function cargarEspecialidades(){
  const sel = $("#especialidad");
  if (!sel) return;
  sel.innerHTML = `<option value="" disabled selected>Seleccioná</option>` +
    DATA.especialidades.map(e=>`<option value="${e.id}">${e.nombre}</option>`).join("");
}
function cargarProfesionales(filtroEsp){
  const sel = $("#profesional");
  if (!sel) return;
  const items = DATA.profesionales.filter(p=>!filtroEsp || p.esp===filtroEsp);
  sel.innerHTML = `<option value="" disabled selected>Seleccioná</option>` +
    items.map(p=>`<option value="${p.id}">${p.nombre}</option>`).join("");
}

function renderListas(){
  const esp = $("#especialidadesList");
  const prof = $("#profesionalesList");
  if (esp) esp.innerHTML = DATA.especialidades.map(e=>`
    <article class="cardItem">
      <h3>${e.nombre}</h3>
      <p>Atención de ${e.nombre.toLowerCase()} con profesionales matriculados.</p>
    </article>`).join("");
  if (prof) prof.innerHTML = DATA.profesionales.map(p=>{
    const name = DATA.especialidades.find(e=>e.id===p.esp)?.nombre || "";
    return `<article class="cardItem"><h3>${p.nombre}</h3><p>${name}</p></article>`;
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
    especialidad: $("#especialidad")?.value,
    profesional: $("#profesional")?.value,
    fecha: $("#fecha")?.value,
    hora: $("#hora")?.value,
    nombre: $("#nombre")?.value.trim(),
    telefono: $("#telefono")?.value.trim(),
    nota: $("#nota")?.value.trim()
  };
  const faltan = Object.entries(vals).filter(([k,v])=>["nota"].includes(k)?false:!v);
  if(faltan.length){
    const m = $("#formMsg"); if (m) m.textContent = "Completá los campos obligatorios.";
    return;
  }
  window.open(construirMensajeWhatsApp(vals), "_blank");
  const m = $("#formMsg"); if (m) m.textContent = "Abriendo WhatsApp para confirmar…";
}

// Google Calendar quick-add (sin API)
function addToGoogleCalendar(){
  const f = $("#fecha")?.value; const h = $("#hora")?.value;
  const msg = $("#formMsg");
  if(!f||!h){ if(msg) msg.textContent = "Elegí fecha y hora para agregar a Calendar."; return; }
  const dt = new Date(`${f}T${h}:00`);
  const dtEnd = new Date(dt.getTime()+30*60*1000);
  const fmt = (d)=> d.toISOString().replace(/[-:]/g,"").split(".")[0]+"Z";
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("Consulta Médica / Odontológica")}&dates=${fmt(dt)}/${fmt(dtEnd)}&details=${encodeURIComponent("Evento creado desde Turnos Web Demo")}`;
  window.open(url, "_blank");
}

// CTA WhatsApp en footer
function setCtaWhats(){
  const a = $("#ctaWhatsApp");
  if (a) a.href = `https://wa.me/${DATA.wspDestino}?text=${encodeURIComponent("Hola! Quiero hacer una consulta.")}`;
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

// Nav: efecto al scrollear
function navScrollEffect(){
  const nav = document.querySelector(".nav");
  const apply = () => {
    if (window.scrollY > 6) {
      nav.style.background = "rgba(11,18,32,.85)";
      nav.style.boxShadow = "0 6px 20px rgba(0,0,0,.35)";
    } else {
      nav.style.background = "rgba(11,18,32,.6)";
      nav.style.boxShadow = "none";
    }
  };
  apply();
  window.addEventListener("scroll", apply, { passive: true });
}

// Nav: activar link según sección visible
function navActiveOnScroll(){
  const ids = ["turno","especialidades","profesionales","preguntas","contacto"];
  const sections = ids.map(id=>document.getElementById(id)).filter(Boolean);
  if (!sections.length) return;

  const links = [...document.querySelectorAll('.menu__link')];
  const byHash = (hash)=> links.find(a=>a.getAttribute('href')===`#${hash}`);

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        links.forEach(a=>a.classList.remove('is-active'));
        const l = byHash(e.target.id);
        if (l) l.classList.add('is-active');
      }
    });
  }, {rootMargin: "-40% 0px -50% 0px", threshold: 0});

  sections.forEach(s=>io.observe(s));
}

// Init
window.addEventListener("DOMContentLoaded",()=>{
  setMinFecha();
  cargarEspecialidades();
  cargarProfesionales();
  renderListas();
  setCtaWhats();
  navMobile();
  navScrollEffect();
  navActiveOnScroll();

  document.getElementById("especialidad")?.addEventListener("change", e=>{
    cargarProfesionales(e.target.value)
  });
  document.getElementById("formTurno")?.addEventListener("submit", onSubmit);
  document.getElementById("btnCal")?.addEventListener("click", addToGoogleCalendar);
  const y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();
});
