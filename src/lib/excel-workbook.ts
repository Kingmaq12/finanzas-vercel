import ExcelJS from "exceljs";
import { allMonthRollups, yearlyTotals } from "./aggregates";
import { MONTH_SHORT } from "./months";
import type { FinanceBundle } from "./types";

function num(v: number): number {
  return Math.round(v * 100) / 100;
}

export async function buildExcelBuffer(bundle: FinanceBundle): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Finanzas Vercel";
  const yearKeys = Object.keys(bundle.years).sort();

  for (const y of yearKeys) {
    const fd = bundle.years[y];
    if (!fd) continue;
    const name = y.length <= 31 ? y : y.slice(0, 31);
    const sheet = workbook.addWorksheet(name);
    sheet.getCell("A1").value = `Reporte de gastos ${y}`;
    sheet.getCell("A1").font = { bold: true, size: 14 };

    const rollups = allMonthRollups(fd);
    const yt = yearlyTotals(rollups);

    sheet.getCell("A3").value = "Resumen anual";
    sheet.getCell("B3").value = num(yt.totalIncome);
    sheet.getCell("A4").value = "Egresos + deudas + adicionales";
    sheet.getCell("B4").value = num(
      yt.totalExpense + yt.totalDebt + yt.extraSpend,
    );
    sheet.getCell("A5").value = "Disponible (año)";
    sheet.getCell("B5").value = num(yt.disponible);

    let row = 7;
    sheet.getRow(row).values = [
      "Concepto",
      ...MONTH_SHORT,
      "Total",
      "Prom.",
    ];
    sheet.getRow(row).font = { bold: true };
    row++;

    const rows = [
      { label: "Ingresos", pick: (r: (typeof rollups)[0]) => r.totalIncome },
      {
        label: "Total egresos (categorías)",
        pick: (r: (typeof rollups)[0]) => r.totalExpense,
      },
      { label: "Deudas", pick: (r: (typeof rollups)[0]) => r.totalDebt },
      {
        label: "Gastos adicionales",
        pick: (r: (typeof rollups)[0]) => r.extraSpend,
      },
      {
        label: "Disponible",
        pick: (r: (typeof rollups)[0]) => r.disponible,
      },
    ];

    for (const def of rows) {
      const vals = rollups.map(def.pick);
      const sum = vals.reduce((a, b) => a + b, 0);
      const prom = sum / 12;
      sheet.getRow(row).values = [
        def.label,
        ...vals.map(num),
        num(sum),
        num(prom),
      ];
      row++;
    }

    row += 1;
    sheet.getCell(`A${row}`).value = "Categorías (por mes)";
    sheet.getCell(`A${row}`).font = { bold: true };
    row++;
    sheet.getRow(row).values = [
      "Categoría",
      "Tipo",
      ...MONTH_SHORT,
      "Total",
    ];
    sheet.getRow(row).font = { bold: true };
    row++;

    for (const c of fd.categories) {
      const months: number[] = [];
      for (let mi = 0; mi < 12; mi++) {
        months.push(num(c.byMonth[mi as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11] ?? 0));
      }
      const total = months.reduce((a, b) => a + b, 0);
      sheet.getRow(row).values = [c.name, c.kind, ...months, num(total)];
      row++;
    }

    row += 1;
    sheet.getCell(`A${row}`).value = "Gastos adicionales (detalle)";
    sheet.getCell(`A${row}`).font = { bold: true };
    row++;
    sheet.getRow(row).values = ["Nombre", "Valor", "Fecha", "Mes"];
    sheet.getRow(row).font = { bold: true };
    row++;

    for (const t of fd.extraTransactions) {
      sheet.getRow(row).values = [
        t.name,
        num(t.amount),
        t.date ?? "",
        MONTH_SHORT[t.monthIndex] ?? "",
      ];
      row++;
    }

    sheet.columns.forEach((col) => {
      col.width = 14;
    });
    sheet.getColumn(1).width = 28;
  }

  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}
