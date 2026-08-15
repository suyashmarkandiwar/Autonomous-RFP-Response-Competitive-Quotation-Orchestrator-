import os
import markdown
from jinja2 import Environment, FileSystemLoader
from xhtml2pdf import pisa
from datetime import datetime, timedelta

# Stable output directory: always relative to this file, not the CWD
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_OUTPUTS_DIR = os.path.join(_BASE_DIR, "..", "..", "outputs")
os.makedirs(_OUTPUTS_DIR, exist_ok=True)  # Create on first run if absent

def fetch_resources(uri, rel):
    """
    Callback to allow xhtml2pdf to access local resources like fonts.
    Matches paths starting with 'fonts/' and resolves them to absolute paths.
    """
    if uri.startswith("fonts/"):
        path = os.path.join(_BASE_DIR, "..", "templates", uri)
        return os.path.abspath(path).replace('\\', '/')
    return uri

def generate_pdf(client_name: str, rfp_title: str, executive_summary: str, approved_items: list, quote_id: str) -> tuple[str, str]:
    html_summary = markdown.markdown(executive_summary)
    
    template_dir = os.path.join(os.path.dirname(__file__), "..", "templates")
    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template("quotation.html")
    
    # Calculate totals for the template
    for item in approved_items:
        item["total_price"] = item["quantity"] * item["final_price"]

    # Generate Dates
    now = datetime.now()
    current_date = now.strftime("%B %d, %Y")
    valid_until = (now + timedelta(days=90)).strftime("%Y-%m-%d")

    font_path_regular = "file:///" + os.path.abspath(os.path.join(template_dir, "fonts", "Roboto-Regular.ttf")).replace('\\', '/')
    font_path_bold = "file:///" + os.path.abspath(os.path.join(template_dir, "fonts", "Roboto-Bold.ttf")).replace('\\', '/')

    html_content = template.render(
        client_name=client_name,
        rfp_title=rfp_title,
        executive_summary=html_summary,
        approved_items=approved_items,
        quote_id=quote_id,
        current_date=current_date,
        valid_until=valid_until,
        font_path_regular=font_path_regular,
        font_path_bold=font_path_bold
    )
    
    # Save to stable outputs/ directory using an absolute path
    output_filename = f"{quote_id}.pdf"
    output_path = os.path.abspath(os.path.join(_OUTPUTS_DIR, output_filename))
    
    with open(output_path, "w+b") as pdf_file:
        pisa.CreatePDF(html_content, dest=pdf_file, link_callback=fetch_resources)
        
    return output_path, html_content