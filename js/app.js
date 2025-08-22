// Global para datos
let DATA = { wspDestino: "", especialidades: [], profesionales: [] };

// Utilidades
const $ = (q) => document.querySelector(q);

// ------- Helpers de teléfono -------
const limpiarTelefono = (v="") => v.replace(/[()\-\s]/g, ""); // quita espacios, ( ), -
function esTelefonoValido(v=""){
  const t = limpiarTelefono(v);
  // Acepta: E.164 (+###########, 8-15 dígitos) o formatos AR típicos (+549XXXXXXXXXX)
  const reE164 = /^\+[1-9]\d{7,14}$/;
  const reAR   = /^\+?54?9?\d{10}$/; // +54 9 + 10 dígitos (sin separadores)
  return reE164.test(t) || reAR.test(t);
}

// Cargar JSON con fetch
async function cargarData() {
  try {
    const res = await fetch("js/data.json");
    if (!res.ok) throw new Error("No se pudo cargar data.json");
    DATA = await res.json();
  } catch (err) {
    console.error("Error cargando data.json:", err);
    // fallback básico por si falla el fetch
    DATA = {
      wspDestino: "+5492600000000",
      especialidades: [{ id: "clinica", nombre: "Clínica Médica", icon: "stethoscope" }],
      profesionales: [{ id: 1, nombre: "Dr. Demo", esp: "clinica" }]
    };
  }
}

// Fecha mínima
const setMinFecha = () => {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth()+1).padStart(2,'0');
  const dd = String(hoy.getDate()).padStart(2,'0');
  const el = document.getElementById("fecha");
  if (el) el.min = `${yyyy}-${mm}-${dd}`;
};

// Poblar selects
function cargarEspecialidades(){
  const sel = document.getElementById("especialidad");
  if (!sel) return;
  sel.innerHTML = `<option value="" disabled selected>Seleccioná</option>` +
    DATA.especialidades.map(e=>`<option value="${e.id}">${e.nombre}</option>`).join("");
}
function cargarProfesionales(filtroEsp){
  const sel = document.getElementById("profesional");
  if (!sel) return;
  const items = DATA.profesionales.filter(p=>!filtroEsp || p.esp===filtroEsp);
  sel.innerHTML = `<option value="" disabled selected>Seleccioná</option>` +
    items.map(p=>`<option value="${p.id}">${p.nombre}</option>`).join("");
}

// Render de listas en secciones
function renderListas(){
  const esp = document.getElementById("especialidadesList");
  const prof = document.getElementById("profesionalesList");
  if (esp) esp.innerHTML = DATA.especialidades.map(e=>`
    <article class="cardItem reveal" data-anim="fade-up">
      <div class="cardItem__icon"><i data-lucide="${e.icon}"></i></div>
      <h3>${e.nombre}</h3>
      <p>Atención de ${e.nombre.toLowerCase()} con profesionales matriculados.</p>
    </article>`).join("");
  if (prof) prof.innerHTML = DATA.profesionales.map(p=>{
    const name = DATA.especialidades.find(e=>e.id===p.esp)?.nombre || "";
    const icon = DATA.especialidades.find(e=>e.id===p.esp)?.icon || "user";
    return `<article class="cardItem reveal" data-anim="fade-up">
      <div class="cardItem__icon"><i data-lucide="${icon}"></i></div>
      <h3>${p.nombre}</h3><p>${name}</p>
    </article>`;
  }).join("");
  if (window.lucide?.createIcons) lucide.createIcons();
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
    `• Teléfono: ${limpiarTelefono(telefono)}`+ (nota?`%0A• Nota: ${encodeURIComponent(nota)}`:"");
  return `https://wa.me/${DATA.wspDestino}?text=${texto}`;
}

// ========== Validación ==========
function setError(idCampo, mensaje){
  const el = document.getElementById(idCampo);
  const err = document.getElementById(`err-${idCampo}`);
  if (mensaje){
    el?.classList.add("is-invalid");
    el?.setAttribute("aria-invalid","true");
    if (err){ err.textContent = mensaje; /* aria-live lo agregamos en HTML en el siguiente paso */ }
  } else {
    el?.classList.remove("is-invalid");
    el?.setAttribute("aria-invalid","false");
    if (err) err.textContent = "";
  }
}

function validarFormulario(vals){
  let ok = true;

  // Requeridos genéricos
  ["especialidad","profesional","fecha","hora","nombre","telefono"].forEach(id=>{
    if(!vals[id]){
      ok = false;
      setError(id, "Campo obligatorio");
    } else {
      setError(id, "");
    }
  });

  // Regla específica: teléfono válido
  if (vals.telefono){
    const telOk = esTelefonoValido(vals.telefono);
    if (!telOk){
      ok = false;
      setError("telefono", "Formato inválido. Ej: +54 9 260 1234567");
    }
  }

  return ok;
}

function onSubmit(e){
  e.preventDefault();
  const vals = {
    especialidad: document.getElementById("especialidad")?.value,
    profesional: document.getElementById("profesional")?.value,
    fecha: document.getElementById("fecha")?.value,
    hora: document.getElementById("hora")?.value,
    nombre: document.getElementById("nombre")?.value?.trim(),
    telefono: document.getElementById("telefono")?.value?.trim(),
    nota: document.getElementById("nota")?.value?.trim()
  };
  const msg = document.getElementById("formMsg");
  const btn = document.getElementById("btnSubmit");

  const ok = validarFormulario(vals);
  if(!ok){
    if (msg) msg.textContent = "Revisá los errores marcados en rojo.";
    return;
  }

  btn.disabled = true;
  const oldText = btn.textContent;
  btn.textContent = "Enviando…";

  setTimeout(()=>{
    window.open(construirMensajeWhatsApp(vals), "_blank");
    if (msg) msg.textContent = "Abriendo WhatsApp para confirmar…";
    btn.disabled = false;
    btn.textContent = oldText;
  }, 800);
}

// Google Calendar quick-add
function addToGoogleCalendar(){
  const f = document.getElementById("fecha")?.value; const h = document.getElementById("hora")?.value;
  const msg = document.getElementById("formMsg");
  if(!f||!h){ if(msg) msg.textContent = "Elegí fecha y hora para agregar a Calendar."; return; }
  const dt = new Date(`${f}T${h}:00`);
  const dtEnd = new Date(dt.getTime()+30*60*1000);
  const fmt = (d)=> d.toISOString().replace(/[-:]/g,"").split(".")[0]+"Z";
  const desc = `Evento creado desde Turnos Web Demo`;
  const title = `Consulta: ${document.getElementById("nombre")?.value || "Paciente"} — ${document.getElementById("profesional")?.selectedOptions?.[0]?.text || "Profesional"}`;
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${fmt(dt)}/${fmt(dtEnd)}&details=${encodeURIComponent(desc)}`;
  window.open(url, "_blank");
}

// CTA WhatsApp
function setCtaWhats(){
  const href = `https://wa.me/${DATA.wspDestino}?text=${encodeURIComponent("Hola! Quiero hacer una consulta.")}`;
  const a = document.getElementById("ctaWhatsApp"); if (a) a.href = href;
  const fab = document.getElementById("fabWhatsApp"); if (fab) fab.href = href;
}

// Nav mobile
function navMobile(){
  const burger = document.getElementById("burger");
  burger?.addEventListener("click",()=>{
    const menu = document.querySelector(".menu");
    const open = getComputedStyle(menu).display === "none";
    menu.style.display = open? "flex" : "none";
    burger.setAttribute("aria-expanded", String(open));
  });
}

// Nav efecto scroll
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

// Nav activo según scroll
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

// Animaciones reveal
function setupReveal(){
  const els = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });
  els.forEach(el=> io.observe(el));
}

// Init
window.addEventListener("DOMContentLoaded",async()=>{
  await cargarData();
  setMinFecha();
  cargarEspecialidades();
  cargarProfesionales();
  renderListas();
  setCtaWhats();
  navMobile();
  navScrollEffect();
  navActiveOnScroll();
  setupReveal();

  document.getElementById("especialidad")?.addEventListener("change", e=>{
    cargarProfesionales(e.target.value)
  });
  document.getElementById("formTurno")?.addEventListener("submit", onSubmit);
  document.getElementById("btnCal")?.addEventListener("click", addToGoogleCalendar);
  const y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();

  if (window.lucide?.createIcons) lucide.createIcons();

  // Normalizar el input teléfono en tiempo real (quita espacios y guiones al perder foco)
  const tel = document.getElementById("telefono");
  tel?.addEventListener("blur", ()=>{ if(tel.value) tel.value = limpiarTelefono(tel.value); });
});
