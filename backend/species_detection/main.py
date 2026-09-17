import io
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="TreeVisionAI Species Detection")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the model
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

# Define the number of classes based on owndataset config
NUM_CLASSES = 7
CLASS_NAMES = ["ashoka", "banyan", "mango", "neem", "peepal", "raintree", "rubber"]

# Species display metadata (maps model class -> display info)
SPECIES_META = {
    "ashoka": {"display": "Ashoka", "scientific": "Saraca asoca", "family": "Fabaceae"},
    "banyan": {"display": "Banyan", "scientific": "Ficus benghalensis", "family": "Moraceae"},
    "mango": {"display": "Mango", "scientific": "Mangifera indica", "family": "Anacardiaceae"},
    "neem": {"display": "Neem", "scientific": "Azadirachta indica", "family": "Meliaceae"},
    "peepal": {"display": "Peepal", "scientific": "Ficus religiosa", "family": "Moraceae"},
    "raintree": {"display": "Rain Tree", "scientific": "Samanea saman", "family": "Fabaceae"},
    "rubber": {"display": "Rubber", "scientific": "Ficus elastica", "family": "Moraceae"},
}

# Build the EfficientNet-B0 model
model = models.efficientnet_b0(weights=None)
in_features = model.classifier[1].in_features
model.classifier = nn.Sequential(
    nn.Dropout(p=0.2, inplace=True),
    nn.Linear(in_features, NUM_CLASSES),
)
model = model.to(device)

# Resolve model path relative to this file
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.environ.get("MODEL_PATH") or os.path.join(SCRIPT_DIR, "..", "models", "best_model.pth")
model_path = os.path.normpath(model_path)

model_loaded = False
try:
    if os.path.exists(model_path):
        checkpoint = torch.load(model_path, map_location=device, weights_only=False)
        if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
            model.load_state_dict(checkpoint["model_state_dict"])
            if "class_names" in checkpoint:
                CLASS_NAMES = checkpoint["class_names"]
        else:
            model.load_state_dict(checkpoint)
        model.eval()
        model_loaded = True
        print(f"Model loaded successfully from {model_path}")
        print(f"Classes: {CLASS_NAMES}")
    else:
        print(f"WARNING: Model file not found at {model_path}")
        print("Please ensure best_model.pth is in backend/models/")
except Exception as e:
    print(f"Error loading model: {e}")

# Preprocessing transforms (ImageNet standard)
transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])


@app.get("/")
def read_root():
    return {
        "message": "TreeVisionAI Species Detection API",
        "status": "online",
        "model_loaded": model_loaded,
        "classes": CLASS_NAMES,
    }


@app.get("/health")
def health_check():
    return {"status": "ok", "model_loaded": model_loaded}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not model_loaded:
        return {"error": "Model not loaded. Check server logs."}

    try:
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data)).convert("RGB")

        # Preprocess
        tensor = transform(image).unsqueeze(0).to(device)

        # Predict
        with torch.no_grad():
            outputs = model(tensor)
            probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
            confidence, predicted_idx = torch.max(probabilities, 0)

            predicted_class = CLASS_NAMES[predicted_idx.item()]
            confidence_value = confidence.item()

            # Build all predictions sorted by confidence
            all_predictions = []
            for i, class_name in enumerate(CLASS_NAMES):
                meta = SPECIES_META.get(class_name, {"display": class_name, "scientific": "", "family": ""})
                all_predictions.append({
                    "class": class_name,
                    "display_name": meta["display"],
                    "scientific_name": meta["scientific"],
                    "family": meta["family"],
                    "confidence": round(probabilities[i].item() * 100, 2),
                })
            all_predictions.sort(key=lambda x: x["confidence"], reverse=True)

        top_meta = SPECIES_META.get(predicted_class, {"display": predicted_class, "scientific": "", "family": ""})

        return {
            "prediction": predicted_class,
            "display_name": top_meta["display"],
            "scientific_name": top_meta["scientific"],
            "family": top_meta["family"],
            "confidence": round(confidence_value * 100, 2),
            "all_predictions": all_predictions,
        }
    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 5000))
    uvicorn.run(app, host="0.0.0.0", port=port)
