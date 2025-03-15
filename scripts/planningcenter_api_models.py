from datetime import datetime
from enum import StrEnum
from typing import Annotated, Literal, Optional

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
    created_at: Optional[datetime] = Field(validation_alias=AliasPath("attributes", "created_at"))
    description: Optional[str] = Field(validation_alias=AliasPath("attributes", "description"))
    featured: bool = Field(validation_alias=AliasPath("attributes", "featured"))
    image_url: Optional[str] = Field(validation_alias=AliasPath("attributes", "image_url"))
    name: str = Field(validation_alias=AliasPath("attributes", "name"))
    percent_approved: Optional[int] = Field(validation_alias=AliasPath("attributes", "percent_approved"))
    percent_rejected: Optional[int] = Field(validation_alias=AliasPath("attributes", "percent_rejected"))
    registration_url: Optional[str] = Field(validation_alias=AliasPath("attributes", "registration_url"))
    summary: Optional[str] = Field(validation_alias=AliasPath("attributes", "summary"))
    updated_at: Optional[datetime] = Field(validation_alias=AliasPath("attributes", "updated_at"))
    visible_in_church_center: bool = Field(validation_alias=AliasPath("attributes", "visible_in_church_center"))

    tags: list[Tag] = Field(default_factory=list)


class EventConnection(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str

    connected_to_id: int = Field(validation_alias=AliasPath("attributes", "connected_to_id"))
    connected_to_name: str = Field(validation_alias=AliasPath("attributes", "connected_to_name"))
    connected_to_type: str = Field(validation_alias=AliasPath("attributes", "connected_to_type"))
    connected_to_url: str = Field(validation_alias=AliasPath("attributes", "connected_to_url"))
    product_name: str = Field(validation_alias=AliasPath("attributes", "product_name"))


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
    event_tags: dict[str, str] = Field(default_factory=dict)
    group_tags: dict[str, str] = Field(default_factory=dict)
    ministry: Optional[str] = "default"
    color: Optional[str] = "#6ADCC8"


class GroupTag(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str

    value: str = Field(validation_alias=AliasPath("attributes", "name"))
    tag_group_id: str = Field(validation_alias=AliasPath("relationships", "tag_group", "data", "id"))


class GroupTagGroup(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str

    name: str = Field(validation_alias=AliasPath("attributes", "name"))
    display_publicly: bool = Field(validation_alias=AliasPath("attributes", "display_publicly"))
    model_options_enabled: bool = Field(validation_alias=AliasPath("attributes", "multiple_options_enabled"))


class ButtonBlock(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    type: Literal["Button"]

    text: str = Field(validation_alias=AliasPath("attributes", "text"))
    link_target: Optional[str] = Field(validation_alias=AliasPath("attributes", "link_target"))
    link_url: str = Field(validation_alias=AliasPath("attributes", "link_url"))
    size: str = Field(validation_alias=AliasPath("attributes", "size"))
    style: str = Field(validation_alias=AliasPath("attributes", "style"))
    position: str = Field(validation_alias=AliasPath("attributes", "position"))


class DividerBlock(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    type: Literal["Divider"]


class GridItem(BaseModel):
    model_config = ConfigDict(extra="ignore")

    body: str
    button_text: str
    title: str
    position: Optional[str]
    link_target: str
    link_url: str
    alt: str
    src: str
    srcset: str
    sizes: str


class GridAttributes(BaseModel):
    model_config = ConfigDict(extra="ignore")

    items: list[GridItem]
    image_enabled: bool
    image_constraint_enabled: bool
    image_scale_up_enabled: bool
    title_enabled: bool
    body_enabled: bool
    button_enabled: bool
    columns_desktop: int
    columns_mobile: int
    items_position: str
    button_size: str
    button_style: str
    button_position: str


class GridBlock(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    type: Literal["Grid"]
    attr: GridAttributes = Field(alias="attributes")


class ImageBlock(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    type: Literal["Image"]

    link_target: str = Field(validation_alias=AliasPath("attributes", "link_target"))
    link_url: str = Field(validation_alias=AliasPath("attributes", "link_url"))
    link_url_enabled: bool = Field(validation_alias=AliasPath("attributes", "link_url_enabled"))
    alt: str = Field(validation_alias=AliasPath("attributes", "alt"))
    src: str = Field(validation_alias=AliasPath("attributes", "src"))
    srcset: str = Field(validation_alias=AliasPath("attributes", "srcset"))
    sizes: str = Field(validation_alias=AliasPath("attributes", "sizes"))


class SectionHeaderBlock(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    type: Literal["SectionHeader"]

    background_image_enabled: bool = Field(validation_alias=AliasPath("attributes", "background_image_enabled"))
    callout_button_enabled: bool = Field(validation_alias=AliasPath("attributes", "callout_button_enabled"))
    callout_button_text: str = Field(validation_alias=AliasPath("attributes", "callout_button_text"))
    callout_link_url: str = Field(validation_alias=AliasPath("attributes", "callout_link_url"))
    callout_position: str = Field(validation_alias=AliasPath("attributes", "callout_position"))
    callout_text: str = Field(validation_alias=AliasPath("attributes", "callout_text"))
    callout_text_alignment: str = Field(validation_alias=AliasPath("attributes", "callout_text_alignment"))
    callout_text_color: str = Field(validation_alias=AliasPath("attributes", "callout_text_color"))
    callout_text_enabled: bool = Field(validation_alias=AliasPath("attributes", "callout_text_enabled"))
    height: str = Field(validation_alias=AliasPath("attributes", "height"))
    mobile_full_bleed_enabled: Optional[bool] = Field(validation_alias=AliasPath("attributes", "mobile_full_bleed_enabled"))
    background_image_url: str = Field(validation_alias=AliasPath("attributes", "background_image_url"))


class TextBlock(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    type: Literal["Text"]

    content: str = Field(validation_alias=AliasPath("attributes", "content"))
    text_align: str = Field(validation_alias=AliasPath("attributes", "text_align"))


class VideoBlock(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    type: Literal["Video"]

    url: str = Field(validation_alias=AliasPath("attributes", "url"))


Block = Annotated[ButtonBlock | DividerBlock | GridBlock | ImageBlock | SectionHeaderBlock | TextBlock | VideoBlock, Field(discriminator="type")]


class PageAttributes(BaseModel):
    model_config = ConfigDict(extra="ignore")

    blocks: list[Block]
    content: str
    slug: str
    title: str


class PageInstance(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    type: Literal["Page"]
    attr: PageAttributes = Field(alias="attributes")
