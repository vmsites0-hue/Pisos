import { jsPDF } from "jspdf";

export function generateSaleTicketPDF(venta: any) {
  const lineCount = venta.detalles?.length || 1;
  const calculatedHeight = Math.max(160, 110 + lineCount * 14);

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, calculatedHeight],
  });

  const pageWidth = 80;
  let y = 8;

  // Cabecera
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("ERPISO S.A.", pageWidth / 2, y, { align: "center" });
  y += 5;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("COMPROBANTE INTERNO DE VENTA", pageWidth / 2, y, { align: "center" });
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.text(`Venta #${venta.id}`, pageWidth / 2, y, { align: "center" });
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.text(`Sucursal: ${venta.sucursal?.nombre || "Principal"}`, pageWidth / 2, y, { align: "center" });
  y += 3.5;
  doc.text(`Fecha: ${new Date(venta.fecha).toLocaleString("es-PY")}`, pageWidth / 2, y, { align: "center" });
  y += 4;

  // Línea divisoria
  doc.setLineDashPattern([1, 1], 0);
  doc.line(4, y, pageWidth - 4, y);
  y += 4;

  // Datos Cliente
  doc.setFont("helvetica", "bold");
  doc.text("DATOS DEL CLIENTE", 4, y);
  y += 3.5;
  doc.setFont("helvetica", "normal");
  const clientName = `${venta.cliente?.nombre || "Consumidor"} ${venta.cliente?.apellido || "Final"}`.trim();
  doc.text(`Cliente: ${clientName}`, 4, y);
  y += 3.5;
  if (venta.cliente?.documento && venta.cliente.documento !== "0") {
    doc.text(`CI: ${venta.cliente.documento}`, 4, y);
    y += 3.5;
  }
  if (venta.cliente?.ruc) {
    doc.text(`RUC: ${venta.cliente.ruc}`, 4, y);
    y += 3.5;
  }
  doc.text(`Método: ${venta.metodoPago}`, 4, y);
  y += 3.5;
  doc.text(`Entrega: ${venta.tipoEntrega === "RETIRO" ? "Retiro en Local" : "Envío a Domicilio"}`, 4, y);
  y += 4;

  // Línea divisoria
  doc.line(4, y, pageWidth - 4, y);
  y += 4;

  // Encabezado de tabla
  doc.setFont("helvetica", "bold");
  doc.text("Cant. / Detalle", 4, y);
  doc.text("Total (Gs.)", pageWidth - 4, y, { align: "right" });
  y += 4;
  doc.setFont("helvetica", "normal");

  // Items
  for (const det of venta.detalles) {
    const prodName = `${det.producto?.codigo || ""} ${det.producto?.nombre || ""}`.trim();
    const splitName = doc.splitTextToSize(prodName, pageWidth - 8);
    doc.text(splitName, 4, y);
    y += splitName.length * 3.2;

    const qtyText = `${det.cantidad} ${det.producto?.unidadVenta || "UN"} x Gs. ${Number(det.precioUnitario).toLocaleString("es-PY")}`;
    doc.setFontSize(7);
    doc.text(qtyText, 4, y);
    doc.setFontSize(8);
    doc.text(`Gs. ${Number(det.subtotal).toLocaleString("es-PY")}`, pageWidth - 4, y, { align: "right" });
    y += 4.5;
  }

  // Línea divisoria
  doc.line(4, y, pageWidth - 4, y);
  y += 4;

  // Resumen de Totales
  doc.text("Subtotal:", 4, y);
  doc.text(`Gs. ${Number(venta.subtotal).toLocaleString("es-PY")}`, pageWidth - 4, y, { align: "right" });
  y += 3.5;

  if (venta.descuento > 0) {
    doc.text("Descuento:", 4, y);
    doc.text(`- Gs. ${Number(venta.descuento).toLocaleString("es-PY")}`, pageWidth - 4, y, { align: "right" });
    y += 3.5;
  }

  y += 1.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("TOTAL A PAGAR:", 4, y);
  doc.text(`Gs. ${Number(venta.total).toLocaleString("es-PY")}`, pageWidth - 4, y, { align: "right" });
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("¡Gracias por su compra!", pageWidth / 2, y, { align: "center" });

  doc.save(`ticket-venta-${venta.id}.pdf`);
}

export function generateQuotationPDF(presupuesto: any) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  let y = 15;

  // Header Box
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(15, y, pageWidth - 30, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("ERPISO S.A. - PRESUPUESTO", 20, y + 12);
  doc.setFontSize(10);
  doc.text(`#PRES-${presupuesto.id}`, pageWidth - 20, y + 12, { align: "right" });
  y += 28;

  // Info Section
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("DATOS DEL CLIENTE", 15, y);
  doc.text("DETALLES DE COTIZACIÓN", 120, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  const clientName = `${presupuesto.cliente?.nombre || "Cliente"} ${presupuesto.cliente?.apellido || ""}`.trim();
  doc.text(`Nombre: ${clientName}`, 15, y);
  doc.text(`Fecha: ${new Date(presupuesto.fecha).toLocaleDateString("es-PY")}`, 120, y);
  y += 5;

  if (presupuesto.cliente?.documento && presupuesto.cliente.documento !== "0") {
    doc.text(`Documento / CI: ${presupuesto.cliente.documento}`, 15, y);
  }
  doc.text(`Validez: ${presupuesto.validezDias || 15} días`, 120, y);
  y += 5;

  if (presupuesto.cliente?.telefono) {
    doc.text(`Teléfono: ${presupuesto.cliente.telefono}`, 15, y);
    y += 5;
  }
  y += 4;

  // Table header
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.rect(15, y, pageWidth - 30, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text("Código", 18, y + 5.5);
  doc.text("Descripción", 45, y + 5.5);
  doc.text("Cantidad", 120, y + 5.5, { align: "right" });
  doc.text("Precio Unit. (Gs.)", 155, y + 5.5, { align: "right" });
  doc.text("Subtotal (Gs.)", pageWidth - 18, y + 5.5, { align: "right" });
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);

  for (const det of presupuesto.detalles) {
    doc.text(det.producto?.codigo || "-", 18, y);
    const prodName = det.producto?.nombre || "";
    const splitName = doc.splitTextToSize(prodName, 70);
    doc.text(splitName, 45, y);

    const qty = `${det.cantidad} ${det.producto?.unidadVenta || "UN"}`;
    doc.text(qty, 120, y, { align: "right" });
    doc.text(Number(det.precioUnitario).toLocaleString("es-PY"), 155, y, { align: "right" });
    doc.text(Number(det.subtotal).toLocaleString("es-PY"), pageWidth - 18, y, { align: "right" });

    const rowHeight = Math.max(splitName.length * 4.5, 7);
    y += rowHeight;

    doc.setDrawColor(226, 232, 240);
    doc.line(15, y - 2, pageWidth - 15, y - 2);
  }

  y += 5;

  // Totals Box
  const totalBoxX = 120;
  doc.setFontSize(9);
  doc.text("Subtotal:", totalBoxX, y);
  doc.text(`Gs. ${Number(presupuesto.subtotal).toLocaleString("es-PY")}`, pageWidth - 18, y, { align: "right" });
  y += 5;

  if (presupuesto.descuento > 0) {
    doc.text("Descuento:", totalBoxX, y);
    doc.text(`- Gs. ${Number(presupuesto.descuento).toLocaleString("es-PY")}`, pageWidth - 18, y, { align: "right" });
    y += 5;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("TOTAL COTIZADO:", totalBoxX, y + 2);
  doc.text(`Gs. ${Number(presupuesto.total).toLocaleString("es-PY")}`, pageWidth - 18, y + 2, { align: "right" });
  y += 15;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Documento no fiscal. Válido únicamente como presupuesto de referencia.", 15, y);

  doc.save(`presupuesto-${presupuesto.id}.pdf`);
}
