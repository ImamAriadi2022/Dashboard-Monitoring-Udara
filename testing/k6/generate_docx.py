import os
import re
import zipfile
import xml.etree.ElementTree as ET
from docx import Document
from docx.shared import Cm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCREENSHOTS_DIR = os.path.join(BASE_DIR, "reports", "screenshots")
OUT_DOCX = os.path.join(BASE_DIR, "LAPORAN_PENGUJIAN_LATENSI_k6.docx")

NAVY_HEX = "0F2942"
STRIPE_HEX = "F8FAFC"
PASS_BG_HEX = "DCFCE7"
PASS_TEXT = RGBColor(0x16, 0x65, 0x34)
DARK_TEXT = RGBColor(0x0F, 0x17, 0x2A)
MUTED_TEXT = RGBColor(0x47, 0x55, 0x69)
NAVY_COLOR = RGBColor(0x0F, 0x29, 0x42)
CODE_COLOR = RGBColor(0x0F, 0x29, 0x42)


def set_run_fonts(run, font_name):
    run.font.name = font_name
    rPr = run._r.get_or_add_rPr()
    rFonts = rPr.find(qn("w:rFonts"))
    if rFonts is None:
        rFonts = OxmlElement("w:rFonts")
        rPr.insert(0, rFonts)
    rFonts.set(qn("w:ascii"), font_name)
    rFonts.set(qn("w:hAnsi"), font_name)
    rFonts.set(qn("w:cs"), font_name)
    rFonts.set(qn("w:eastAsia"), font_name)


def set_cell_shading(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    for old in tcPr.findall(qn("w:shd")):
        tcPr.remove(old)
    shading = parse_xml(f'<w:shd {nsdecls("w")} w:val="clear" w:color="auto" w:fill="{fill_hex}"/>')
    tcPr.append(shading)


def set_cell_width_dxa(cell, width_dxa):
    tcPr = cell._tc.get_or_add_tcPr()
    for old in tcPr.findall(qn("w:tcW")):
        tcPr.remove(old)
    tcW = OxmlElement("w:tcW")
    tcW.set(qn("w:w"), str(width_dxa))
    tcW.set(qn("w:type"), "dxa")
    tcPr.insert(0, tcW)


def set_cell_margins(cell, top=65, bottom=65, left=75, right=75):
    tcPr = cell._tc.get_or_add_tcPr()
    for old in tcPr.findall(qn("w:tcMar")):
        tcPr.remove(old)
    tcMar = OxmlElement("w:tcMar")
    for side, val in [("top", top), ("bottom", bottom), ("left", left), ("right", right)]:
        node = OxmlElement(f"w:{side}")
        node.set(qn("w:w"), str(val))
        node.set(qn("w:type"), "dxa")
        tcMar.append(node)
    tcPr.append(tcMar)


def replace_tbl_child(tblPr, tag_name, new_elem):
    for old in tblPr.findall(qn(f"w:{tag_name}")):
        tblPr.remove(old)
    tblPr.append(new_elem)


TBLPR_ORDER = [
    "tblStyle", "tblpPr", "tblOverlap", "bidiVisual",
    "tblStyleRowBandSize", "tblStyleColBandSize",
    "tblW", "jc", "tblCellSpacing", "tblInd",
    "tblBorders", "shd", "tblLayout", "tblCellMar", "tblLook",
]


def normalize_tblPr_order(tblPr):
    order_map = {name: i for i, name in enumerate(TBLPR_ORDER)}
    children = list(tblPr)
    children.sort(key=lambda el: order_map.get(el.tag.split("}")[-1], 999))
    for ch in children:
        tblPr.remove(ch)
        tblPr.append(ch)


def set_table_borders(table, border_color="CBD5E1"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'  <w:top w:val="single" w:sz="8" w:space="0" w:color="0F2942"/>'
        f'  <w:bottom w:val="single" w:sz="8" w:space="0" w:color="0F2942"/>'
        f'  <w:left w:val="single" w:sz="4" w:space="0" w:color="{border_color}"/>'
        f'  <w:right w:val="single" w:sz="4" w:space="0" w:color="{border_color}"/>'
        f'  <w:insideH w:val="single" w:sz="4" w:space="0" w:color="{border_color}"/>'
        f'  <w:insideV w:val="single" w:sz="4" w:space="0" w:color="{border_color}"/>'
        f"</w:tblBorders>"
    )
    replace_tbl_child(tblPr, "tblBorders", borders)


def prevent_row_split(row):
    trPr = row._tr.get_or_add_trPr()
    if trPr.find(qn("w:cantSplit")) is None:
        trPr.append(OxmlElement("w:cantSplit"))


def set_repeat_header(row):
    trPr = row._tr.get_or_add_trPr()
    if trPr.find(qn("w:tblHeader")) is None:
        trPr.append(OxmlElement("w:tblHeader"))


def add_page_number_to_run(run):
    fldChar1 = parse_xml(r'<w:fldChar %s w:fldCharType="begin"/>' % nsdecls("w"))
    instrText = parse_xml(r'<w:instrText %s xml:space="preserve"> PAGE </w:instrText>' % nsdecls("w"))
    fldChar2 = parse_xml(r'<w:fldChar %s w:fldCharType="separate"/>' % nsdecls("w"))
    fldChar3 = parse_xml(r'<w:fldChar %s w:fldCharType="end"/>' % nsdecls("w"))
    run._r.append(fldChar1)
    run._r.append(instrText)
    run._r.append(fldChar2)
    run._r.append(fldChar3)


TOKEN_RE = re.compile(r"(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)")


def add_formatted_runs(p, text, font_size=12, color=DARK_TEXT, bold_default=False, italic_default=False):
    parts = TOKEN_RE.split(text)
    for part in parts:
        if not part:
            continue
        if part.startswith("`") and part.endswith("`"):
            r = p.add_run(part[1:-1])
            set_run_fonts(r, "Consolas")
            r.font.size = Pt(max(font_size - 1.2, 7.2))
            r.font.color.rgb = color if color == RGBColor(0xFF, 0xFF, 0xFF) else CODE_COLOR
            r.bold = bold_default
            r.italic = italic_default
        elif part.startswith("**") and part.endswith("**"):
            inner = part[2:-2]
            add_formatted_runs(p, inner, font_size=font_size, color=color, bold_default=True, italic_default=italic_default)
        elif part.startswith("*") and part.endswith("*"):
            inner = part[1:-1]
            add_formatted_runs(p, inner, font_size=font_size, color=color, bold_default=bold_default, italic_default=True)
        else:
            r = p.add_run(part)
            set_run_fonts(r, "Times New Roman")
            r.font.size = Pt(font_size)
            r.font.color.rgb = color
            r.bold = bold_default
            r.italic = italic_default


def add_body_paragraph(doc, text, indent=True, space_after=6):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    pf = p.paragraph_format
    pf.line_spacing = 1.5
    pf.space_before = Pt(0)
    pf.space_after = Pt(space_after)
    if indent:
        pf.first_line_indent = Cm(0.8)
    add_formatted_runs(p, text, font_size=12)
    return p


def add_numbered_or_bullet_item(doc, prefix_label, text, left_indent=0.8):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    pf = p.paragraph_format
    pf.line_spacing = 1.5
    pf.left_indent = Cm(left_indent + 0.5)
    pf.first_line_indent = Cm(-0.5)
    pf.space_before = Pt(0)
    pf.space_after = Pt(4)
    r_pre = p.add_run(prefix_label + " ")
    set_run_fonts(r_pre, "Times New Roman")
    r_pre.font.size = Pt(12)
    r_pre.font.color.rgb = DARK_TEXT
    r_pre.bold = True
    add_formatted_runs(p, text, font_size=12)
    return p


def add_heading_h1(doc, bab_label, title_text):
    p0 = doc.add_paragraph()
    p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p0.paragraph_format.space_before = Pt(0)
    p0.paragraph_format.space_after = Pt(2)
    p0.paragraph_format.keep_with_next = True
    r0 = p0.add_run(bab_label)
    set_run_fonts(r0, "Times New Roman")
    r0.font.size = Pt(14)
    r0.bold = True
    r0.font.color.rgb = NAVY_COLOR

    p1 = doc.add_paragraph()
    p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p1.paragraph_format.space_before = Pt(0)
    p1.paragraph_format.space_after = Pt(14)
    p1.paragraph_format.keep_with_next = True
    r1 = p1.add_run(title_text)
    set_run_fonts(r1, "Times New Roman")
    r1.font.size = Pt(14)
    r1.bold = True
    r1.font.color.rgb = NAVY_COLOR


def add_heading_h2(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    pf = p.paragraph_format
    pf.space_before = Pt(14)
    pf.space_after = Pt(6)
    pf.line_spacing = 1.15
    pf.keep_with_next = True
    r = p.add_run(text)
    set_run_fonts(r, "Times New Roman")
    r.font.size = Pt(12)
    r.bold = True
    r.font.color.rgb = NAVY_COLOR
    return p


def add_heading_h3(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    pf = p.paragraph_format
    pf.space_before = Pt(10)
    pf.space_after = Pt(4)
    pf.line_spacing = 1.15
    pf.keep_with_next = True
    r = p.add_run(text)
    set_run_fonts(r, "Times New Roman")
    r.font.size = Pt(12)
    r.bold = True
    r.font.color.rgb = DARK_TEXT
    return p


def add_table_caption(doc, label_text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    pf = p.paragraph_format
    pf.space_before = Pt(8)
    pf.space_after = Pt(4)
    pf.line_spacing = 1.15
    pf.keep_with_next = True
    add_formatted_runs(p, f"**{label_text}**", font_size=11, color=NAVY_COLOR)
    return p


def add_figure_block(doc, img_filename, width_cm, caption_text):
    img_path = os.path.join(SCREENSHOTS_DIR, img_filename)
    if not os.path.exists(img_path):
        raise FileNotFoundError(f"Gambar tidak ditemukan: {img_path}")

    p_img = doc.add_paragraph()
    p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_img.paragraph_format.space_before = Pt(8)
    p_img.paragraph_format.space_after = Pt(4)
    p_img.paragraph_format.line_spacing = 1.0
    p_img.paragraph_format.keep_with_next = True
    p_img.add_run().add_picture(img_path, width=Cm(width_cm))

    p_cap = doc.add_paragraph()
    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap.paragraph_format.space_before = Pt(0)
    p_cap.paragraph_format.space_after = Pt(10)
    p_cap.paragraph_format.line_spacing = 1.15
    add_formatted_runs(p_cap, f"**{caption_text}**", font_size=10.5, color=DARK_TEXT)


def add_styled_table(doc, headers, rows, col_widths_cm, alignments, font_size=9.0, compact=False, pad_h=None):
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    col_dxas = [int(round(w * 566.929)) for w in col_widths_cm]
    total_dxa = sum(col_dxas)

    # Update tblGrid (kritis untuk Microsoft Word fixed column widths)
    tblGrid = table._tbl.tblGrid
    gridCols = tblGrid.findall(qn("w:gridCol"))
    for j, gc in enumerate(gridCols):
        gc.set(qn("w:w"), str(col_dxas[j]))
        table.columns[j].width = Cm(col_widths_cm[j])

    tblPr = table._tbl.tblPr
    tblW = OxmlElement("w:tblW")
    tblW.set(qn("w:w"), str(total_dxa))
    tblW.set(qn("w:type"), "dxa")
    replace_tbl_child(tblPr, "tblW", tblW)

    set_table_borders(table)

    tblLayout = OxmlElement("w:tblLayout")
    tblLayout.set(qn("w:type"), "fixed")
    replace_tbl_child(tblPr, "tblLayout", tblLayout)
    normalize_tblPr_order(tblPr)

    pad_v = 48 if compact else 70
    if pad_h is None:
        pad_h = 35 if compact else 75

    # Header row
    hdr_row = table.rows[0]
    set_repeat_header(hdr_row)
    prevent_row_split(hdr_row)
    for j, h_text in enumerate(headers):
        cell = hdr_row.cells[j]
        set_cell_width_dxa(cell, col_dxas[j])
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        set_cell_shading(cell, NAVY_HEX)
        set_cell_margins(cell, top=pad_v + 15, bottom=pad_v + 15, left=pad_h, right=pad_h)
        p = cell.paragraphs[0]
        p.alignment = alignments[j]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.08
        add_formatted_runs(p, h_text, font_size=font_size, color=RGBColor(0xFF, 0xFF, 0xFF), bold_default=True)

    # Data rows
    for i, r_data in enumerate(rows):
        row = table.rows[i + 1]
        prevent_row_split(row)
        is_even = i % 2 == 1
        for j, val in enumerate(r_data):
            cell = row.cells[j]
            set_cell_width_dxa(cell, col_dxas[j])
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            set_cell_margins(cell, top=pad_v, bottom=pad_v, left=pad_h, right=pad_h)

            is_pass_cell = val in ("**LULUS**", "LULUS", "**TERUKUR**", "TERUKUR")
            if is_pass_cell and "LULUS" in val:
                set_cell_shading(cell, PASS_BG_HEX)
            elif is_even:
                set_cell_shading(cell, STRIPE_HEX)

            p = cell.paragraphs[0]
            p.alignment = alignments[j]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.1
            cell_color = PASS_TEXT if (is_pass_cell and "LULUS" in val) else DARK_TEXT
            add_formatted_runs(p, val, font_size=font_size, color=cell_color)

    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(0)
    p_sp.paragraph_format.space_after = Pt(6)
    p_sp.paragraph_format.line_spacing = 1.0


def build_document():
    doc = Document()

    # Set default Normal style font ke Times New Roman 12pt
    normal_style = doc.styles["Normal"]
    normal_style.font.name = "Times New Roman"
    normal_style.font.size = Pt(12)
    rPr = normal_style.element.get_or_add_rPr()
    rFonts = rPr.find(qn("w:rFonts"))
    if rFonts is None:
        rFonts = OxmlElement("w:rFonts")
        rPr.insert(0, rFonts)
    for attr in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        rFonts.set(qn(attr), "Times New Roman")

    # Konfigurasi halaman A4 margin skripsi standar Indonesia (Kiri 4 cm, Atas/Kanan/Bawah 3 cm)
    sec = doc.sections[0]
    sec.page_width = Cm(21.0)
    sec.page_height = Cm(29.7)
    sec.left_margin = Cm(4.0)
    sec.right_margin = Cm(3.0)
    sec.top_margin = Cm(3.0)
    sec.bottom_margin = Cm(3.0)
    sec.different_first_page_header_footer = True

    # Header & Footer halaman lanjutan
    hdr = sec.header.paragraphs[0]
    hdr.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r_hdr = hdr.add_run("Pengujian Latensi REST API Sistem Archtera (Grafana k6)")
    set_run_fonts(r_hdr, "Times New Roman")
    r_hdr.font.size = Pt(9)
    r_hdr.italic = True
    r_hdr.font.color.rgb = MUTED_TEXT

    ftr = sec.footer.paragraphs[0]
    ftr.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_ftr = ftr.add_run()
    set_run_fonts(r_ftr, "Times New Roman")
    r_ftr.font.size = Pt(10)
    r_ftr.font.color.rgb = DARK_TEXT
    add_page_number_to_run(r_ftr)

    ftr_first = sec.first_page_footer.paragraphs[0]
    ftr_first.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_ff = ftr_first.add_run()
    set_run_fonts(r_ff, "Times New Roman")
    r_ff.font.size = Pt(10)
    r_ff.font.color.rgb = DARK_TEXT
    add_page_number_to_run(r_ff)

    # Judul Utama
    add_heading_h1(
        doc,
        "LAPORAN HASIL PENGUJIAN NON-FUNGSIONAL",
        "PENGUJIAN LATENSI DAN KINERJA REST API SISTEM ARCHTERA MENGGUNAKAN GRAFANA k6",
    )

    add_body_paragraph(
        doc,
        "Pengujian non-fungsional berupa pengujian kinerja dan latensi (*performance and latency testing*) dilakukan untuk mengevaluasi kecepatan waktu tanggap (*response time*), kestabilan pemrosesan konkuren, serta keandalan layanan *backend* pada sistem **Archtera — Air Safe Area** di bawah berbagai kondisi beban akses pengguna. Berbeda dengan pengujian fungsional (*black-box testing*) yang berfokus pada kebenaran keluaran logika tiap *endpoint*, pengujian latensi berfokus pada perilaku sistem terhadap waktu tanggap (*response time*), ketahanan saat diakses serentak (*concurrency*), serta waktu pemrosesan sisi *server* (*Time to First Byte / TTFB*). Seluruh rangkaian pengujian dilaksanakan pada tanggal 10 November 2026 menggunakan perkakas *load testing* sumber terbuka **Grafana `k6 v2.2.0`** dengan target utama *server* produksi pada domain `https://archtera.web.id/api` serta pengujian operasi tulis terisolasi terhadap *backend* lokal `http://127.0.0.1:3318`.",
    )

    # 4.1
    add_heading_h2(doc, "4.1 Tujuan dan Ruang Lingkup Pengujian")
    add_body_paragraph(
        doc,
        "Pengujian kinerja sistem bertujuan memperoleh ukuran kuantitatif yang objektif terkait kesiapan layanan REST API Archtera saat diakses secara simultan oleh banyak pengguna maupun ketika memproses kueri historis sensor dari empat ruangan yang dipantau, yaitu Ruang H5 (`h5`), Laboratorium Teknik Digital (`lab_td`), Laboratorium Komputer (`lab_kom`), dan Ruang Seminar (`seminar`). Adapun sasaran spesifik yang ingin dibuktikan melalui pengujian ini meliputi:",
    )
    add_numbered_or_bullet_item(
        doc,
        "1.",
        "Mengukur latensi *end-to-end* secara nyata melewati jaringan internet publik, enkripsi HTTPS/TLS, *reverse proxy* Nginx, aplikasi Node.js Express (`backend/bridge.js`), hingga kueri basis data SQLite (`better-sqlite3`).",
    )
    add_numbered_or_bullet_item(
        doc,
        "2.",
        "Memverifikasi efektivitas indeks komposit basis data `idx_readings_room_time_id` dalam menjaga kecepatan kueri agregasi grafik berbasis interval waktu (per 1 menit, per 15 menit, dan per 30 menit) serta kueri paginasi log riwayat.",
    )
    add_numbered_or_bullet_item(
        doc,
        "3.",
        "Mengukur ketahanan *server* saat menghadapi lonjakan trafik mendadak (*spike test*) hingga 40 pengguna virtual konkuren (*Virtual Users*) tanpa menimbulkan kegagalan respons HTTP (`0,00%` *error*).",
    )
    add_numbered_or_bullet_item(
        doc,
        "4.",
        "Mengukur latensi operasi tulis *Create, Update, Delete* (CRUD) secara terisolasi sehingga kelancaran manajemen data pada halaman `/admin` dapat terukur tanpa mencemari basis data produksi maupun menggeser urutan *primary key ID* rekaman IoT yang sedang berjalan.",
    )
    add_body_paragraph(
        doc,
        "Untuk menjamin kelengkapan cakupan sistem, pengujian diarahkan ke seluruh **8 endpoint REST API** yang tersedia pada *backend* Archtera. Pemetaan masing-masing *endpoint* beserta peran fungsional dan target lingkungannya disajikan pada **Tabel 4.1**.",
    )

    add_table_caption(doc, "Tabel 4.1 Cakupan Endpoint REST API Sistem Archtera pada Pengujian Latensi")
    add_styled_table(
        doc,
        headers=["No", "Metode & Path", "Fungsi Sistem", "Target Uji", "Skenario Terkait"],
        rows=[
            ["1", "`GET /api/status`", "Pemeriksaan kesiapan *server* Express dan status koneksi *broker* MQTT EMQX", "Live VPS", "`baseline_smoke`, `analytics_load`"],
            ["2", "`GET /api/latest`", "Pengambilan 1 rekaman terbaru per ruangan untuk kartu metrik *real-time*", "Live VPS", "`baseline_smoke`, `live_polling`, `spike_test`"],
            ["3", "`GET /api/readings`", "Pengambilan deret waktu teragregasi (`1d/1m`, `7d/15m`, `30d/30m`) untuk grafik", "Live VPS", "`baseline_smoke`, `live_polling`, `analytics_load`, `spike_test`"],
            ["4", "`GET /api/readings/logs`", "Pengambilan tabel log riwayat terurut `DESC` dengan paginasi sisi *server*", "Live VPS", "`baseline_smoke`, `analytics_load`, `spike_test`"],
            ["5", "`GET /api/download`", "Ekspor seluruh data historis ruangan dari SQLite menjadi berkas CSV", "Live VPS", "`baseline_smoke`, `analytics_load`"],
            ["6", "`POST /readings`", "Penambahan 1 rekaman telemetri baru melalui jalur HTTP JSON (*Create*)", "Lokal Terisolasi", "`crud_lifecycle`"],
            ["7", "`PUT /readings/:id`", "Pembaruan data rekaman telemetri berdasarkan `id` (*Update*)", "Lokal Terisolasi", "`crud_lifecycle`"],
            ["8", "`DELETE /readings/:id`", "Penghapusan rekaman telemetri berdasarkan `id` (*Delete*)", "Lokal Terisolasi", "`crud_lifecycle`"],
        ],
        col_widths_cm=[0.80, 3.10, 4.95, 2.05, 3.10],
        alignments=[WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT],
        font_size=9.0,
    )
    add_body_paragraph(
        doc,
        "Berdasarkan pemetaan pada **Tabel 4.1**, seluruh operasi pembacaan (*read* dan *analytics*) diarahkan langsung ke *server* produksi guna menangkap karakteristik jaringan publik secara nyata, sementara tiga operasi perubahan data (*write/CRUD*) diuji secara terpisah pada salinan basis data lokal terisolasi demi menjaga integritas data telemetri aktif.",
    )

    # 4.2
    add_heading_h2(doc, "4.2 Lingkungan dan Arsitektur Pengujian")
    add_body_paragraph(
        doc,
        "Pengujian dilaksanakan dari sisi klien (*load generator*) menggunakan sistem operasi Windows dengan perkakas **Grafana `k6 v2.2.0`** (`windows/amd64`) yang menembakkan permintaan HTTP/HTTPS asinkron sesuai skenario beban. Pemisahan konfigurasi antara klaster pembacaan pada *Virtual Private Server* (VPS) produksi dan klaster operasi tulis CRUD pada *instance* terisolasi dirangkum dalam **Tabel 4.2**.",
    )

    add_table_caption(doc, "Tabel 4.2 Spesifikasi Lingkungan Pengujian Performa")
    add_styled_table(
        doc,
        headers=["Komponen Lingkungan", "Pengujian Baca & Analitik (Live VPS Suite)", "Pengujian Operasi Tulis CRUD (Isolated Suite)"],
        rows=[
            ["**Perkakas Generator Beban**", "Grafana `k6 v2.2.0` (`windows/amd64`)", "Grafana `k6 v2.2.0` + *wrapper* Node.js"],
            ["**Skrip Pengujian**", "`testing/k6/latency-suite.js`", "`testing/k6/crud-isolated.js` & `run-crud-isolated.js`"],
            ["**Alamat Target API**", "`https://archtera.web.id/api`", "`http://127.0.0.1:3318`"],
            ["**Jalur Permintaan (*Stack*)**", "Internet (HTTPS/TLS) -> Nginx Reverse Proxy -> Node.js Express (`bridge.js`) -> SQLite", "Lokal Loopback (HTTP) -> Node.js Express (`bridge.js`) -> Salinan SQLite Sementara"],
            ["**Variasi Parameter Ruangan**", "Rotasi merata: `h5`, `lab_td`, `lab_kom`, `seminar`", "Rotasi merata: `h5`, `lab_td`, `lab_kom`, `seminar`"],
            ["**Status Subscriber MQTT**", "Aktif terhubung ke `mqtt://broker.emqx.io`", "Dinonaktifkan (`DISABLE_MQTT=1`) selama sesi isolasi"],
        ],
        col_widths_cm=[3.80, 5.10, 5.10],
        alignments=[WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT],
        font_size=9.2,
    )
    add_body_paragraph(
        doc,
        "Sebagaimana ditunjukkan pada **Tabel 4.2**, jalur permintaan menuju *Live VPS* melewati beberapa lapisan infrastruktur sekaligus—mulai dari negosiasi TLS, penanganan koneksi pada *reverse proxy* Nginx, pemrosesan *route* Express, hingga pembacaan indeks SQLite. Sebaliknya, pada pengujian CRUD lokal tidak terdapat latensi jaringan internet maupun *TLS handshaking*, sehingga waktu yang terukur murni mencerminkan kecepatan eksekusi Express dan operasi baca-tulis berkas basis data SQLite.",
    )

    # 4.3
    add_heading_h2(doc, "4.3 Alur dan Tahapan Prosedur Pengujian")
    add_body_paragraph(
        doc,
        "Agar proses pengujian dapat direproduksi secara konsisten serta mampu memisahkan pengukuran kondisi tenang dari kondisi beban puncak, prosedur pengujian disusun ke dalam empat tahapan sistematis mulai dari persiapan skrip dan ambang batas, eksekusi beban berurutan pada *Live VPS*, eksekusi siklus tulis CRUD pada lingkungan terisolasi, hingga tahap kompilasi laporan statistik dan tangkapan layar. Diagram alur lengkap tahapan pengujian tersebut ditunjukkan pada **Gambar 4.1**.",
    )

    add_figure_block(
        doc,
        "00_diagram_alur_pengujian_k6.png",
        14.0,
        "Gambar 4.1 Diagram Alur Prosedur Pengujian Latensi REST API Menggunakan Grafana k6",
    )

    add_body_paragraph(
        doc,
        "Mengacu pada diagram alur kerja pada **Gambar 4.1**, rincian teknis pelaksanaan pada keempat tahapan tersebut dijabarkan sebagai berikut:",
    )
    add_numbered_or_bullet_item(
        doc,
        "1.",
        "**Tahap Persiapan dan Penetapan Ambang Batas (*Thresholds*):** Pada tahap awal, skrip `testing/k6/latency-suite.js` dikonfigurasi dengan menempelkan penanda (*tag*) spesifik pada tiap *endpoint* (`status`, `latest`, `readings_1d_1m`, `readings_7d_15m`, `readings_30d_30m`, `readings_logs`, `download_csv`) dan tiap skenario beban. Bersamaan dengan itu, ditetapkan pula 15 kriteria *threshold* otomatis berbasis persentil ke-95 (`p(95)`) dan rasio kesalahan HTTP di bawah 1% (`rate<0.01`) sebagai standar evaluasi kelulusan.",
    )
    add_numbered_or_bullet_item(
        doc,
        "2.",
        "**Tahap Eksekusi Empat Skenario pada *Live VPS*:** Perintah `k6 run --summary-export=testing/k6/reports/latency-summary.json testing/k6/latency-suite.js` dijalankan untuk mengeksekusi empat skenario beban secara berurutan (*sequential*) dengan jeda pemulihan selama 3–7 detik antar skenario. Seluruh log konsol disimpan ke `k6-terminal-output.txt`, sedangkan ringkasan statistik lengkap diekspor ke dalam `latency-summary.json`.",
    )
    add_numbered_or_bullet_item(
        doc,
        "3.",
        "**Tahap Eksekusi Uji Tulis CRUD Terisolasi:** Skrip orkestrator `testing/k6/run-crud-isolated.js` menyalin berkas basis data `backend/air_data.db` ke direktori sementara sistem operasi (*OS temp directory*), lalu menyalakan proses *server* `backend/bridge.js` pada port `3318` dengan `DISABLE_MQTT=1`. Setelah `/status` merespons siap, `k6` menjalankan `crud-isolated.js` di mana tiap iterasi menjalankan siklus berantai `POST /readings` -> mengambil *ID* baru -> `PUT /readings/:id` -> `DELETE /readings/:id`. Setelah ringkasan tersimpan di `crud-summary.json`, *server* sementara dimatikan dan salinan database uji langsung dihapus otomatis.",
    )
    add_numbered_or_bullet_item(
        doc,
        "4.",
        "**Tahap Kompilasi Laporan Visual dan Validasi SLA:** Skrip `testing/k6/generate-report.js` mengolah kedua berkas JSON metrik dan log terminal menjadi laporan visual interaktif beserta grafik batang SVG, lalu memotret keempat bagian laporan menggunakan peramban Chrome *headless* (`2x DPI`) untuk disusun menjadi dokumen dokumentasi Skripsi.",
    )

    # 4.4
    add_heading_h2(doc, "4.4 Pemodelan Beban (*Workload Modeling*) dan Kriteria SLA")
    add_body_paragraph(
        doc,
        "Pola akses pengguna terhadap aplikasi dashboard pemantauan kualitas udara bersifat heterogen: mayoritas trafik berasal dari pembaruan metrik langsung (*live polling*) yang ringan dan berkala, diikuti aktivitas analitik pengguna yang mengganti rentang grafik (`1d/1m`, `7d/15m`, `30d/30m`) dan memeriksa tabel log riwayat, serta potensi lonjakan akses serentak (*traffic burst*) saat banyak klien membuka halaman secara bersamaan. Oleh karena itu, pengujian memodelkan lima skenario beban yang dirangkum pada **Tabel 4.3**.",
    )

    add_table_caption(doc, "Tabel 4.3 Desain Parameter Skenario Beban dan Kriteria Kelulusan SLA (k6)")
    add_styled_table(
        doc,
        headers=["No", "Nama Skenario", "Executor k6", "Profil VUs & Durasi", "Simulasi Perilaku Pengguna", "SLA p(95)"],
        rows=[
            ["1", "**`baseline_smoke`**", "`shared-iterations`", "1 VU tetap, 4 iterasi (`t = 0–3s`)", "Akses berurutan seluruh 7 varian GET lintas 4 ruangan pada kondisi sepi (*baseline*).", "`< 500 ms`"],
            ["2", "**`live_polling`**", "`constant-vus`", "15 VUs konstan, 30s (`t = 10–40s`)", "15 pengguna memantau *dashboard*; *polling* `/latest` per 1s + *refresh* grafik `1m` tiap 6 iterasi.", "`< 400 ms`"],
            ["3", "**`analytics_load`**", "`ramping-vus`", "`0->10->25->0` VUs, 45s (`t = 43–88s`)", "Hingga 25 pengguna aktif berpindah filter `1d/7d/30d`, paginasi log hal. 1–3, `/status`, & CSV.", "`< 700 ms`"],
            ["4", "**`spike_test`**", "`ramping-vus`", "`5->40->0` VUs *burst*, 30s (`t = 91–121s`)", "Lonjakan trafik mendadak ke 40 pengguna konkuren pada endpoint `/latest`, `/readings`, & `/logs`.", "`< 1000 ms`"],
            ["5", "**`crud_lifecycle`**", "`ramping-vus`", "`1->5->10->0` VUs, 25s (DB Lokal)", "Siklus penuh `POST -> PUT -> DELETE` admin pada 1–10 VUs di database lokal terisolasi.", "`< 150 ms`"],
        ],
        col_widths_cm=[0.70, 2.35, 2.15, 2.85, 4.35, 1.60],
        alignments=[WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER],
        font_size=8.6,
    )
    add_body_paragraph(
        doc,
        "Penetapan batas kelulusan pada **Tabel 4.3** bertumpu pada indikator **persentil ke-95 (`p(95)`)** alih-alih nilai rata-rata tunggal. Penggunaan `p(95)` memastikan bahwa sekurang-kurangnya 95% dari total permintaan dilayani lebih cepat daripada ambang batas toleransi yang ditetapkan, sehingga lonjakan ekor (*tail latency*) tetap terkontrol. Di samping itu, seluruh rangkaian uji mensyaratkan keberhasilan asersi `checks` di atas 99% serta kegagalan HTTP (`http_req_failed`) di bawah 1%.",
    )

    # 4.5
    add_heading_h2(doc, "4.5 Hasil Pengujian dan Pembahasan")

    # 4.5.1
    add_heading_h3(doc, "4.5.1 Ringkasan Eksekusi Global pada Server Produksi (Live VPS)")
    add_body_paragraph(
        doc,
        "Eksekusi skrip `testing/k6/latency-suite.js` terhadap *server* produksi `https://archtera.web.id/api` berlangsung selama **2 menit 1,2 detik** dan menyelesaikan seluruh 4 skenario tanpa adanya satu pun iterasi yang terhenti maupun gagal. Selama proses berjalan, `k6` mengirimkan total **3.344 permintaan HTTP** (laju throughput rata-rata **27,59 req/s**) dari **3.146 iterasi** lengkap dengan transfer data masuk sebesar **19,50 MB** (`160,90 kB/s`), serta membukukan tingkat keberhasilan asersi (`checks`) sebesar **100,00% (3.372/3.372)**. Tangkapan layar keluaran terminal `k6` beserta rincian validasi 15 kriteria *threshold* diperlihatkan pada **Gambar 4.2**.",
    )

    add_figure_block(
        doc,
        "01_terminal_eksekusi_k6.png",
        10.6,
        "Gambar 4.2 Tangkapan Layar Keluaran Terminal Eksekusi k6 run testing/k6/latency-suite.js",
    )

    add_body_paragraph(
        doc,
        "Guna menguraikan komposisi waktu tempuh permintaan yang tampak pada **Gambar 4.2** menjadi komponen antrean jaringan, jabat tangan TLS, waktu tunggu respons *server*, hingga transfer *body*, seluruh metrik tingkat global dirangkum pada **Tabel 4.4**.",
    )

    add_table_caption(doc, "Tabel 4.4 Rekapitulasi Metrik Global dan Komponen Latensi Jaringan (Live VPS)")
    add_styled_table(
        doc,
        headers=["Metrik k6", "Min", "Avg", "Med", "p(90)", "p(95)", "p(99)", "Max", "Keterangan"],
        rows=[
            ["`http_req_duration`", "37,70", "**83,29**", "65,56", "122,31", "**192,79**", "373,50", "1.007,94", "Total durasi ujung ke ujung (ms)"],
            ["`http_req_waiting`", "37,70", "**80,81**", "63,92", "119,78", "**186,34**", "360,21", "682,02", "Waktu tunggu server / TTFB (ms)"],
            ["`http_req_receiving`", "0,00", "2,36", "0,00", "3,56", "6,86", "35,04", "736,75", "Unduh *payload* JSON/CSV (ms)"],
            ["`http_req_sending`", "0,00", "0,12", "0,00", "0,34", "0,45", "0,79", "5,01", "Pengiriman header request (ms)"],
            ["`http_req_blocked`", "0,00", "0,95", "0,00", "0,00", "0,00", "53,55", "426,89", "Inisialisasi soket TCP + TLS (ms)"],
            ["`http_req_tls_handshaking`", "0,00", "0,61", "0,00", "0,00", "0,00", "31,84", "403,63", "Negosiasi SSL awal per VU (ms)"],
        ],
        col_widths_cm=[3.20, 0.92, 0.92, 0.92, 0.98, 1.00, 0.98, 1.20, 3.88],
        alignments=[
            WD_ALIGN_PARAGRAPH.LEFT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.LEFT,
        ],
        font_size=8.3,
        compact=True,
        pad_h=30,
    )
    add_body_paragraph(
        doc,
        "Analisis terhadap **Gambar 4.2** dan **Tabel 4.4** memperlihatkan bahwa tingkat kegagalan HTTP (`http_req_failed`) berada di angka **0,00%** dari 3.344 permintaan dengan median waktu tanggap **65,56 ms** (`avg = 83,29 ms`) serta `p(95)` sebesar **192,79 ms**. Fenomena menarik terlihat pada metrik `http_req_tls_handshaking` dan `http_req_blocked` yang sama-sama bernilai **0,00 ms** hingga persentil ke-95 sebelum naik sesaat pada persentil ke-99 (`31,84 ms`–`53,55 ms`; maksimum `403,63 ms`). Pola ini membuktikan mekanisme koneksi persisten (*HTTP Keep-Alive*) berjalan optimal antara klien dan *reverse proxy* Nginx: jabat tangan TCP beserta sertifikat SSL/TLS hanya dilakukan satu kali saat tiap *Virtual User* membuka koneksi perdana, sementara ribuan permintaan berikutnya memanfaatkan koneksi aktif sehingga sekitar 97% durasi permintaan (`80,81 ms` dari `83,29 ms`) merupakan waktu tunggu jaringan dan pemrosesan *server* (`http_req_waiting`).",
    )

    # 4.5.2
    add_heading_h3(doc, "4.5.2 Evaluasi Latensi per Endpoint dan Pemisahan Waktu Proses Server (TTFB)")
    add_body_paragraph(
        doc,
        "Pengukuran selanjutnya dikelompokkan berdasarkan masing-masing *endpoint* pembacaan untuk membandingkan kinerja *endpoint* ringan (`/status` dan `/latest`), *endpoint* analitik agregasi grafik berdasarkan interval waktu (`1d/1m`, `7d/15m`, `30d/30m`), paginasi tabel log (`/readings/logs`), serta ekspor berkas CSV (`/download`). Visualisasi ringkasan KPI global dan diagram batang horizontal perbandingan nilai `Avg`, `p(95)`, dan `p(99)` antar ketujuh varian *endpoint* tersebut ditampilkan pada **Gambar 4.3**.",
    )

    add_figure_block(
        doc,
        "02_ringkasan_dan_grafik_latensi.png",
        14.0,
        "Gambar 4.3 Ringkasan Kinerja Global dan Grafik Batang Latensi per Endpoint REST API",
    )

    add_body_paragraph(
        doc,
        "Untuk memberikan acuan numerik yang presisi atas diagram pada **Gambar 4.3**, rincian lengkap seluruh nilai statistik persentil (`min`, `avg`, `med`, `p(90)`, `p(95)`, `p(99)`, `max`) berikut status pemenuhan SLA masing-masing *endpoint* dirangkum dalam **Tabel 4.5**.",
    )

    add_table_caption(doc, "Tabel 4.5 Statistik Pengukuran Latensi (http_req_duration) per Endpoint pada Live VPS")
    add_styled_table(
        doc,
        headers=["No", "Endpoint REST API", "Min", "Avg", "Med", "p(90)", "p(95)", "p(99)", "Max", "SLA p(95)", "Status"],
        rows=[
            ["1", "`GET /api/status`", "39,86", "65,13", "53,95", "81,14", "**101,65**", "288,18", "416,64", "`< 300 ms`", "**LULUS**"],
            ["2", "`GET /api/latest?room=...`", "37,70", "80,13", "61,42", "120,67", "**172,94**", "397,40", "682,50", "`< 350 ms`", "**LULUS**"],
            ["3", "`GET /api/readings` (`1d`, `1m`)", "39,81", "94,20", "73,31", "166,65", "**230,81**", "381,74", "517,81", "`< 600 ms`", "**LULUS**"],
            ["4", "`GET /api/readings` (`7d`, `15m`)", "39,55", "85,96", "69,81", "126,91", "**209,53**", "339,19", "484,51", "`< 600 ms`", "**LULUS**"],
            ["5", "`GET /api/readings` (`30d`, `30m`)", "43,50", "89,34", "67,95", "147,33", "**213,05**", "376,82", "519,55", "`< 600 ms`", "**LULUS**"],
            ["6", "`GET /api/readings/logs`", "40,10", "80,33", "66,97", "106,97", "**171,15**", "335,82", "582,44", "`< 500 ms`", "**LULUS**"],
            ["7", "`GET /api/download` (CSV)", "39,68", "150,29", "67,12", "139,08", "**488,89**", "904,13", "1.007,94", "`< 1500 ms`", "**LULUS**"],
        ],
        col_widths_cm=[0.55, 3.35, 0.95, 0.95, 0.95, 1.00, 1.00, 1.00, 1.20, 1.60, 1.45],
        alignments=[
            WD_ALIGN_PARAGRAPH.CENTER,
            WD_ALIGN_PARAGRAPH.LEFT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.CENTER,
            WD_ALIGN_PARAGRAPH.CENTER,
        ],
        font_size=8.0,
        compact=True,
        pad_h=28,
    )

    add_body_paragraph(
        doc,
        "Selain total durasi respons pada **Tabel 4.5**, dilakukan pula pemisahan khusus metrik waktu tunggu *server* (*Time to First Byte / `http_req_waiting`*) guna membedakan durasi komputasi kueri Nginx/Express/SQLite dari durasi pengunduhan badan respons pada *endpoint* kritis berfrekuensi akses tinggi, yaitu `/latest` dan `/readings` (`1d/1m`), sebagaimana disajikan pada **Tabel 4.6**.",
    )

    add_table_caption(doc, "Tabel 4.6 Pemisahan Metrik Waktu Tunggu Server / TTFB (http_req_waiting) pada Endpoint Kritis")
    add_styled_table(
        doc,
        headers=["Metrik TTFB", "Min", "Avg", "Med", "p(90)", "p(95)", "p(99)", "Max", "SLA p(95)", "Status"],
        rows=[
            ["`http_req_waiting` (Global)", "37,70", "80,81", "63,92", "119,78", "**186,34**", "360,21", "682,02", "Monitoring", "**TERUKUR**"],
            ["`waiting{endpoint:latest}`", "37,70", "79,77", "61,01", "120,40", "**172,59**", "397,40", "682,02", "`< 300 ms`", "**LULUS**"],
            ["`waiting{endpoint:readings_1d_1m}`", "39,70", "83,42", "62,98", "145,16", "**192,63**", "356,08", "517,81", "`< 450 ms`", "**LULUS**"],
        ],
        col_widths_cm=[3.60, 0.95, 0.95, 0.95, 1.00, 1.00, 1.00, 1.20, 1.70, 1.65],
        alignments=[
            WD_ALIGN_PARAGRAPH.LEFT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.CENTER,
            WD_ALIGN_PARAGRAPH.CENTER,
        ],
        font_size=8.2,
        compact=True,
        pad_h=30,
    )

    add_body_paragraph(
        doc,
        "Keseluruhan hasil rekapitulasi metrik statistik dari **Tabel 4.5** dan **Tabel 4.6** beserta status kelulusan ambang batas SLA terdokumentasi dalam bentuk laporan tabel terpadu pada **Gambar 4.4**.",
    )

    add_figure_block(
        doc,
        "03_tabel_metrik_dan_threshold.png",
        14.0,
        "Gambar 4.4 Tangkapan Layar Tabel Statistik Persentil Endpoint dan Pemisahan TTFB (http_req_waiting)",
    )

    add_body_paragraph(
        doc,
        "Merujuk pada **Tabel 4.5**, **Tabel 4.6**, serta **Gambar 4.3** dan **Gambar 4.4**, dapat ditarik dua temuan teknis utama. Pertama, meskipun *endpoint* `GET /api/readings` menjalankan operasi pengelompokan interval waktu (`GROUP BY`) dan fungsi rata-rata (`ROUND(AVG(...))`) untuk rentang 1 hari (`1m`), 7 hari (`15m`), hingga 30 hari (`30m`), rata-rata waktunya tetap konsisten sangat cepat di kisaran **85,96–94,20 ms** (`p(95)` sebesar **209,53–230,81 ms**), sementara `GET /api/readings/logs` mencatat rata-rata **80,33 ms** (`p(95) = 171,15 ms`). Kestabilan tersebut didukung oleh keberadaan indeks komposit SQLite `idx_readings_room_time_id(room, recorded_at DESC, id DESC)` sehingga proses filter ruangan dan pengurutan data terbaru langsung menelusuri indeks tanpa memindai keseluruhan tabel (*full table scan*).",
    )
    add_body_paragraph(
        doc,
        "Kedua, pemisahan TTFB pada **Tabel 4.6** mengungkap dampak langsung ukuran *payload* terhadap durasi unduh: pada `GET /api/latest`, selisih antara total durasi `p(95)` (`172,94 ms`) dan TTFB `p(95)` (`172,59 ms`) hanya **0,35 ms** karena muatannya berupa satu objek JSON ringkas. Sebaliknya, pada `GET /api/readings` (`1d/1m`) terdapat selisih **38,18 ms** (`230,81 ms` vs `192,63 ms`) yang berasal dari waktu transfer ratusan titik agregasi grafik per 1 menit. Efek ukuran *payload* yang paling besar terlihat pada `GET /api/download` CSV (`avg = 150,29 ms`; `p(95) = 488,89 ms`; `max = 1.007,94 ms`) karena mengekspor seluruh rekaman mentah ruangan dalam sekali respons, tetapi nilainya masih lebih dari tiga kali lebih cepat dibandingkan batas SLA **1.500 ms**.",
    )

    # 4.5.3
    add_heading_h3(doc, "4.5.3 Analisis Stabilitas Lintas Skenario Beban dan Ketahanan Lonjakan (Spike Resilience)")
    add_body_paragraph(
        doc,
        "Evaluasi berikutnya membandingkan perilaku waktu tanggap *server* ketika tingkat konkurensi pengguna virtual dinaikkan secara progresif mulai dari kondisi tenang `1 VU` (*Baseline Smoke*), beban pemantauan kontinu `15 VUs` (*Live Polling*), beban analitik campuran hingga `25 VUs` (*Analytics & Logs*), sampai dengan lonjakan trafik mendadak sebesar `40 VUs` (*Spike Test*). Perbandingan statistik kinerja antar keempat skenario tersebut disajikan pada **Tabel 4.7**.",
    )

    add_table_caption(doc, "Tabel 4.7 Perbandingan Latensi (http_req_duration) Lintas Empat Skenario Beban pada Live VPS")
    add_styled_table(
        doc,
        headers=["Skenario Pengujian", "Beban VU", "Min", "Avg", "Med", "p(90)", "p(95)", "p(99)", "Max", "SLA p(95)", "Status"],
        rows=[
            ["**1. Baseline Smoke**", "1 VU tetap", "39,68", "63,14", "49,57", "94,26", "**145,69**", "183,99", "188,10", "`< 500 ms`", "**LULUS**"],
            ["**2. Live Polling**", "15 VU konstan", "37,70", "81,59", "55,08", "131,24", "**260,68**", "439,08", "595,17", "`< 400 ms`", "**LULUS**"],
            ["**3. Analytics & Logs**", "0->25 VU ramp", "39,86", "87,13", "65,65", "148,22", "**209,51**", "445,76", "1.007,94", "`< 700 ms`", "**LULUS**"],
            ["**4. Spike Resilience**", "5->40 VU burst", "37,92", "82,22", "67,91", "113,35", "**173,68**", "336,88", "682,50", "`< 1000 ms`", "**LULUS**"],
        ],
        col_widths_cm=[2.35, 1.60, 0.95, 0.95, 0.95, 1.00, 1.00, 1.00, 1.20, 1.55, 1.45],
        alignments=[
            WD_ALIGN_PARAGRAPH.LEFT,
            WD_ALIGN_PARAGRAPH.LEFT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.CENTER,
            WD_ALIGN_PARAGRAPH.CENTER,
        ],
        font_size=8.0,
        compact=True,
        pad_h=28,
    )
    add_body_paragraph(
        doc,
        "Data pada **Tabel 4.7** menunjukkan bahwa transisi dari kondisi *baseline* `1 VU` (`avg = 63,14 ms`; `p(95) = 145,69 ms`) menuju pemantauan kontinu `15 VUs` (`avg = 81,59 ms`) dan analitik `25 VUs` (`avg = 87,13 ms`) hanya menaikkan rata-rata latensi sebesar ~18–24 ms. Lebih lanjut, ketika *server* menghadapi lonjakan mendadak hingga **40 pengguna virtual secara serentak** pada `spike_test`, rata-rata waktu tanggap tetap terjaga sangat stabil pada **82,22 ms** dengan `p(95)` hanya **173,68 ms** serta tingkat keberhasilan penuh (`0,00%` *error*). Hal tersebut membuktikan bahwa arsitektur *event loop* Node.js beserta indeks SQLite mampu menangani lonjakan beban 40 pengguna serentak tanpa mengalami penumpukan antrean (*thread saturation*).",
    )

    # 4.5.4
    add_heading_h3(doc, "4.5.4 Hasil Pengujian Operasi Tulis CRUD pada Lingkungan Terisolasi")
    add_body_paragraph(
        doc,
        "Guna melengkapi evaluasi delapan *endpoint* sistem Archtera, pengujian operasi tulis manajemen data panel admin (`POST /readings`, `PUT /readings/:id`, `DELETE /readings/:id`) dijalankan melalui `testing/k6/run-crud-isolated.js` dengan profil kenaikan beban `1 -> 5 -> 10 -> 0 VUs` selama 25 detik terhadap salinan basis data lokal di port `3318`. Pengujian ini mengeksekusi **495 siklus CRUD lengkap** atau setara **1.485 permintaan HTTP** (throughput **59,12 req/s**) dengan rasio keberhasilan **100,00%** (`0` gagal). Rekapitulasi metrik hasil pengujian CRUD terisolasi disajikan pada **Tabel 4.8**.",
    )

    add_table_caption(doc, "Tabel 4.8 Hasil Pengukuran Latensi Operasi Tulis CRUD (1–10 VU Ramp pada Database Terisolasi)")
    add_styled_table(
        doc,
        headers=["Operasi HTTP CRUD", "Min", "Avg", "Med", "p(90)", "p(95)", "p(99)", "Max", "SLA p(95)", "Status"],
        rows=[
            ["**Global CRUD (`1.485 reqs`)**", "6,68", "31,88", "16,58", "62,75", "**95,78**", "336,69", "687,22", "—", "**TERUKUR**"],
            ["**`POST /readings`** (Create)", "7,90", "39,25", "13,77", "69,73", "**109,36**", "591,11", "687,22", "`< 150 ms`", "**LULUS**"],
            ["**`PUT /readings/:id`** (Update)", "6,68", "28,37", "17,35", "62,02", "**91,38**", "125,73", "414,13", "`< 150 ms`", "**LULUS**"],
            ["**`DELETE /readings/:id`** (Delete)", "6,98", "28,00", "17,38", "59,58", "**86,27**", "119,38", "571,43", "`< 150 ms`", "**LULUS**"],
        ],
        col_widths_cm=[3.50, 0.95, 0.95, 0.95, 1.00, 1.00, 1.00, 1.20, 1.75, 1.70],
        alignments=[
            WD_ALIGN_PARAGRAPH.LEFT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.RIGHT,
            WD_ALIGN_PARAGRAPH.CENTER,
            WD_ALIGN_PARAGRAPH.CENTER,
        ],
        font_size=8.2,
        compact=True,
        pad_h=30,
    )

    add_body_paragraph(
        doc,
        "Visualisasi terpadu yang membandingkan kinerja antar keempat skenario beban pada **Tabel 4.7** beserta hasil pengujian operasi tulis CRUD dari **Tabel 4.8** ditampilkan pada **Gambar 4.5**.",
    )

    add_figure_block(
        doc,
        "04_skenario_beban_dan_crud.png",
        14.0,
        "Gambar 4.5 Tangkapan Layar Evaluasi Lintas Empat Skenario Beban dan Hasil Uji Operasi Tulis CRUD SQLite",
    )

    add_body_paragraph(
        doc,
        "Hasil pengujian pada **Tabel 4.8** dan **Gambar 4.5** memberikan dua wawasan teknis penting mengenai performa internal *backend*. Pertama, nilai median transaksi lokal untuk ketiga operasi tulis hanya berkisar **13,77–17,38 ms** (`avg = 31,88 ms`), sehingga terkonfirmasi bahwa waktu pemrosesan murni di dalam Express + SQLite sangat singkat (~15 ms), dan selisih waktu ~50–65 ms yang tampak pada uji *Live VPS* didominasi oleh waktu rambat jaringan internet menuju *server*. Kedua, operasi pembaruan `PUT /readings/:id` (`p(95) = 91,38 ms`; `p(99) = 125,73 ms`) dan penghapusan `DELETE /readings/:id` (`p(95) = 86,27 ms`; `p(99) = 119,38 ms`) berbasis *primary key* memiliki ekor distribusi yang jauh lebih rapat dibandingkan penambahan baris `POST /readings` (`p(95) = 109,36 ms`; `p(99) = 591,11 ms`). Lonjakan sesaat pada persentil ke-99 `POST` tersebut merupakan karakteristik alami mode *rollback journal* standar pada SQLite ketika sejumlah *Virtual User* meminta kunci tulis eksklusif secara bersamaan, yang pada skala trafik sangat tinggi dapat dioptimalkan lebih lanjut menggunakan mode *Write-Ahead Logging* (`PRAGMA journal_mode = WAL`).",
    )

    # 4.6
    add_heading_h2(doc, "4.6 Kesimpulan Pengujian Latensi")
    add_body_paragraph(
        doc,
        "Berdasarkan keseluruhan rangkaian pengujian menggunakan **Grafana `k6 v2.2.0`**, layanan REST API sistem **Archtera** pada seluruh **8 endpoint** operasionalnya dinyatakan sangat responsif, stabil, dan layak beroperasi di bawah beban pengguna konkuren. Pada pengujian langsung terhadap *server* produksi `https://archtera.web.id/api` sebanyak **3.344 permintaan HTTP**, sistem mencatat rata-rata latensi global **83,29 ms** (`med = 65,56 ms`, `p(95) = 192,79 ms`) dengan keberhasilan asersi **100,00%** dan **0,00% error** bahkan ketika menghadapi lonjakan mendadak **40 pengguna serentak**. Sementara pada pengujian operasi tulis CRUD terisolasi sebanyak **1.485 permintaan HTTP** (`495` siklus penuh), sistem mencatat rata-rata **31,88 ms** (`p(95) = 95,78 ms`). Dengan demikian, seluruh **20 kriteria ambang batas SLA** (15 kriteria *Live VPS suite* dan 5 kriteria *Isolated CRUD suite*) terpenuhi seluruhnya dengan status **LULUS**.",
    )

    doc.save(OUT_DOCX)
    verify_docx(OUT_DOCX)
    print("Dokumen Word berhasil dibuat & tervalidasi:", OUT_DOCX)


def verify_docx(path):
    doc = Document(path)
    with zipfile.ZipFile(path, "r") as z:
        assert z.testzip() is None, "File ZIP OOXML korup!"
        media = [n for n in z.namelist() if n.startswith("word/media/")]
        root = ET.fromstring(z.read("word/document.xml"))
        ns = {
            "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
            "wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
        }
        print(f"Verifikasi OOXML -> Paragraf: {len(doc.paragraphs)}, Tabel: {len(doc.tables)}, Media PNG: {len(media)}")
        for idx, tbl in enumerate(root.findall(".//w:tbl", ns)):
            grids = [int(gc.attrib.get(f"{{{ns['w']}}}w", 0)) for gc in tbl.findall("./w:tblGrid/w:gridCol", ns)]
            tblPr = tbl.find("./w:tblPr", ns)
            tags = [c.tag.split("}")[1] for c in tblPr]
            print(f"  Tabel {idx + 1}: total_dxa={sum(grids)} (~{sum(grids)/566.929:.2f}cm), gridCols={grids}, tblPr={tags}")
            assert 7925 <= sum(grids) <= 7950, f"Lebar Tabel {idx+1} tidak 14.0cm!"
        for idx, ext in enumerate(root.findall(".//wp:extent", ns)):
            cx = int(ext.attrib["cx"]) / 360000.0
            cy = int(ext.attrib["cy"]) / 360000.0
            print(f"  Gambar {idx + 1}: {cx:.2f} cm x {cy:.2f} cm")
            assert cx <= 14.05 and cy <= 21.0, f"Gambar {idx+1} melebihi batas halaman A4!"


if __name__ == "__main__":
    build_document()
