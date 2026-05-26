import cv2
import numpy as np

GRID_SIZE = 16


def analyze_frame(frame: np.ndarray) -> dict:
    h, w = frame.shape[:2]
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)

    cell_h = h // GRID_SIZE
    cell_w = w // GRID_SIZE

    grid = []
    scores = []

    for row in range(GRID_SIZE):
        row_data = []
        for col in range(GRID_SIZE):
            y1, y2 = row * cell_h, (row + 1) * cell_h
            x1, x2 = col * cell_w, (col + 1) * cell_w

            cell_gray = gray[y1:y2, x1:x2].astype(float)
            cell_edges = edges[y1:y2, x1:x2].astype(float)

            mean_L = cell_gray.mean()
            std_L = cell_gray.std()
            edge_d = cell_edges.mean() / 255.0

            # Pixels near 110 brightness carry the most crowd signal
            brightness_factor = max(0.3, 1.0 - abs(mean_L - 110) / 200.0)
            score = (std_L / 128.0 * 0.6 + edge_d * 0.4) * brightness_factor

            row_data.append({'row': row, 'col': col, 'score': float(score)})
            scores.append(score)
        grid.append(row_data)

    lo, hi = min(scores), max(scores)
    rng = hi - lo or 1.0

    for row_data in grid:
        for cell in row_data:
            cell['density'] = (cell['score'] - lo) / rng

    densities = [cell['density'] for row_data in grid for cell in row_data]
    avg_density = float(np.mean(densities))
    hotspots = sum(1 for d in densities if d > 0.75)

    return {
        'grid': grid,
        'avgDensity': avg_density,
        'maxDensity': float(max(densities)),
        'hotspots': hotspots,
        'totalCells': GRID_SIZE * GRID_SIZE,
    }


def compute_zones(grid: list) -> list:
    gs = len(grid)
    half = gs // 2
    zones = {
        'الشمالية': [grid[r][c]['density'] for r in range(half) for c in range(gs)],
        'الجنوبية': [grid[r][c]['density'] for r in range(half, gs) for c in range(gs)],
        'الشرقية':  [grid[r][c]['density'] for r in range(gs) for c in range(half, gs)],
        'الغربية':  [grid[r][c]['density'] for r in range(gs) for c in range(half)],
    }
    return [
        {'name': name, 'density': round(float(np.mean(vals)) * 100, 1)}
        for name, vals in zones.items()
    ]
