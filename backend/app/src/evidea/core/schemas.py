from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class ApiModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


class InputModel(ApiModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class PageMeta(ApiModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int

    @classmethod
    def build(cls, *, page: int, page_size: int, total_items: int) -> "PageMeta":
        return cls(
            page=page,
            page_size=page_size,
            total_items=total_items,
            total_pages=(total_items + page_size - 1) // page_size,
        )


class Page[T](ApiModel):
    items: list[T]
    meta: PageMeta
