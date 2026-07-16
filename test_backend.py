import os
import requests
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

def test_ollama():
    print("Testing connection to Ollama cloud API...")
    url = os.environ.get("OLLAMA_URL", "https://ollama.com/api/chat")
    api_key = os.environ.get("OLLAMA_API_KEY")
    if not api_key:
        print("Ollama connection test: SKIPPED - OLLAMA_API_KEY not set in .env or environment")
        return False
    payload = {
        "model": os.environ.get("OLLAMA_MODEL", "minimax-m3:cloud"),
        "messages": [
            {"role": "user", "content": "Respond with the word 'OK' if you can hear me."}
        ],
        "stream": False
    }

    try:
        response = requests.post(url, json=payload, timeout=30, headers={"Authorization": f"Bearer {api_key}"})
        print(f"Ollama response code: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            content = result.get("message", {}).get("content", "").strip()
            print(f"Ollama response message: '{content}'")
            if "OK" in content.upper() or content:
                print("Ollama connection test: SUCCESS")
                return True
        else:
            print(f"Ollama connection test: FAILED - Response body: {response.text}")
    except Exception as e:
        print(f"Ollama connection test: ERROR - Could not connect: {str(e)}")
    return False

def test_file_parsing():
    print("\nTesting file parsing utility...")
    from parser_utils import extract_text_from_file

    # Create a temporary file
    temp_filename = "test_temp_doc.txt"
    with open(temp_filename, "w", encoding="utf-8") as f:
        f.write("Hello. This is a test file for the parsing utility.\nLine 2 contains some sample data.")

    try:
        extracted = extract_text_from_file(temp_filename)
        print("Extracted content:")
        print(f"--- START ---\n{extracted}\n--- END ---")
        if "sample data" in extracted:
            print("File parsing test: SUCCESS")
            return True
        else:
            print("File parsing test: FAILED - content mismatch")
    except Exception as e:
        print(f"File parsing test: ERROR - {str(e)}")
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
    return False

if __name__ == "__main__":
    ollama_ok = test_ollama()
    parser_ok = test_file_parsing()
    if ollama_ok and parser_ok:
        print("\nAll automated tests PASSED.")
    else:
        print("\nSome tests FAILED. Please check configuration.")
