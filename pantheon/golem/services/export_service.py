import csv
from io import StringIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


class ExportService:
    @staticmethod
    def generate_report_pdf(history_entry, file_buffer):
        doc = SimpleDocTemplate(file_buffer, pagesize=letter)
        styles = getSampleStyleSheet()

        styles.add(
            ParagraphStyle(
                name="ClassifiedTitle",
                fontSize=22,
                leading=26,
                textColor=colors.red,
                alignment=1,
                fontName="Courier-Bold",
            )
        )
        styles.add(
            ParagraphStyle(
                name="SectionHeader",
                fontSize=14,
                leading=16,
                textColor=colors.black,
                spaceAfter=6,
                fontName="Courier-Bold",
            )
        )
        styles.add(ParagraphStyle(name="DataText", fontSize=10, leading=12, fontName="Courier"))

        elements = []
        elements.append(Paragraph("PIIcasso Intelligence Report", styles["ClassifiedTitle"]))
        elements.append(Spacer(1, 0.2 * inch))

        meta_data = [
            ["REPORT ID:", f"REP-{history_entry.id:04d}"],
            ["TIMESTAMP:", str(history_entry.timestamp)],
            ["WORDLIST COUNT:", str(history_entry.wordlist_count or len(history_entry.wordlist or []))],
        ]
        meta_table = Table(meta_data, colWidths=[2.0 * inch, 4.5 * inch])
        meta_table.setStyle(
            TableStyle(
                [
                    ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
                    ("FONTNAME", (0, 0), (-1, -1), "Courier"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ]
            )
        )
        elements.append(meta_table)
        elements.append(Spacer(1, 0.3 * inch))

        elements.append(Paragraph("Sample Candidate Wordlist", styles["SectionHeader"]))
        candidates = history_entry.wordlist[:50] if history_entry.wordlist else []
        cand_data = [[f"{idx+1}.", c] for idx, c in enumerate(candidates)]
        if cand_data:
            cand_table = Table(cand_data, colWidths=[0.8 * inch, 5.7 * inch])
            cand_table.setStyle(
                TableStyle(
                    [
                        ("FONTNAME", (0, 0), (-1, -1), "Courier"),
                        ("FONTSIZE", (0, 0), (-1, -1), 8),
                    ]
                )
            )
            elements.append(cand_table)

        doc.build(elements)

    @staticmethod
    def export_history_to_csv(history_entries):
        buffer = StringIO()
        writer = csv.writer(buffer)
        writer.writerow(["ID", "Timestamp", "Wordlist Count", "IP Address"])
        for h in history_entries:
            writer.writerow([h.id, h.timestamp, h.wordlist_count, h.ip_address or ""])
        buffer.seek(0)
        return buffer

