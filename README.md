
# 🌳 Tree AI
### GIS-Based AI Framework for Tree Intelligence and Climate Impact Assessment

Tree AI is an environmental technology project that combines Artificial Intelligence, machine learning, and Geographic Information Systems (GIS) to identify tree species, manage tree inventories, estimate tree age, and support climate-impact assessment.

The project aims to make tree information more accessible and useful for environmental monitoring, campus management, and sustainable urban planning.

---

## 📌 Table of Contents

- [Project Overview](#-project-overview)
- [Problem Statement](#-problem-statement)
- [Proposed Solution](#-proposed-solution)
- [Objectives](#-objectives)
- [Implemented Features](#-implemented-features)
- [Feature in Development](#-feature-in-development)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Working Principle](#-working-principle)
- [Tree Inventory and GIS](#-tree-inventory-and-gis)
- [Tree Age Estimation](#-tree-age-estimation)
- [Environmental Impact Assessment](#-environmental-impact-assessment)
- [Project Structure](#-project-structure)
- [Challenges and Limitations](#-challenges-and-limitations)
- [Future Scope](#-future-scope)
- [Conclusion](#-conclusion)

---

## 🌍 Project Overview

Trees are essential for maintaining ecological balance, supporting biodiversity, absorbing carbon dioxide, providing shade, and improving urban environments.

However, maintaining accurate information about trees across campuses and urban areas can be challenging. Tree species, age estimates, geographical locations, and environmental contributions are not always documented in a structured manner.

**Tree AI** addresses this challenge through an AI-powered and GIS-based platform for tree identification, inventory management, spatial visualization, and environmental assessment.

The platform is designed to support multiple campuses and locations, allowing institutions to maintain their own tree inventories and analyze their green resources.

---

## 🚨 Problem Statement

Urban development, construction, and infrastructure expansion can threaten existing trees and green spaces.

Several challenges make tree conservation and environmental planning difficult:

- Lack of centralized and structured tree inventories.
- Difficulty identifying tree species across large areas.
- Limited availability of tree age information.
- Inadequate geographical documentation of individual trees.
- Difficulty analyzing tree distribution and environmental contributions.
- Challenges maintaining and managing tree records across multiple campuses.

### Our Challenge

How can Artificial Intelligence and GIS be used to create a scalable tree intelligence platform that identifies tree species, maintains tree inventories, estimates tree age, and supports data-driven environmental planning?

---

## 💡 Proposed Solution

Tree AI combines machine learning, structured tree records, and geospatial analysis to support tree management and conservation.

The platform provides a foundation for:

1. Identifying supported tree species using AI.
2. Maintaining structured tree inventory records.
3. Managing tree information across multiple campuses.
4. Visualizing tree locations using geographical coordinates and GIS.
5. Estimating tree age using available measurements and suitable methods.
6. Assessing environmental indicators using relevant data and calculation methods.
7. Supporting tree conservation and sustainable development planning.

---

## 🎯 Objectives

- Develop an AI-powered tree species identification system.
- Maintain structured records of individual trees.
- Support tree inventory management across multiple campuses.
- Integrate tree records with GIS-based geographical visualization.
- Estimate tree age using appropriate data and methods.
- Support climate-impact assessment through environmental data.
- Provide a scalable foundation for urban forestry and tree conservation.

---

## ✅ Implemented Features

The following features represent the completed portions of the project.

### 1. AI-Based Tree Species Identification

The system uses a trained image-classification model to predict tree species from supported input images.

The AI pipeline uses deep learning to extract visual features and classify trees into the supported species categories.

### 2. Tree Inventory Management

The platform supports structured tree records to organize information about trees within a selected area or campus.

Inventory records can serve as the foundation for tree monitoring, analysis, and conservation planning.

### 3. Multi-Campus Tree Management

The platform is designed to support tree inventories for multiple campuses or locations rather than being limited to a single institution.

Each participating campus can maintain its own collection of tree records and associated geographical information.

### 4. GIS-Based Tree Mapping

Geographical information can be associated with tree records to visualize tree locations and understand their spatial distribution.

GIS integration supports the organization and exploration of tree information across different areas.

### 5. Tree Age Estimation

The project includes tree-age estimation as part of its tree intelligence workflow.

Age estimates should be interpreted according to the method and input data used. Species classification alone does not determine the exact age of a tree.

### 6. Climate-Impact Assessment

The platform supports environmental assessment using relevant tree and geographical information.

The reliability of specific environmental estimates depends on the available data, calculation methodology, and validation.

---

## 🚧 Feature in Development

### Bark Image Analysis

**Status: Not yet implemented**

Bark-image analysis is planned as an additional computer vision capability.

The proposed feature will investigate whether tree bark images can provide useful visual information for identifying tree species and improving the overall tree analysis workflow.

Planned development activities include:

- Collecting and organizing bark images.
- Cleaning and validating the image dataset.
- Preparing training, validation, and testing datasets.
- Training and evaluating suitable image-classification models.
- Comparing architectures such as ResNet50 and EfficientNet-B0.
- Integrating the selected model into the existing platform.
- Evaluating performance on previously unseen bark images.

Until implementation and evaluation are complete, bark-image analysis should be considered a planned enhancement rather than an existing system capability.

---

## 🏗️ System Architecture

The following diagram represents the overall logical architecture of Tree AI.

```text
                 USER / CAMPUS
                      |
                      v
              TREE AI PLATFORM
                      |
          +-----------+-----------+
          |                       |
          v                       v
    TREE IDENTIFICATION     TREE INVENTORY
          |                       |
          v                       v
     AI CLASSIFICATION      TREE RECORDS
          |                       |
          +-----------+-----------+
                      |
                      v
              GEOSPATIAL DATA
                      |
                      v
                 GIS MAPPING
                      |
          +-----------+-----------+
          |                       |
          v                       v
    TREE AGE ESTIMATION    ENVIRONMENTAL DATA
          |                       |
          +-----------+-----------+
                      |
                      v
            ENVIRONMENTAL ANALYSIS
                      |
                      v
            TREE INTELLIGENCE OUTPUT
                      |
                      v
         CONSERVATION & PLANNING SUPPORT


     FUTURE ENHANCEMENT:
     Bark Image Analysis
              |
              v
     Dataset Preparation
              |
              v
     Model Training and Evaluation
              |
              v
     Integration with Tree AI
```

**Architecture note:** Bark-image analysis is shown separately because it has not yet been implemented. The age-estimation and environmental-analysis components depend on their respective input data and methodologies.

---

## 🛠️ Technology Stack

The project uses or explores the following technologies. Retain only the tools that are actually used in the current implementation.

| Category | Technology | Purpose |
|---|---|---|
| Programming | Python | AI and data-processing workflows |
| Deep Learning | PyTorch | Model training and inference |
| Image Classification | ResNet50 | Tree species classification |
| Model Experimentation | EfficientNet-B0 | Potential alternative model |
| Computer Vision | OpenCV | Image processing |
| Data Processing | NumPy, Pandas | Data preparation and analysis |
| Visualization | Matplotlib | Model evaluation and plots |
| Geospatial Analysis | GIS tools | Spatial data management and analysis |
| Mapping | Suitable web mapping library | Interactive geographical visualization |
| Version Control | Git and GitHub | Source control and collaboration |

---

## ⚙️ Working Principle

### Step 1: Tree Information Input

Tree images and relevant tree information are provided to the platform.

### Step 2: Species Identification

The trained classification model analyzes supported images and predicts the corresponding tree species.

### Step 3: Tree Record Management

The predicted species and associated information are organized into tree inventory records.

### Step 4: Geographical Association

Tree records are associated with geographical coordinates when location information is available.

### Step 5: GIS Visualization

The platform uses geographical information to visualize tree distribution across a campus or selected area.

### Step 6: Tree Age Estimation

The system uses its configured age-estimation method and available inputs to estimate tree age.

### Step 7: Environmental Assessment

Tree and geographical information can be used with appropriate environmental datasets to support climate-impact assessment.

### Step 8: Future Bark Analysis Integration

Bark-image analysis can be integrated into the existing workflow after the feature has been developed and validated.

---

## 🗺️ Tree Inventory and GIS

GIS integration connects tree records with geographical information.

A tree inventory may include:

- Unique tree identifier.
- Predicted species.
- Estimated age, where available.
- Latitude and longitude.
- Tree measurements, where collected.
- Relevant observations and metadata.

GIS visualization helps users explore the geographical distribution of trees and supports campus-level tree management.

### Multi-Campus Support

The platform is designed to accommodate multiple campuses.

Each campus can maintain its own tree inventory while using a shared application architecture. Campus identifiers and suitable access controls can help keep records organized and separated.

---

## 🌱 Tree Age Estimation

Tree age estimation is an important part of understanding tree growth and environmental value.

Depending on the implemented method, age estimation may use:

- Species-specific growth information.
- Trunk diameter or circumference.
- Tree height and other relevant measurements.
- Historical records or repeated observations.

The reliability of the estimate depends on the available information and the selected methodology.

**Important:** Tree species identification and tree age estimation are different tasks. A species prediction alone cannot establish a tree's exact age.

---

## 🌡️ Environmental Impact Assessment

Tree AI aims to support environmental analysis by combining tree inventory information with relevant geographical and environmental datasets.

Potential indicators include:

- Tree distribution and green-cover patterns.
- Estimated carbon storage or sequestration.
- Potential shade and cooling benefits.
- Tree distribution near roads and buildings.
- Local vegetation patterns.

Environmental indicators must use appropriate data sources, calculation methods, and documented assumptions. Predictions should not be presented as direct measurements unless they have been measured.

---

## 📁 Recommended Project Structure

```text
tree-ai/
│
├── README.md
│
├── dataset/
│   └── README.md
│
├── models/
│   └── README.md
│
├── notebooks/
│   ├── data_exploration.ipynb
│   └── model_evaluation.ipynb
│
├── src/
│   ├── classification/
│   ├── inventory/
│   ├── gis/
│   ├── age_estimation/
│   └── environmental_analysis/
│
├── docs/
│   ├── system-architecture.md
│   ├── methodology.md
│   └── setup-guide.md
│
├── requirements.txt
└── .gitignore
```

This is a recommended structure. Adapt the folders and filenames to match the actual source code. Bark-analysis code can be added when that feature is implemented.

Large datasets and trained model weights may be stored separately when necessary, with instructions provided in the repository.

---

## ⚠️ Challenges and Limitations

- Species classification performance depends on image quality and dataset diversity.
- Similar-looking species may be difficult to distinguish.
- Age estimation depends on the reliability of its inputs and method.
- GIS accuracy depends on the quality of geographical coordinates.
- Environmental estimates depend on appropriate datasets and calculation methods.
- Bark-image analysis is not yet implemented.
- Field validation is necessary before using outputs for important conservation decisions.

---

## 🚀 Future Scope

### Bark Image Analysis
Develop and validate a dedicated bark-image classification pipeline.

### Improved Species Recognition
Expand supported species and improve model generalization.

### Advanced Tree Age Estimation
Explore species-specific growth models and additional tree measurements.

### Enhanced GIS Dashboard
Add advanced filters and spatial analysis tools.

### Climate-Impact Assessment
Integrate suitable environmental datasets and validated assessment methods.

### Campus-Level Analytics
Provide comparisons of tree distribution and environmental indicators across participating campuses.

### Tree Conservation Support
Use tree records and geographical analysis to help assess conservation priorities.

---

## 🏁 Conclusion

Tree AI combines artificial intelligence, tree inventory management, and GIS-based analysis to improve the documentation and understanding of trees.

Its multi-campus approach provides a foundation for scalable tree management, while age estimation and environmental assessment can help support informed conservation planning.

Bark-image analysis remains a planned enhancement that will extend the platform's computer vision capabilities after implementation and validation.

**Our vision: Use intelligent technology to understand, protect, and preserve our green environment. 🌳**

---

## 👥 Contributors

Add project team members and their contributions here.

**Project Domain:** Artificial Intelligence, Machine Learning, GIS, Environmental Technology.

**Research Focus:** GIS-Based AI Framework for Tree Age Estimation and Climate Impact Assessment.

## 📄 License

Add an appropriate open-source license before distributing the project. Verify that any datasets and pretrained models permit your intended use.
