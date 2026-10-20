export const trashCatalog = [
    {
        id: 'pet-bottle',
        label: 'PET water bottle',
        category: 'Plastic bottle',
        bin: 'plastic',
        riceGrams: 25,
        recyclable: true,
        image: "/3f64dfdf-535f-47cd-8b19-8b5352c5992b.jpg",
        box: { x: 30, y: 41, w: 41, h: 19 },
        weight: 45
    },
    {
        id: 'alu-can',
        label: 'Aluminum can',
        category: 'Metal can',
        bin: 'metal',
        riceGrams: 30,
        recyclable: true,
        image: "/cc5dbb57-6d67-4ffc-8b07-85bb363522fa.jpg",
        box: { x: 30, y: 30, w: 40, h: 40 },
        weight: 20
    },
    {
        id: 'carton',
        label: 'Cardboard carton',
        category: 'Paper / cardboard',
        bin: 'paper',
        riceGrams: 15,
        recyclable: true,
        image: "/3b64159b-d82c-487f-91f0-dfaebeebd3b6.jpg",
        box: { x: 27, y: 27, w: 46, h: 46 },
        weight: 15
    },
    {
        id: 'snack-wrapper',
        label: 'Snack wrapper',
        category: 'Junk food packaging',
        bin: 'residual',
        riceGrams: 0,
        recyclable: false,
        image: "/578db01b-4ae5-4b8a-bef4-82e161462ab2.jpg",
        box: { x: 28, y: 28, w: 44, h: 44 },
        weight: 20
    }
];
export const bins = [
    { id: 'plastic', label: 'Plastic bottles', servoAngle: 0, fillPercent: 82, color: '#2f74c0' },
    { id: 'metal', label: 'Aluminum cans', servoAngle: 60, fillPercent: 46, color: '#7d8792' },
    { id: 'paper', label: 'Paper / cardboard', servoAngle: 120, fillPercent: 31, color: '#b07f45' },
    { id: 'residual', label: 'Residual (non-recyclable)', servoAngle: 180, fillPercent: 64, color: '#c4513c' }
];
