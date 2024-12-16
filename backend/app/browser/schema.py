from pydantic import BaseModel, HttpUrl
from typing import Optional


class Attributes(BaseModel):
    productFamiliarity: str
    patience: float
    techSavviness: str
    domainFamiliarity: str
    industryExpertise: str


class GroundTruth(BaseModel):
    description: Optional[str] = None
    img: Optional[HttpUrl] = None


class BrowserRequest(BaseModel):
    query: str
    ground_truth: GroundTruth
    max_steps: Optional[int] = 150
    title: Optional[str] = None
    attributes: Optional[Attributes] = None


class SetUrlRequest(BaseModel):
    url: str
