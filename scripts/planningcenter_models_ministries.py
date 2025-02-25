from typing import Annotated, Literal, Optional, Union

from pydantic import AliasPath, BaseModel, ConfigDict, Field


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


Block = Annotated[ButtonBlock | DividerBlock | GridBlock | ImageBlock | SectionHeaderBlock | TextBlock, Field(discriminator="type")]


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
