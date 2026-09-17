from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class CalculationRequest(BaseModel):
    species: str = Field(..., description="Species of the tree (e.g. Neem, Ashoka, Rubber)", min_length=1)
    gbh: float = Field(..., description="Girth at Breast Height in centimeters", gt=0)
    height: float = Field(..., description="Height of the tree in meters", gt=0)
    latitude: Optional[float] = Field(None, description="Optional GPS latitude of the tree location")
    longitude: Optional[float] = Field(None, description="Optional GPS longitude of the tree location")

class CalculationResponse(BaseModel):
    id: int = Field(..., description="Database ID of the logged tree")
    species_name: str = Field(..., description="Species of the tree")
    gbh: float
    height: float
    dbh: float = Field(..., description="Diameter at Breast Height in centimeters")
    age: float = Field(..., description="Estimated age of the tree in years")
    biomass: float = Field(..., description="Aboveground biomass in kilograms")
    carbon: float = Field(..., description="Stored carbon in kilograms")
    co2: float = Field(..., description="Sequestered carbon dioxide equivalent in kilograms")
    oxygen: float = Field(..., description="Released oxygen in kilograms")
    summary: str = Field(..., description="RAG generated climate impact summary")
    medicinal_impact: str = Field(..., description="RAG generated medicinal summary")
    habitat_support: str = Field(..., description="RAG generated habitat support summary")
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SpeciesResponse(BaseModel):
    id: int
    name: str
    mai: float
    wood_density: float

    class Config:
        from_attributes = True
