import logging
import azure.functions as func
from azure.storage.blob import BlobServiceClient
import pdfplumber
import io
import json

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('ParseSrdSorts function triggered.')

    try:
        # Connexion à Azure Storage via la variable d'environnement
        blob_service_client = BlobServiceClient.from_connection_string(
            os.environ["AzureWebJobsStorage"]
        )

        # Téléchargement du fichier PDF depuis le conteneur "srd-uploads"
        container_name = "srd-uploads"
        blob_name = "SRD_CC_v5.2.pdf"
        blob_client = blob_service_client.get_blob_client(container=container_name, blob=blob_name)
        blob_data = blob_client.download_blob().readall()

        # Lecture PDF avec pdfplumber
        pdf_file = io.BytesIO(blob_data)
        extracted_sorts = []

        with pdfplumber.open(pdf_file) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if "Spell" in text or "Cantrip" in text:
                    extracted_sorts.append(text)

        # DEBUG output
        logging.info(f"{len(extracted_sorts)} pages contenant des sorts détectées.")

        return func.HttpResponse(
            json.dumps({"pages_extraites": len(extracted_sorts)}),
            mimetype="application/json",
            status_code=200
        )

    except Exception as e:
        logging.error(str(e))
        return func.HttpResponse(f"Erreur: {e}", status_code=500)
