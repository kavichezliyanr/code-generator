from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import json
from dotenv import load_dotenv
from ai_providers import OpenAIProvider, MistralProvider, HuggingFaceProvider, CodeGenerationRequest, Model
import logging
import os
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize workspace directory
WORKSPACE_DIR = Path("workspace")
WORKSPACE_DIR.mkdir(exist_ok=True)

# Initialize AI providers
providers = {}
try:
    providers["openai"] = OpenAIProvider()
    logger.info("OpenAI provider initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize OpenAI provider: {str(e)}", exc_info=True)

try:
    providers["mistral"] = MistralProvider()
    logger.info("Mistral provider initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Mistral provider: {str(e)}", exc_info=True)

try:
    providers["huggingface"] = HuggingFaceProvider()
    logger.info("HuggingFace provider initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize HuggingFace provider: {str(e)}", exc_info=True)

if not providers:
    logger.error("No AI providers were initialized successfully!")

app = FastAPI(title="Best AI Code Generator")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CodeRequest(BaseModel):
    prompt: str
    model_id: str
    language: Optional[str] = None
    file_path: Optional[str] = None

class FileContent(BaseModel):
    content: str

class FileNode(BaseModel):
    name: str
    type: str
    path: str
    children: Optional[List['FileNode']] = None

FileNode.update_forward_refs()

def get_file_tree(directory: Path, base_path: Path = WORKSPACE_DIR) -> List[FileNode]:
    result = []
    for path in directory.iterdir():
        relative_path = str(path.relative_to(base_path))
        if path.is_dir():
            result.append(FileNode(
                name=path.name,
                type="directory",
                path=relative_path,
                children=get_file_tree(path, base_path)
            ))
        else:
            result.append(FileNode(
                name=path.name,
                type="file",
                path=relative_path
            ))
    return sorted(result, key=lambda x: (x.type == "file", x.name))

@app.get("/")
async def read_root():
    return {"message": "Welcome to Best AI Code Generator API"}

@app.get("/models")
async def get_models():
    try:
        all_models = []
        for provider_name, provider in providers.items():
            try:
                provider_models = provider.get_available_models()
                logger.info(f"Retrieved models from {provider_name}: {[model.dict() for model in provider_models]}")
                all_models.extend(provider_models)
            except Exception as e:
                logger.error(f"Error getting models from {provider_name}: {str(e)}", exc_info=True)
        logger.info(f"Total models available: {len(all_models)}")
        return {"models": all_models}
    except Exception as e:
        logger.error(f"Error in get_models endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-code")
async def generate_code(request: CodeRequest):
    try:
        logger.info(f"Received code generation request: {request.dict()}")
        
        # Determine the provider based on the model ID
        provider_id = None
        for pid, provider in providers.items():
            provider_models = provider.get_available_models()
            logger.info(f"Checking {pid} provider models: {[model.dict() for model in provider_models]}")
            if any(model.id == request.model_id for model in provider_models):
                provider_id = pid
                logger.info(f"Found matching provider: {pid}")
                break
        
        if not provider_id or provider_id not in providers:
            logger.error(f"No provider found for model ID: {request.model_id}")
            raise HTTPException(status_code=400, detail="Unsupported model provider")
        
        # Generate code using the selected provider
        code_request = CodeGenerationRequest(
            prompt=request.prompt,
            language=request.language,
            model_id=request.model_id
        )
        
        logger.info(f"Sending request to {provider_id} provider")
        generated_code = await providers[provider_id].generate_code(code_request)
        logger.info(f"Successfully generated code using {request.model_id}")
        
        return {
            "code": generated_code,
        }
    except Exception as e:
        logger.error(f"Error generating code: {str(e)}", exc_info=True)
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            request_data = json.loads(data)
            response = await generate_code(CodeRequest(**request_data))
            await websocket.send_json(response)
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        await websocket.send_json({"error": str(e)})
    finally:
        await websocket.close()

@app.get("/files")
async def list_files():
    try:
        files = get_file_tree(WORKSPACE_DIR)
        return {"files": files}
    except Exception as e:
        logger.error(f"Error listing files: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/files/{file_path:path}")
async def read_file(file_path: str):
    try:
        file_path = WORKSPACE_DIR / file_path
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        content = file_path.read_text()
        return {"content": content}
    except Exception as e:
        logger.error(f"Error reading file: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/files")
async def create_file(file_path: str, content: FileContent):
    try:
        file_path = WORKSPACE_DIR / file_path
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_text(content.content)
        return {"message": "File created successfully"}
    except Exception as e:
        logger.error(f"Error creating file: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/files/{file_path:path}")
async def update_file(file_path: str, content: FileContent):
    try:
        file_path = WORKSPACE_DIR / file_path
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        file_path.write_text(content.content)
        return {"message": "File updated successfully"}
    except Exception as e:
        logger.error(f"Error updating file: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/files/{file_path:path}")
async def delete_file(file_path: str):
    try:
        file_path = WORKSPACE_DIR / file_path
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        file_path.unlink()
        return {"message": "File deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting file: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 