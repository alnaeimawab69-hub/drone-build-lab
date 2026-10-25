/* Drone Build Lab · Toast messages */
import { $ } from './01-config.js';

/* ================= Toast ================= */
export let toastT;
export function toast(msg,kind='info'){ const t=$('#toast'); t.className='toast show '+kind; t.textContent=msg; clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),kind==='bad'?5600:2800); }
