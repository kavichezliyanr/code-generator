from abc import ABC, abstractmethod
from typing import List, Optional
from pydantic import BaseModel

class Model(BaseModel):
    id: str
    name: str
    provider: str

class CodeGenerationRequest(BaseModel):
    prompt: str
    language: Optional[str] = None
    model_id: str

class AIProvider(ABC):
    @abstractmethod
    async def generate_code(self, request: CodeGenerationRequest) -> str:
        """Generate code using the AI model"""
        pass

    @abstractmethod
    def get_available_models(self) -> List[Model]:
        """Get list of available models for this provider"""
        pass 