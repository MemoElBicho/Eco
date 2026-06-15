import httpx

GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_GEN_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"


async def analyze_sentiment(text: str, api_key: str) -> tuple[str, float]:
    if not api_key or api_key.startswith("sk-your_"):
        return "neutral", 0.0

    prompt = (
        "Clasifica el sentimiento del siguiente mensaje como positivo, neutro o negativo. "
        "Responde solo: POSITIVO/NEUTRAL/NEGATIVO y un score de -1.0 a 1.0.\n"
        f"Texto: {text}"
    )

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                GEMINI_GEN_URL,
                params={"key": api_key},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.0, "maxOutputTokens": 50},
                },
                timeout=15,
            )
            resp.raise_for_status()
            raw = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception:
        return "neutral", 0.0

    label = "neutral"
    score = 0.0
    for token in raw.upper().split():
        if token in ("POSITIVO", "POSITIVE"):
            label = "positive"
        elif token in ("NEUTRAL", "NEUTRO"):
            label = "neutral"
        elif token in ("NEGATIVO", "NEGATIVE"):
            label = "negative"
    for token in raw.split():
        try:
            parsed = float(token)
            if -1.0 <= parsed <= 1.0:
                score = parsed
                break
        except ValueError:
            continue

    return label, score
