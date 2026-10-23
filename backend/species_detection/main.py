import io
import math
import os
import json
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="TreeVisionAI Species & Bark Age Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# ─────────────────────────────────────────────────────────────
# 1. SPECIES DETECTION MODEL (EfficientNet-B0)
# ─────────────────────────────────────────────────────────────
NUM_SPECIES_CLASSES = 7
SPECIES_CLASSES = ["ashoka", "banyan", "mango", "neem", "peepal", "raintree", "rubber"]

SPECIES_META = {
    "ashoka": {"display": "Ashoka", "scientific": "Saraca asoca", "family": "Fabaceae", "mai": 1.20},
    "banyan": {"display": "Banyan", "scientific": "Ficus benghalensis", "family": "Moraceae", "mai": 1.30},
    "mango": {"display": "Mango", "scientific": "Mangifera indica", "family": "Anacardiaceae", "mai": 1.10},
    "neem": {"display": "Neem", "scientific": "Azadirachta indica", "family": "Meliaceae", "mai": 1.15},
    "peepal": {"display": "Peepal", "scientific": "Ficus religiosa", "family": "Moraceae", "mai": 1.40},
    "raintree": {"display": "Rain Tree", "scientific": "Samanea saman", "family": "Fabaceae", "mai": 1.50},
    "rubber": {"display": "Rubber", "scientific": "Ficus elastica", "family": "Moraceae", "mai": 1.35},
}

species_model = models.efficientnet_b0(weights=None)
in_features_species = species_model.classifier[1].in_features
species_model.classifier = nn.Sequential(
    nn.Dropout(p=0.2, inplace=True),
    nn.Linear(in_features_species, NUM_SPECIES_CLASSES),
)
species_model = species_model.to(device)

species_model_path = os.environ.get("MODEL_PATH") or os.path.join(SCRIPT_DIR, "..", "models", "best_model.pth")
species_model_path = os.path.normpath(species_model_path)

species_model_loaded = False
try:
    if os.path.exists(species_model_path):
        checkpoint = torch.load(species_model_path, map_location=device, weights_only=False)
        if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
            species_model.load_state_dict(checkpoint["model_state_dict"])
            if "class_names" in checkpoint:
                SPECIES_CLASSES = checkpoint["class_names"]
        else:
            species_model.load_state_dict(checkpoint)
        species_model.eval()
        species_model_loaded = True
        print(f"Species model loaded successfully from {species_model_path}")
    else:
        print(f"WARNING: Species model file not found at {species_model_path}")
except Exception as e:
    print(f"Error loading species model: {e}")

# ─────────────────────────────────────────────────────────────
# 2. BARK AGE PREDICTION MODEL (EfficientNet-B4)
# ─────────────────────────────────────────────────────────────
AGE_CLASSES = ["mature", "old", "sapling", "young"]
AGE_STAGE_META = {
    "sapling": {
        "label": "Sapling",
        "age_range": "0 – 5 years",
        "description": "Smooth, thin, greenish or light-coloured juvenile bark with minimal fissuring.",
        "center_age": 2.5,
        "min_age": 0.5,
        "max_age": 5.0,
    },
    "young": {
        "label": "Young",
        "age_range": "5 – 15 years",
        "description": "Slightly textured bark with early shallow fissures and developing lenticels.",
        "center_age": 10.0,
        "min_age": 5.0,
        "max_age": 15.0,
    },
    "mature": {
        "label": "Mature",
        "age_range": "15 – 40 years",
        "description": "Deeply furrowed, rugged bark with well-defined structural ridges and plates.",
        "center_age": 27.5,
        "min_age": 15.0,
        "max_age": 40.0,
    },
    "old": {
        "label": "Old (Veteran)",
        "age_range": "40+ years",
        "description": "Extremely rough, dark, gnarled and heavily cracked bark characteristic of veteran trees.",
        "center_age": 55.0,
        "min_age": 40.0,
        "max_age": 90.0,
    },
}

# Lookup for species Mean Annual Increment (growth rate in cm/year)
SPECIES_GROWTH_RATES = {
    "ashoka": 1.20,
    "banyan": 1.30,
    "mango": 1.10,
    "neem": 1.15,
    "peepal": 1.40,
    "raintree": 1.50,
    "rain tree": 1.50,
    "rubber": 1.35,
    "bamboo": 2.50,
    "coconut": 1.10,
    "badam": 1.10,
    "silver oak": 1.40,
    "bel": 0.90,
    "christmas": 1.00,
    "tej patta": 0.80,
    "supari": 1.00,
    "ad": 1.00,
}

age_model = models.efficientnet_b4(weights=None)
in_features_age = age_model.classifier[1].in_features
age_model.classifier = nn.Sequential(
    nn.Dropout(p=0.4, inplace=True),
    nn.Linear(in_features_age, 512),
    nn.BatchNorm1d(512),
    nn.SiLU(),
    nn.Dropout(p=0.3, inplace=True),
    nn.Linear(512, 4),
)
age_model = age_model.to(device)

age_model_path = os.environ.get("AGE_MODEL_PATH") or os.path.join(SCRIPT_DIR, "..", "export", "tree_age_efficientnet_b4.pth")
age_model_path = os.path.normpath(age_model_path)
age_info_path = os.path.join(SCRIPT_DIR, "..", "export", "model_info.json")

age_model_loaded = False
try:
    if os.path.exists(age_model_path):
        age_checkpoint = torch.load(age_model_path, map_location=device, weights_only=False)
        if isinstance(age_checkpoint, dict) and "model_state_dict" in age_checkpoint:
            age_model.load_state_dict(age_checkpoint["model_state_dict"])
            if "class_names" in age_checkpoint:
                AGE_CLASSES = age_checkpoint["class_names"]
        else:
            age_model.load_state_dict(age_checkpoint)
        age_model.eval()
        age_model_loaded = True
        print(f"Bark age model loaded successfully from {age_model_path}")
        print(f"Age classes: {AGE_CLASSES}")
    else:
        print(f"WARNING: Bark age model not found at {age_model_path}")
except Exception as e:
    print(f"Error loading bark age model: {e}")

# Preprocessing transforms (ImageNet standard)
species_transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

bark_transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


@app.get("/")
def read_root():
    return {
        "message": "TreeVisionAI Species & Bark Age Detection API",
        "status": "online",
        "species_model_loaded": species_model_loaded,
        "age_model_loaded": age_model_loaded,
        "species_classes": SPECIES_CLASSES,
        "age_classes": AGE_CLASSES,
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "model_loaded": species_model_loaded or age_model_loaded,
        "species_model_loaded": species_model_loaded,
        "age_model_loaded": age_model_loaded,
    }


@app.post("/predict")
async def predict_species(file: UploadFile = File(...)):
    """Predict species from uploaded foliage/tree image."""
    if not species_model_loaded:
        return {"error": "Species model not loaded. Check server logs."}

    try:
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        tensor = species_transform(image).unsqueeze(0).to(device)

        with torch.no_grad():
            outputs = species_model(tensor)
            probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
            confidence, predicted_idx = torch.max(probabilities, 0)
            predicted_class = SPECIES_CLASSES[predicted_idx.item()]
            confidence_value = confidence.item()

            all_predictions = []
            for i, class_name in enumerate(SPECIES_CLASSES):
                meta = SPECIES_META.get(class_name, {"display": class_name, "scientific": "", "family": "", "mai": 1.20})
                all_predictions.append({
                    "class": class_name,
                    "display_name": meta["display"],
                    "scientific_name": meta["scientific"],
                    "family": meta["family"],
                    "growth_rate_mai": meta.get("mai", 1.20),
                    "confidence": round(probabilities[i].item() * 100, 2),
                })
            all_predictions.sort(key=lambda x: x["confidence"], reverse=True)

        top_meta = SPECIES_META.get(predicted_class, {"display": predicted_class, "scientific": "", "family": "", "mai": 1.20})

        return {
            "prediction": predicted_class,
            "display_name": top_meta["display"],
            "scientific_name": top_meta["scientific"],
            "family": top_meta["family"],
            "growth_rate_mai": top_meta.get("mai", 1.20),
            "confidence": round(confidence_value * 100, 2),
            "all_predictions": all_predictions,
        }
    except Exception as e:
        return {"error": str(e)}


@app.post("/predict-age")
async def predict_age(
    file: UploadFile = File(...),
    species: str = Form(None),
    dbh: float = Form(None),
    gbh: float = Form(None),
    growth_rate: float = Form(None),
):
    """
    Predict tree age from uploaded bark image using EfficientNet-B4
    and synthesize with species Mean Annual Increment (growth rate) and DBH/GBH.
    """
    if not age_model_loaded:
        return {"error": "Bark age model not loaded. Check server logs."}

    try:
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        tensor = bark_transform(image).unsqueeze(0).to(device)

        with torch.no_grad():
            outputs = age_model(tensor)
            probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
            confidence, predicted_idx = torch.max(probabilities, 0)
            predicted_stage = AGE_CLASSES[predicted_idx.item()]
            confidence_value = confidence.item()

        # Build stages distribution and bark nominal age
        all_stages = []
        bark_weighted_age = 0.0
        for i, stage_name in enumerate(AGE_CLASSES):
            prob = probabilities[i].item()
            meta = AGE_STAGE_META.get(stage_name, {
                "label": stage_name.capitalize(),
                "age_range": "N/A",
                "description": "",
                "center_age": 20.0,
                "min_age": 0.0,
                "max_age": 100.0,
            })
            bark_weighted_age += prob * meta["center_age"]
            all_stages.append({
                "stage": stage_name,
                "label": meta["label"],
                "confidence": round(prob * 100, 2),
                "age_range": meta["age_range"],
                "description": meta["description"],
            })
        all_stages.sort(key=lambda x: x["confidence"], reverse=True)

        top_meta = AGE_STAGE_META.get(predicted_stage, {
            "label": predicted_stage.capitalize(),
            "age_range": "Unknown",
            "description": "",
            "center_age": 20.0,
            "min_age": 0.0,
            "max_age": 100.0,
        })

        # ─── Growth Rate & DBH Allometric Fusion ─────────────────
        effective_dbh = None
        if dbh is not None and dbh > 0:
            effective_dbh = float(dbh)
        elif gbh is not None and gbh > 0:
            effective_dbh = float(gbh) / math.pi

        effective_mai = None
        if growth_rate is not None and growth_rate > 0:
            effective_mai = float(growth_rate)
        elif species:
            clean_species = species.strip().lower()
            effective_mai = SPECIES_GROWTH_RATES.get(clean_species)
            if effective_mai is None:
                # check partial match
                for sp_key, mai_val in SPECIES_GROWTH_RATES.items():
                    if sp_key in clean_species or clean_species in sp_key:
                        effective_mai = mai_val
                        break
            if effective_mai is None:
                effective_mai = 1.20  # default urban tree MAI

        growth_age = None
        approximate_age = None
        comparison_summary = ""

        if effective_dbh and effective_mai:
            growth_age = round(effective_dbh / effective_mai, 1)

            # Check if allometric growth age falls within the predicted bark stage range
            min_a = top_meta["min_age"]
            max_a = top_meta["max_age"]

            if min_a <= growth_age <= max_a:
                # High agreement: weigh allometric continuous estimate with bark maturity
                approximate_age = round(0.70 * growth_age + 0.30 * bark_weighted_age, 1)
                comparison_summary = (
                    f"Bark texture strongly confirms {top_meta['label']} phase ({top_meta['age_range']}). "
                    f"At {effective_dbh:.1f} cm DBH with {species or 'species'} growth rate ({effective_mai:.2f} cm/yr), "
                    f"allometric growth indicates ~{growth_age:.1f} years, harmonizing with bark morphology to estimate {approximate_age:.1f} years."
                )
            else:
                # Divergence (e.g. stunted mature bark with low DBH or fast-growing specimen)
                approximate_age = round(0.50 * growth_age + 0.50 * bark_weighted_age, 1)
                comparison_summary = (
                    f"Bark texture reflects {top_meta['label']} stage ({top_meta['age_range']}), "
                    f"while girth allometry ({effective_dbh:.1f} cm DBH at {effective_mai:.2f} cm/yr MAI) suggests {growth_age:.1f} years. "
                    f"Synthesizing morphological aging with growth increment yields an approximate age of {approximate_age:.1f} years."
                )
        elif effective_mai and not effective_dbh:
            approximate_age = round(bark_weighted_age, 1)
            expected_dbh = round(approximate_age * effective_mai, 1)
            comparison_summary = (
                f"Bark morphology indicates a {top_meta['label']} tree ({top_meta['age_range']}). "
                f"Based on {species or 'species'} growth rate ({effective_mai:.2f} cm/yr), the estimated age is ~{approximate_age:.1f} years "
                f"(projected DBH ~{expected_dbh:.1f} cm)."
            )
        else:
            approximate_age = round(bark_weighted_age, 1)
            comparison_summary = (
                f"Bark morphological analysis identifies the tree as {top_meta['label']} ({top_meta['age_range']}) "
                f"with an approximate biological age of ~{approximate_age:.1f} years."
            )

        return {
            "age_stage": predicted_stage,
            "stage_label": top_meta["label"],
            "confidence": round(confidence_value * 100, 2),
            "age_range": top_meta["age_range"],
            "description": top_meta["description"],
            "approximate_age": approximate_age,
            "bark_age": round(bark_weighted_age, 1),
            "growth_age": growth_age,
            "dbh": round(effective_dbh, 1) if effective_dbh else None,
            "growth_rate_mai": effective_mai,
            "species": species,
            "all_stages": all_stages,
            "comparison_summary": comparison_summary,
        }
    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 5000))
    uvicorn.run(app, host="0.0.0.0", port=port)

