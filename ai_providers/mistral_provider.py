from mistralai.client import MistralClient
from mistralai.models.chat_completion import ChatMessage
from typing import List, Dict
import os
from .base import AIProvider, Model, CodeGenerationRequest
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

class MistralProvider(AIProvider):
    def __init__(self):
        self.api_key = os.getenv("MISTRAL_API_KEY")
        if not self.api_key:
            raise ValueError("MISTRAL_API_KEY environment variable is not set")
        logger.info("Initializing Mistral client")
        self.client = MistralClient(api_key=self.api_key)
        logger.info("Mistral client initialized successfully")

    def get_available_models(self) -> List[Model]:
        models = [
            Model(id="mistral-tiny", name="Mistral Tiny", provider="mistral"),
            Model(id="mistral-small", name="Mistral Small", provider="mistral"),
            Model(id="mistral-medium", name="Mistral Medium", provider="mistral")
        ]
        logger.info(f"Available Mistral models: {[model.dict() for model in models]}")
        return models

    async def generate_code(self, request: CodeGenerationRequest) -> str:
        try:
            logger.info(f"Generating code with Mistral model: {request.model_id}")
            
            language_prompt = f" in {request.language}" if request.language else ""
            full_prompt = f"Generate code{language_prompt} for the following requirement:\n{request.prompt}\nProvide ONLY the code without any explanations or markdown formatting."
            
            logger.info(f"Sending request to Mistral API with prompt: {full_prompt}")
            
            messages = [
                ChatMessage(
                    role="system",
                    content="You are a helpful coding assistant. Generate clean, well-documented code based on the user's requirements."
                ),
                ChatMessage(
                    role="user",
                    content=full_prompt
                )
            ]
            
            logger.info("Making API call to Mistral")
            response = self.client.chat(
                model=request.model_id,
                messages=messages,
                temperature=0.7,
                max_tokens=2000
            )
            logger.info("Received response from Mistral API")
            logger.debug(f"Raw response: {response}")
            
            generated_code = response.choices[0].message.content
            logger.info("Successfully extracted generated code from response")
            
            return generated_code.strip()
            
        except Exception as e:
            logger.error(f"Error in Mistral code generation: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Mistral API error: {str(e)}") 