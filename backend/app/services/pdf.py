import os
import markdown
from jinja2 import Environment, FileSystemLoader
from xhtml2pdf import pisa
from datetime import datetime, timedelta

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

    html_content = template.render(
        client_name=client_name,
        rfp_title=rfp_title,
        executive_summary=html_summary,
        approved_items=approved_items,
        quote_id=quote_id,
        current_date=current_date,
        valid_until=valid_until
    )
    
    # Save using quote_id for easy retrieval in /download-pdf
    output_filename = f"{quote_id}.pdf"
    output_path = os.path.join(os.getcwd(), output_filename)
    
    with open(output_path, "w+b") as pdf_file:
        pisa.CreatePDF(html_content, dest=pdf_file)
        
    return output_path, html_content