from typing import List
import os
from .base import AIProvider, Model, CodeGenerationRequest
from fastapi import HTTPException
import requests
import json

class HuggingFaceProvider(AIProvider):
    def __init__(self):
        self.api_key = os.getenv("HUGGINGFACE_API_KEY")
        if not self.api_key:
            raise ValueError("HUGGINGFACE_API_KEY environment variable is not set")
        self.api_url = "https://api-inference.huggingface.co/models"

    def get_available_models(self) -> List[Model]:
        return [
            Model(
                id="bigcode/starcoder",
                name="StarCoder",
                provider="huggingface"
            ),
            Model(
                id="codellama/CodeLlama-34b-Instruct-hf",
                name="Code Llama 34B",
                provider="huggingface"
            ),
            Model(
                id="bigcode/starcoderplus",
                name="StarCoder Plus",
                provider="huggingface"
            )
        ]

    async def generate_code(self, request: CodeGenerationRequest) -> str:
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }

            language_prompt = f" in {request.language}" if request.language else ""
            full_prompt = f"Generate code{language_prompt} for the following requirement:\n{request.prompt}\nProvide ONLY the code without any explanations or markdown formatting."

            # Format prompt based on model
            if "codellama" in request.model_id.lower():
                prompt = f"<s>[INST] {full_prompt} [/INST]"
            else:
                prompt = full_prompt

            payload = {
                "inputs": prompt,
                "parameters": {
                    "max_new_tokens": 2000,
                    "temperature": 0.7,
                    "top_p": 0.95,
                    "return_full_text": False
                }
            }

            response = requests.post(
                f"{self.api_url}/{request.model_id}",
                headers=headers,
                json=payload
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"HuggingFace API error: {response.text}"
                )

            result = response.json()
            if isinstance(result, list) and len(result) > 0:
                generated_text = result[0].get("generated_text", "")
                # Clean up the response
                generated_text = generated_text.strip()
                if generated_text.startswith("```"):
                    # Remove code block markers if present
                    lines = generated_text.split("\n")
                    if len(lines) > 2:
                        generated_text = "\n".join(lines[1:-1])
                return generated_text
            
            raise HTTPException(
                status_code=500,
                detail="Unexpected response format from HuggingFace API"
            )

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"HuggingFace API error: {str(e)}") 