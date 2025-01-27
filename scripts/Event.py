from datetime import datetime
from enum import StrEnum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class EventApprovalStatus(StrEnum):
    APPROVED = "A"
    PENDING = "P"
    REJECTED = "R"


class EventAttributes(BaseModel):
    model_config = ConfigDict(extra="ignore")

    approval_status: EventApprovalStatus
    created_at: datetime
    description: Optional[str]
    featured: bool
    image_url: Optional[str]
    name: str
    percent_approved: int
    percent_rejected: int
    registration_url: Optional[str]
    summary: Optional[str]
    updated_at: datetime
    visible_in_church_center: bool


class EventTimeAttributes(BaseModel):
    model_config = ConfigDict(extra="ignore")

    ends_at: datetime
    name: str
    starts_at: datetime
    visible_on_kiosks: bool
    visible_on_widget_and_ical: bool


class EventTime(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    attributes: EventTimeAttributes


class TagAttributes(BaseModel):
    model_config = ConfigDict(extra="ignore")

    church_center_category: bool
    color: str
    created_at: datetime
    name: str
    position: int
    updated_at: datetime


class Tag(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    attributes: TagAttributes


class Event(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    attributes: EventAttributes
    tags: list[Tag] = Field(default_factory=list)


class EventInstanceAttributes(BaseModel):
    model_config = ConfigDict(extra="ignore")

    all_day_event: bool
    church_center_url: str
    compact_recurrence_description: str
    created_at: datetime
    ends_at: datetime
    location: Optional[str]
    published_ends_at: Optional[datetime]
    published_starts_at: Optional[datetime]
    recurrence: str
    recurrence_description: str
    starts_at: datetime
    updated_at: datetime


class EventInstance(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    attributes: EventInstanceAttributes
    event: Optional[Event]
    event_times: list[EventTime] = Field(default_factory=list)
