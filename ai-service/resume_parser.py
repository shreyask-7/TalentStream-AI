import fitz
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def extract_text_from_pdf(file_path: str) -> str:
    """Opens a PDF and extracts all text into a single string."""
    text = ""
    try:
        doc = fitz.open(file_path)
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text += page.get_text("text") + " "
        doc.close()
        return text.strip()
    except Exception as e:
        logger.error(f"❌ Failed to read PDF at {file_path}: {e}")
        return ""