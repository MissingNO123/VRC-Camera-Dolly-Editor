export interface Vector3 {
    X: number;
    Y: number;
    Z: number;
}

export interface DollyPoint {
    Index: number;             // Index of the current point along the path
    PathIndex: number;         // Index of the path this point belongs to
    FocalDistance: number;     // Focal distance (0.0 - 10.0)
    Aperture: number;          // Aperture (1.4 - 32.0)
    Hue: number;               // Greenscreen hue (0.0 - 360.0)
    Saturation: number;        // Greenscreen saturation (0.0 - 100.0)
    Lightness: number;         // Greenscreen lightness (0.0 - 100.0)
    LookAtMeXOffset: number;   // Look-At-Me X offset (-25.0 - 25.0)
    LookAtMeYOffset: number;   // Look-At-Me Y offset (-25.0 - 25.0)
    Zoom: number;              // Zoom level (20.0 - 150.0)
    Speed: number;             // Fly Speed (0.1 - 15.0)
    Duration: number;          // Duration of this point in seconds (0.1 - 60.0)
    Position: Vector3;         // Position of the camera (expects keys x, y, z)
    Rotation: Vector3;         // Rotation of the camera (expects keys x, y, z)
    IsLocal: boolean;          // Is this point local to the player or in world-space?
    ui_Name?: string;             // Name of the point
    ui_IsCollapsed?: boolean;     // Is the point collapsed in the UI
}

export interface DollyPath {
    Index: number;
    Points: DollyPoint[];
}

export const defaultPoint = {
    FocalDistance: 2.0,
    Aperture: 15.0,
    Hue: 120.0,
    Saturation: 100.0,
    Lightness: 50.0,
    LookAtMeXOffset: 0.0,
    LookAtMeYOffset: 0.0,
    Zoom: 45.0,
    Speed: 3.0,
    Duration: 2.0,
    Position: { X: 0, Y: 0, Z: 0 },
    Rotation: { X: 0, Y: 0, Z: 0 },
    IsLocal: true,
};

