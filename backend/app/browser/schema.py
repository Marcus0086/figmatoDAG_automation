from pydantic import BaseModel
from typing import Optional


class Attributes(BaseModel):
    productFamiliarity: float
    patience: float
    techSavviness: float


class BrowserRequest(BaseModel):
    query: str
    max_steps: Optional[int] = 150
    title: Optional[str] = None
    attributes: Optional[Attributes] = None


class SetUrlRequest(BaseModel):
    url: str
