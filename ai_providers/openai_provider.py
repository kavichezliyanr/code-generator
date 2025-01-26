import openai
from typing import List
import os
from .base import AIProvider, Model, CodeGenerationRequest

class OpenAIProvider(AIProvider):
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        openai.api_key = self.api_key

    def get_available_models(self) -> List[Model]:
        return [
            Model(
                id="gpt-3.5-turbo",
                name="GPT-3.5 Turbo",
                provider="openai"
            )
        ]

    async def generate_code(self, request: CodeGenerationRequest) -> str:
        language_prompt = f" in {request.language}" if request.language else ""
        full_prompt = f"Generate code{language_prompt} for the following requirement:\n{request.prompt}"

        response = openai.ChatCompletion.create(
            model=request.model_id,
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful coding assistant. Generate clean, well-documented code based on the user's requirements."
                },
                {
                    "role": "user",
                    "content": full_prompt
                }
            ],
            temperature=0.7,
            max_tokens=2000
        )

        return response.choices[0].message.content 