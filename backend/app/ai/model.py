import torch
import torch.nn as nn
from torchvision import models


class HAM10000Classifier(nn.Module):
    """EfficientNet-B4 fine-tuned on HAM10000 (7 classes)."""

    def __init__(self, num_classes: int = 7):
        super().__init__()
        self.backbone = models.efficientnet_b4(weights=None)
        in_features = self.backbone.classifier[1].in_features
        self.backbone.classifier = nn.Sequential(
            nn.Dropout(p=0.4),
            nn.Linear(in_features, 512),
            nn.ReLU(),
            nn.Dropout(p=0.3),
            nn.Linear(512, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.backbone(x)
