import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
    selector: 'app-data-exporter',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './data-exporter.html',
    styleUrl: './data-exporter.css'
})
export class DataExporter {
    @Input() title: string = 'Report';
    @Input() columns: { header: string, key: string }[] = [];
    @Input() data: any[] = [];
    @Input() filename: string = 'report.pdf';

    getCellValue(row: any, col: any): any {
        const value = row[col.key];
        if (value === undefined || value === null) return '-';

        const header = col.header.toLowerCase();
        const isCurrency = ['price', 'amount', 'revenue'].some(term => header.includes(term));

        if (typeof value === 'number' && isCurrency) {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
        }

        if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)) && value.includes('-'))) {
            try {
                return new Date(value).toLocaleDateString();
            } catch {
                return value;
            }
        }
        return value;
    }

    exportToPdf() {
        const doc = new jsPDF();

        doc.text(this.title, 14, 15);

        const tableData = this.data.map(row =>
            this.columns.map(col => this.getCellValue(row, col))
        );

        const tableHeaders = this.columns.map(col => col.header);

        autoTable(doc, {
            head: [tableHeaders],
            body: tableData,
            startY: 20,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] }, // Indigo color
            styles: { fontSize: 9 }
        });

        doc.save(this.filename);
    }
}
