/* Drone Build Lab · Toast messages */
'use strict';
/* ================= Toast ================= */
let toastT;
function toast(msg,kind='info'){ const t=$('#toast'); t.className='toast show '+kind; t.textContent=msg; clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),kind==='bad'?5600:2800); }
