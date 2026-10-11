from typing import Optional, List
from pydantic import BaseModel, Field
from .answer import Citation


class SetbackCalculationRequest(BaseModel):
    street_width_m: float = Field(..., gt=0, le=100, description="Width of street facing the plot in meters.")
    plot_area_sqm: float = Field(..., gt=0, le=100000, description="Plot area in square meters.")
    building_height_m: Optional[float] = Field(default=9.0, gt=0, le=100, description="Proposed building height in meters (default 9m).")
    is_existing_narrow_street: Optional[bool] = Field(default=False, description="True if in existing developed area with street < 6m.")


class SetbackCalculationResponse(BaseModel):
    front_open_space_m: float = Field(..., description="Minimum front open space in meters.")
    rear_open_space_m: float = Field(..., description="Minimum rear open space in meters.")
    side_open_space_m: float = Field(..., description="Minimum side open space in meters.")
    building_height_limit_m: float = Field(default=12.5, description="Height ceiling for Rule 56 application (12.5m).")
    rule: str = Field(default="56", description="Governing rule number.")
    explanation: str = Field(..., description="Legal rationale from tables in Rule 56.")
    citations: List[Citation] = Field(default_factory=list, description="Statutory citations.")
    warnings: List[str] = Field(default_factory=list, description="Applicability caveats.")
