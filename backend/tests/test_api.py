from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_process_rfp():
    payload = {
        "client_name": "Test Corp",
        "rfp_text": "We need 5 Enterprise Laptops."
    }
    response = client.post("/api/v1/process-rfp", json=payload)
    
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["client_name"] == "Test Corp"
    assert len(data["parsed_items"]) > 0
    assert "Enterprise Laptop" in data["parsed_items"][0]["item_name"]