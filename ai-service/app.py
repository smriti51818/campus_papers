from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Union
from dotenv import load_dotenv
from ai_utils.extract_text import extract_pdf_text_from_url
from ai_utils.check_authenticity import compute_authenticity

load_dotenv()

class Metadata(BaseModel):
    department: str
    subject: str
    year: int
    semester: Union[int, str]
    university: Optional[str] = None

class CheckPayload(BaseModel):
    metadata: Metadata
    file_url: Optional[str] = None
    # Note: existing_texts is currently not used by backend but kept for future enhancement
    existing_texts: Optional[List[str]] = Field(default_factory=list)

app = FastAPI()

# CORS middleware - simplified since default is already permissive
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"ok": True}

@app.post("/check")
async def check_auth(payload: CheckPayload):
    text = ""
    err_note = ""
    if payload.file_url:
        try:
            text = extract_pdf_text_from_url(payload.file_url)
        except Exception as e:
            err_note = f" PDF fetch/extract failed: {e!s}."
            text = ""
    result = compute_authenticity(text, payload.existing_texts or [])
    result["extractedText"] = text
    if err_note:
        result["aiFeedback"] = (result.get("aiFeedback") or "") + err_note
    return result
