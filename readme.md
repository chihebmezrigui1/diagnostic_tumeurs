# 🧠 Diagnostic et Classification des Tumeurs Cérébrales par Apprentissage Profond

Projet de **mémoire de Master** portant sur la **détection et la classification automatique des tumeurs cérébrales à partir d’images IRM**, en s’appuyant sur les **réseaux de neurones convolutifs (CNN)** et les techniques d’**apprentissage par transfert (Transfer Learning)**.

L’application est implémentée sous forme d’un **système full stack**, composé d’un **backend Python** pour le traitement et l’inférence du modèle, et d’un **frontend React** pour l’interface utilisateur.

---

## 🎯 Contexte et problématique

Les tumeurs cérébrales résultent d’une prolifération incontrôlée de cellules au niveau du cerveau et peuvent être bénignes ou malignes.  
L’imagerie par résonance magnétique (IRM) constitue le principal outil de détection, mais son interprétation reste complexe et dépend fortement de l’expertise du praticien.

Dans les pays à ressources limitées, le manque de spécialistes rend le diagnostic :
- long,
- coûteux,
- parfois sujet à des erreurs humaines.

👉 D’où la nécessité de développer **un système automatisé fiable**, capable d’assister les professionnels de santé dans la **détection et la classification des tumeurs cérébrales**.

---

## 🎯 Objectifs du projet

- Développer un modèle basé sur l’apprentissage profond pour la classification des tumeurs cérébrales
- Exploiter les **CNN** pour l’analyse d’images IRM
- Utiliser l’**apprentissage par transfert** afin d’améliorer les performances du modèle
- Comparer un modèle entraîné from scratch et un modèle pré-entraîné
- Mettre en œuvre une application web permettant d’utiliser le modèle de manière interactive

---

## 🧠 Types de tumeurs étudiées

Le système permet de classifier les images IRM en **4 classes** :

- ✅ Sans tumeur  
- 🧬 Gliome  
- 🧠 Méningiome  
- 🧪 Tumeur hypophysaire  

---

## 📊 Jeu de données

- Source : **Kaggle**
- Dataset : *Brain Tumor MRI Dataset*  
  https://www.kaggle.com/datasets/masoudnickparvar/brain-tumor-mri-dataset
- Nombre total d’images : **7023**
- Répartition :
  - Sans tumeur : 2000
  - Gliome : 1621
  - Méningiome : 1645
  - Hypophyse : 1757
- Division des données :
  - 80 % entraînement
  - 20 % test

---

## ⚙️ Prétraitement des données

- Redimensionnement des images à **224 × 224**
- Lecture et traitement via **OpenCV**
- Conversion en tableaux **NumPy**
- Encodage **One-Hot Encoding**
- Fractionnement des données avec `train_test_split`

---

## 🧠 Modèles implémentés

### 🔹 Modèle 1 – EfficientNet-B0 (sans Transfer Learning)
- Entraînement à partir de zéro
- 20 époques
- Batch size : 32
- Précision de test : **71,74 %**

---

### 🔹 Modèle 2 – EfficientNet-B0 avec Transfer Learning (Tuned Model)
- Poids pré-entraînés ImageNet
- Couches personnalisées
- GlobalAveragePooling + Dropout
- Optimiseur : Adam (lr = 0.0001)
- Batch size : 64
- Early stopping & learning rate decay
- Précision de validation : **97,51 %**
- Précision de test : **99,14 %**

👉 Le modèle avec apprentissage par transfert offre une amélioration significative des performances.

---

## 🛠️ Architecture technique

### Backend (Python)
- Python
- TensorFlow / Keras
- NumPy, OpenCV, Scikit-learn
- API REST pour l’inférence du modèle

### Frontend (React)
- React.js
- JavaScript
- Interface Dashboard pour le médecin pour :
  - charger une image IRM
  - afficher la prédiction du modèle
  - visualiser les résultats

---
## ▶️ Lancement du projet

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
### Frontend
```bash
cd frontend
npm install
npm start
```

### Auteur
Chihab Mezrigui

### Remarque 
Ce projet a été réalisé dans un cadre académique (mémoire de Master).
Il vise à démontrer l’efficacité des réseaux de neurones convolutifs et du Transfer Learning dans l’analyse d’images médicales et peut être étendu à d’autres pathologies.