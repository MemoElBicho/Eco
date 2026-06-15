from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from app.services.sentiment import analyze_sentiment


def _mock_gemini_response(raw_text: str):
    mock_resp = MagicMock()
    mock_resp.raise_for_status = MagicMock()
    mock_resp.json = MagicMock(return_value={
        "candidates": [{"content": {"parts": [{"text": raw_text}]}}]
    })

    cm_mock = MagicMock()
    cm_mock.__aenter__ = AsyncMock(return_value=MagicMock(
        post=AsyncMock(return_value=mock_resp)
    ))
    cm_mock.__aexit__ = AsyncMock(return_value=None)
    return cm_mock


@pytest.mark.asyncio
async def test_analyze_sentiment_positive():
    with patch("app.services.sentiment.httpx.AsyncClient", return_value=_mock_gemini_response("POSITIVO 0.9")):
        label, score = await analyze_sentiment("Me encanta el servicio!", "real-api-key")
    assert label == "positive"
    assert score == 0.9


@pytest.mark.asyncio
async def test_analyze_sentiment_negative():
    with patch("app.services.sentiment.httpx.AsyncClient", return_value=_mock_gemini_response("NEGATIVO -0.8")):
        label, score = await analyze_sentiment("Estoy muy enojado, no funciona", "real-api-key")
    assert label == "negative"
    assert score == -0.8
