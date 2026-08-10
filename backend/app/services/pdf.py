import os
import markdown
from jinja2 import Environment, FileSystemLoader
from xhtml2pdf import pisa

def generate_pdf(client_name: str, executive_summary: str, parsed_items: list) -> str:
    # Convert markdown bullet points to HTML lists
    html_summary = markdown.markdown(executive_summary)
    
    # Load Template
    template_dir = os.path.join(os.path.dirname(__file__), "..", "templates")
    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template("quotation.html")
    
    # how we are getting the template -> quotation.html, in pdf.py
    # We are fetching it using the jinja2 library and Python's os module. Here is the breakdown of those three lines in pdf.py:
    # 1. os.path.dirname(__file__) gets the folder where pdf.py lives (app/services).
    # 2. os.path.join(..., "..", "templates") goes up one level and points to your app/templates folder.
    # 3. FileSystemLoader tells Jinja2 to look inside that specific folder, and get_template("quotation.html") loads the file into memory.

    # Render HTML with data
    html_content = template.render(
        client_name=client_name,
        executive_summary=html_summary,
        parsed_items=parsed_items
    )
    
    # Generate PDF
    output_filename = f"{client_name.replace(' ', '_')}_Quotation.pdf"
    output_path = os.path.join(os.getcwd(), output_filename)
    
    with open(output_path, "w+b") as pdf_file:
        pisa.CreatePDF(html_content, dest=pdf_file)
        
    return output_path

# --- TEST BLOCK ---
if __name__ == "__main__":
    print("Generating test PDF...")
    
    test_items = [
        {"item_name": "Enterprise Laptop", "qty": 50, "quoted_unit_price": 45000, "total_price": 2250000},
        {"item_name": "Database Server", "qty": 2, "quoted_unit_price": 115000, "total_price": 230000}
    ]
    test_summary = "* Complimentary extended warranties included.\n* Highly competitive market pricing."
    
    # Generate the PDF
    pdf_path = generate_pdf("Acme Corp Test", test_summary, test_items)
    print(f"Success! PDF saved at: {pdf_path}")