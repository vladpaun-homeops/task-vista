from fastapi import FastAPI
from typing import List, Literal
from pydantic import BaseModel

app = FastAPI()

class CategorizeRequest(BaseModel):
    text: str

class CategorizeResponse(BaseModel):
    tags: List[str]
    priority: Literal["LOW", "MEDIUM", "HIGH", "URGENT"]

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/categorize", response_model=CategorizeResponse)
def categorize(body: CategorizeRequest):
    # ---- placeholder logic ----
    txt = body.text.lower()
    tags = []
    if any(k in txt for k in ["pay", "invoice", "rent"]):
        tags.append("finance")
    if any(k in txt for k in ["study", "exam", "course", "uni"]):
        tags.append("uni")
    if any(k in txt for k in ["buy", "grocer", "shop"]):
        tags.append("errand")
    priority = "MEDIUM"
    if "urgent" in txt or "asap" in txt:
        priority = "URGENT"
    return {"tags": tags or ["misc"], "priority": priority}