from torchvision import transforms

# HAM10000 dataset normalization stats
_MEAN = [0.7630, 0.5456, 0.5700]
_STD = [0.1409, 0.1521, 0.1695]
_SIZE = 380

BASE_TRANSFORM = transforms.Compose([
    transforms.Resize((_SIZE, _SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=_MEAN, std=_STD),
])

# Test-time augmentation: 3 views for more reliable prediction
TTA_TRANSFORMS = [
    BASE_TRANSFORM,
    transforms.Compose([
        transforms.Resize((_SIZE, _SIZE)),
        transforms.RandomHorizontalFlip(p=1.0),
        transforms.ToTensor(),
        transforms.Normalize(mean=_MEAN, std=_STD),
    ]),
    transforms.Compose([
        transforms.Resize((_SIZE, _SIZE)),
        transforms.RandomVerticalFlip(p=1.0),
        transforms.ToTensor(),
        transforms.Normalize(mean=_MEAN, std=_STD),
    ]),
]
