from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from django.conf import settings
from io import BytesIO
import json
import random

def generate_dossier_pdf(history_entry, file_buffer):
    """
    Generates a 'Classified' style dossier PDF for a GenerationHistory entry.
    """
    doc = SimpleDocTemplate(file_buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    styles.add(ParagraphStyle(name='ClassifiedTitle', fontSize=24, leading=28, textColor=colors.red, alignment=1, fontName='Courier-Bold'))
    styles.add(ParagraphStyle(name='SectionHeader', fontSize=14, leading=16, textColor=colors.black, spaceAfter=6, fontName='Courier-Bold'))
    styles.add(ParagraphStyle(name='DataText', fontSize=10, leading=12, fontName='Courier'))
    styles.add(ParagraphStyle(name='WarningText', fontSize=8, leading=10, textColor=colors.red, alignment=1, fontName='Courier-Oblique'))

    elements = []

    # --- Header with "TOP SECRET" Stamp ---
    elements.append(Paragraph("TOP SECRET // NOFORN", styles['ClassifiedTitle']))
    elements.append(Paragraph("Target Dossier Generation Report", styles['SectionHeader']))
    elements.append(Spacer(1, 0.2*inch))
    
    # --- Metadata Table ---
    meta_data = [
        ['OPERATION ID:', f"OP-{history_entry.id:04d}"],
        ['TIMESTAMP:', str(history_entry.timestamp)],
        ['IP ORIGIN:', history_entry.ip_address or "UNK/PROXY"],
        ['AGENT:', history_entry.user.username if history_entry.user else "GHOST USER"],
    ]
    meta_table = Table(meta_data, colWidths=[200, 300])
    meta_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Courier'),
        ('TEXTCOLOR', (0,0), (0,-1), colors.grey),
        ('TEXTCOLOR', (1,0), (1,-1), colors.black),
        ('BOX', (0,0), (-1,-1), 1, colors.black),
        ('grid', (0,0), (-1,-1), 0.5, colors.grey),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 0.3*inch))

    # --- PII Data Section ---
    elements.append(Paragraph("I. COLLECTED INTELLIGENCE (PII)", styles['SectionHeader']))
    
    pii_content = []
    # Depending on how pii_data is stored (JSONField which returns dict)
    data = history_entry.pii_data
    if isinstance(data, str):
        try:
            data = json.loads(data)
        except:
            data = {}
            
    # Flatten dict for display
    def flatten_dict(d, parent_key='', sep='_'):
        items = []
        for k, v in d.items():
            new_key = f"{parent_key}{sep}{k}" if parent_key else k
            if isinstance(v, dict):
                items.extend(flatten_dict(v, new_key, sep=sep).items())
            elif isinstance(v, list):
                 items.append((new_key, ", ".join(map(str, v))))
            else:
                items.append((new_key, v))
        return dict(items)

    flat_data = flatten_dict(data)
    
    # Chunk into rows of key-value pairs
    for k, v in flat_data.items():
        if v:
            pii_content.append([k.upper().replace('_', ' '), str(v)])

    if not pii_content:
        pii_content = [['NO DATA', 'N/A']]

    pii_table = Table(pii_content, colWidths=[200, 300])
    pii_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Courier'),
        ('BACKGROUND', (0,0), (0,-1), colors.lightgrey),
        ('grid', (0,0), (-1,-1), 0.5, colors.black),
    ]))
    elements.append(pii_table)
    elements.append(Spacer(1, 0.3*inch))

    # --- Wordlist Analysis ---
    elements.append(Paragraph("II. GENERATED VECTORS (WORDLIST)", styles['SectionHeader']))
    wordlist = history_entry.wordlist or []
    count = len(wordlist)
    elements.append(Paragraph(f"Total Variants Generated: {count}", styles['DataText']))
    elements.append(Spacer(1, 0.1*inch))
    
    # Show first 50 passwords in columns
    preview_limit = 60
    preview = wordlist[:preview_limit]
    
    # Format into 3 columns
    rows = []
    for i in range(0, len(preview), 3):
        row = preview[i:i+3]
        # Pad row if needed
        while len(row) < 3:
            row.append("")
        rows.append(row)

    wl_table = Table(rows, colWidths=[160, 160, 160])
    wl_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Courier'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('grid', (0,0), (-1,-1), 0.25, colors.grey),
    ]))
    elements.append(wl_table)
    
    if count > preview_limit:
        elements.append(Spacer(1, 0.1*inch))
        elements.append(Paragraph(f"... [ {count - preview_limit} ADDITIONAL ENTRIES OMITTED FOR SECURITY ] ...", styles['WarningText']))

    elements.append(Spacer(1, 0.5*inch))
    elements.append(Paragraph("** CONFIDENTIAL DOCUMENT - DESTROY AFTER USE **", styles['WarningText']))

    doc.build(elements)
