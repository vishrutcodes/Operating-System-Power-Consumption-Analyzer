from google import genai
import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path('.') / '.env'
load_dotenv(dotenv_path=env_path)
api_key = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=api_key)

try:
    print("Listing models...")
    models = list(client.models.list())
    with open("models.txt", "w", encoding="utf-8") as f:
        for m in models:
            # Check for generateContent support 
            # In new SDK, we check if it's a model resource and maybe filter by name or capability if field exists
            # For now, just list all
            f.write(f"{m.name}\n")
    print(f"Models listed to models.txt (found {len(models)})")
except Exception as e:
    with open("models.txt", "w", encoding="utf-8") as f:
        f.write(f"Error: {e}")
    print(f"Error listing models: {e}")
