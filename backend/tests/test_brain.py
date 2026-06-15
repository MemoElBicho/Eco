from io import BytesIO
from httpx import AsyncClient


async def test_get_documents(async_client: AsyncClient, auth_headers: dict):
    resp = await async_client.get("/api/v1/brain/documents", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


async def test_upload_document_mock(async_client: AsyncClient, auth_headers: dict):
    content = b"A" * 3000
    files = {"file": ("test.txt", BytesIO(content), "text/plain")}
    resp = await async_client.post("/api/v1/brain/upload", files=files, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["filename"] == "test.txt"
    assert data["chunks"] == 3
