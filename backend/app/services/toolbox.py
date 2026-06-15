from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

from sqlalchemy.ext.asyncio import AsyncSession

if TYPE_CHECKING:
    from app.models.operator_instance import OperatorInstance


class BaseTool(ABC):
    tool_type: str
    description: str

    @abstractmethod
    def get_function_definition(self) -> dict:
        ...

    @abstractmethod
    async def execute(
        self,
        params: dict,
        instance: "OperatorInstance",
        db: AsyncSession,
    ) -> str:
        ...


class ToolRegistry:
    _tools: dict[str, type[BaseTool]] = {}

    @classmethod
    def register(cls, tool_type: str, tool_cls: type[BaseTool]) -> None:
        cls._tools[tool_type] = tool_cls

    @classmethod
    def get(cls, tool_type: str) -> type[BaseTool] | None:
        return cls._tools.get(tool_type)

    @classmethod
    def all(cls) -> dict[str, type[BaseTool]]:
        return dict(cls._tools)
