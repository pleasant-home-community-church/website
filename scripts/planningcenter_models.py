from datetime import datetime
from enum import StrEnum
from typing import Optional

from pydantic import AliasPath, BaseModel, ConfigDict, Field


class EventApprovalStatus(StrEnum):
    APPROVED = "A"
    PENDING = "P"
    REJECTED = "R"


class Tag(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str

    color: str = Field(validation_alias=AliasPath("attributes", "color"))
    name: str = Field(validation_alias=AliasPath("attributes", "name"))
    group: str = Field(validation_alias=AliasPath("tag_group", "attributes", "name"))


class Event(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str

    approval_status: EventApprovalStatus = Field(validation_alias=AliasPath("attributes", "approval_status"))
    created_at: datetime = Field(validation_alias=AliasPath("attributes", "created_at"))
    description: Optional[str] = Field(validation_alias=AliasPath("attributes", "description"))
    featured: bool = Field(validation_alias=AliasPath("attributes", "featured"))
    image_url: Optional[str] = Field(validation_alias=AliasPath("attributes", "image_url"))
    name: str = Field(validation_alias=AliasPath("attributes", "name"))
    percent_approved: int = Field(validation_alias=AliasPath("attributes", "percent_approved"))
    percent_rejected: int = Field(validation_alias=AliasPath("attributes", "percent_rejected"))
    registration_url: Optional[str] = Field(validation_alias=AliasPath("attributes", "registration_url"))
    summary: Optional[str] = Field(validation_alias=AliasPath("attributes", "summary"))
    updated_at: datetime = Field(validation_alias=AliasPath("attributes", "updated_at"))
    visible_in_church_center: bool = Field(validation_alias=AliasPath("attributes", "visible_in_church_center"))

    tags: list[Tag] = Field(default_factory=list)


class CalendarInstance(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str

    all_day_event: bool = Field(validation_alias=AliasPath("attributes", "all_day_event"))
    ends_at: datetime = Field(validation_alias=AliasPath("attributes", "ends_at"))
    event_featured: bool = Field(validation_alias=AliasPath("attributes", "event_featured"))
    event_name: str = Field(validation_alias=AliasPath("attributes", "event_name"))
    starts_at: datetime = Field(validation_alias=AliasPath("attributes", "starts_at"))
    status: str = Field(validation_alias=AliasPath("attributes", "status"))
    visible_ends_at: datetime = Field(validation_alias=AliasPath("attributes", "visible_ends_at"))
    visible_starts_at: datetime = Field(validation_alias=AliasPath("attributes", "visible_starts_at"))

    event: Optional[Event]
    tags: Optional[list[Tag]] = Field(default_factory=list)
