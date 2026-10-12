/* Agenda tu cita: sucursal, forma de pago, día, hora y datos; confirma con folio y envío por WhatsApp. */
(() => {
  const {$, esc, D} = L, p = L.params();
  const branch = D.branches.some(b => b.id === p.get('sucursal')) ? p.get('sucursal') : '';
  L.booking($('#bookingBox'), {full: true, branch, carId: p.get('id') || '', pay: p.get('pago') || ''});
  $('#branchMini').innerHTML = D.branches.map(b => `<div style="margin-bottom:14px"><strong>${esc(b.name)}</strong><p class="subtle" style="margin:4px 0">${esc(b.address)}</p><p class="subtle" style="margin:0">${esc(b.hours)} <span class="pend">Pendiente de confirmar</span></p></div>`).join('');
})();
