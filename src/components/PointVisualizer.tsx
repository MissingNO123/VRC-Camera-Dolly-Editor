import React, { FC, useEffect } from 'react';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Engine, Scene } from 'react-babylonjs';
import useStore from '../store';
import { DollyPath, DollyPoint } from '../types/Dolly';
import { FreeCamera as BabylonFreeCamera, FreeCameraMouseInput } from '@babylonjs/core';

// class UnityLikeCameraInput extends BaseCameraPointersInput {
//     public camera: BabylonFreeCamera;

//     constructor(camera: BabylonFreeCamera) {
//         super();
//         this.camera = camera;
//     }

//     getClassName(): string {
//         return "UnityLikeCameraInput";
//     }

//     onTouch(point: Nullable<PointerTouch>, offsetX: number, offsetY: number): void {
//         console.log("onTouch", point, offsetX, offsetY);
//     }

//     onButtonDown(_evt: IPointerEvent): void {
//         console.log("onButtonDown");
//         console.log(_evt);
//     }
// }

const GizmoBox = ({ position, color }: { position: Vector3, color: Color3 }) => (
    <box name="gizmo-box" size={2} position={position}>
        <standardMaterial name="gizmo-box-mat" diffuseColor={color} specularColor={Color3.Black()} />
        <positionGizmo />
    </box>
);

const deg2Rad = Math.PI / 180;
const rad2deg = 180 / Math.PI;

const CameraPoint = ({ position, rotation, color }: { position: Vector3, rotation: Vector3, color: Color3 }) => {
    const forwards = new Vector3(0, 0, 1);
    let orientation = Quaternion.FromEulerAngles(
        rotation.x * deg2Rad,
        rotation.y * deg2Rad,
        rotation.z * deg2Rad
    );
    let rotatedDirection = forwards.applyRotationQuaternion(orientation);

    let cameraGizmo = [
        (new Vector3(0.05, 0.05, 0.05)),
        (new Vector3(-0.05, 0.05, 0.05)),
        (new Vector3(-0.05, -0.05, 0.05)),
        (new Vector3(0.05, -0.05, 0.05)),
        (new Vector3(0.05, 0.05, 0.05)),
        (new Vector3(0, 0, 0)),
        (new Vector3(-0.05, 0.05, 0.05)),
        (new Vector3(-0.05, -0.05, 0.05)),
        (new Vector3(0, 0, 0)),
        (new Vector3(0.05, -0.05, 0.05))
    ]

    let triangle = [
        (new Vector3(0.04, 0.06, 0.05)),
        (new Vector3(0, 0.1, 0.05)),
        (new Vector3(-0.04, 0.06, 0.05)),
        (new Vector3(0.04, 0.06, 0.05))
    ]

    cameraGizmo = cameraGizmo.map(point => point.applyRotationQuaternion(orientation).add(position));
    triangle = triangle.map(point => point.applyRotationQuaternion(orientation).add(position));

    const key = `${position}${rotation}`;

    return (
        <>
            {/* <sphere name="camera-point" diameter={0.01} position={position}>
                <standardMaterial name="camera-point-mat" diffuseColor={color} specularColor={Color3.Black()} />
            </sphere> */}
            <lines key={key + ":s"} name="camera-point-square" points={cameraGizmo} color={color} updatable={true} />
            <lines key={key + ":t"} name="camera-point-triangle" points={triangle} color={color} updatable={true} />
        </>
    )
}

const CameraPath = ({ points, color }: { points: DollyPoint[], color: Color3 }) => {
    // draw a line connecting all points
    const pathCoordinates = points.map(point => new Vector3(point.Position.X, point.Position.Y, point.Position.Z));
    return (
        <lines key={JSON.stringify(pathCoordinates)} name="camera-path" points={pathCoordinates} color={color} updatable={true} />
    )
}
const OriginAxes = () => (
    <>
        <lines name="x-axis" points={[Vector3.Zero(), new Vector3(1, 0, 0)]} color={Color3.Red()} updatable={false} />
        <lines name="y-axis" points={[Vector3.Zero(), new Vector3(0, 1, 0)]} color={Color3.Green()} updatable={false} />
        <lines name="z-axis" points={[Vector3.Zero(), new Vector3(0, 0, 1)]} color={Color3.Blue()} updatable={false} />
    </>
);

function cameraViewAll(cameraRef: React.MutableRefObject<BabylonFreeCamera | null>, paths: DollyPath[]) {
    console.log("Viewing all paths");
    if (!cameraRef.current) return;
    console.log(paths[0])
    const pathOnePointOnePos = new Vector3(paths[0].Points[0].Position.X, paths[0].Points[0].Position.Y, paths[0].Points[0].Position.Z);
    console.log("Path 1 Point 1: " + pathOnePointOnePos);
    let min = pathOnePointOnePos.clone();
    let max = pathOnePointOnePos.clone();
    
    paths.forEach(path => {
        path.Points.forEach(point => {
            min.x = Math.min(min.x, point.Position.X);
            min.y = Math.min(min.y, point.Position.Y);
            min.z = Math.min(min.z, point.Position.Z);
            max.x = Math.max(max.x, point.Position.X);
            max.y = Math.max(max.y, point.Position.Y);
            max.z = Math.max(max.z, point.Position.Z);
        });
    });

    let center = Vector3.Center(min, max);
    let distance = Vector3.Distance(min, max);
    cameraRef.current.position = center.add(new Vector3(0, distance / 2, distance));
    cameraRef.current.setTarget(center);

    console.log("Camera pos/rot: " + cameraRef.current.position + " " +
      new Vector3(
        cameraRef.current.rotation.x * rad2deg,
        cameraRef.current.rotation.y * rad2deg,
        cameraRef.current.rotation.z * rad2deg
      )
    );
}

const configureCamera = (cameraRef: React.MutableRefObject<BabylonFreeCamera | null>) => {
    if (!cameraRef.current) return;
    cameraRef.current.minZ = 0.01;
    cameraRef.current.maxZ = 100;
    cameraRef.current.speed = 0.1;

    // cameraRef.current.inputs.clear();
    // bind WASD
    cameraRef.current.keysUp = [87]; // W
    cameraRef.current.keysDown = [83]; // S
    cameraRef.current.keysLeft = [65]; // A
    cameraRef.current.keysRight = [68]; // D

    cameraRef.current.keysUpward = [69]; // E
    cameraRef.current.keysDownward = [81]; // Q

    // bind only right click to rotate
    cameraRef.current.inputs.add(new FreeCameraMouseInput());
    const p = cameraRef.current.inputs.attached.mouse as FreeCameraMouseInput;
    p.buttons = [2];
    p.angularSensibility = 4000.0;

    // cameraRef.current.

}

const BabylonScene: FC = () => { // Have local state for the points (or any data passed from the main window) 
    const paths: DollyPath[] = useStore(state => state.paths);
    const pathsRef = React.useRef<DollyPath[]>(paths);
    const setPaths = useStore(state => state.setPaths);
    const cameraRef = React.useRef<BabylonFreeCamera | null>(null);
    const isCameraConfiguredYet = React.useRef(false);
    const shouldRecenterCamera = React.useRef(true);
    const pathsChangedSinceLastRecenter = React.useRef(false);

    const pathColors = [
        Color3.Teal(),
        Color3.Yellow(),
        Color3.Purple(),
        Color3.Magenta(),
        Color3.White()
    ];

    const resetCamera = () => {
        console.log("Resetting Camera");
        if (cameraRef.current) {
            cameraRef.current.rotation = new Vector3(0, 0, 0);
            cameraRef.current.position = new Vector3(-1, 1, -1);
            cameraRef.current.setTarget(Vector3.Zero());
            console.log("Camera pos/rot: " + cameraRef.current.position + " " +  new Vector3(
                cameraRef.current.rotation.x * rad2deg,
                cameraRef.current.rotation.y * rad2deg,
                cameraRef.current.rotation.z * rad2deg
            ));
        }
    }

    const refreshCamera = () => {
        if (!shouldRecenterCamera.current) return;
        console.log("Recentering Camera");
        if (cameraRef.current && pathsRef.current.length > 0 && pathsChangedSinceLastRecenter.current) {
            cameraViewAll(cameraRef, pathsRef.current);
            shouldRecenterCamera.current = false;
        } else {
            let str = "\n";
            if (!cameraRef.current) str+= "cameraRef.current is null\n";
            if (pathsRef.current.length === 0) str+= "paths.length is 0\n";
            if (!pathsChangedSinceLastRecenter.current) str+= "pathsChangedSinceLastRecenter.current is false\n";
            console.log("Camera not ready yet because of: " + str);
            setTimeout(refreshCamera, 200);
        }
    }

    const updatePaths = (newPaths: DollyPath[]) => {
        console.log("Received paths");
        setPaths(newPaths);
    }

    const refreshScene = () => {
        console.log("Refreshing Babylon Scene");
        if (cameraRef.current) {
            shouldRecenterCamera.current = true;
            pathsChangedSinceLastRecenter.current = false;
        }
    }

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'r') {
                resetCamera();
            }
            if (event.key === 'f') {
                cameraViewAll(cameraRef, pathsRef.current);
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (window?.ThreeDViewport?.onUpdatePoints) {
            window.ThreeDViewport.onUpdatePoints(updatePaths);
        }
    }, []);

    useEffect(() => {
        if (window?.ThreeDViewport?.onRefreshViewport) {
            window.ThreeDViewport.onRefreshViewport(refreshScene);
        }
    }, []);

    useEffect(() => {
        console.log("Paths: " + paths.length);
        pathsChangedSinceLastRecenter.current = true;
        pathsRef.current = paths;
    }, [paths]);

    return (
        <div className='flex justify-center items-center h-screen'>
            <Engine antialias adaptToDeviceRatio canvasId="babylon-canvas">
                <Scene>
                    <freeCamera
                        name="camera1"
                        ref={(camera) => {
                            if (!isCameraConfiguredYet.current) {
                                if (camera && paths.length > 0) {
                                    cameraRef.current = camera;
                                    configureCamera(cameraRef);
                                    isCameraConfiguredYet.current = true;
                                }
                            }
                            if (shouldRecenterCamera.current) {
                                refreshCamera();
                            }
                        }}
                        position={new Vector3(-1, 1, -1)}
                    />
                    {/* <hemisphericLight name="light1" intensity={0.7} direction={Vector3.Up()} /> */}
                    <OriginAxes />
                    <utilityLayerRenderer>
                        {
                            // draw all points for all paths
                            paths.flatMap(path => path.Points).map((point, index) => (
                                <CameraPoint key={index}
                                    position={new Vector3(point.Position.X, point.Position.Y, point.Position.Z)}
                                    rotation={new Vector3(point.Rotation.X, point.Rotation.Y, point.Rotation.Z)}
                                    color={Color3.White()} />
                            ))
                        }
                        {paths.map((path, index) => {
                            if (path.Points.length < 2) return null;
                            return (
                                <CameraPath
                                    key={index}
                                    points={path.Points}
                                    color={pathColors[index % pathColors.length]}
                                />
                            )})}
                    </utilityLayerRenderer>
                </Scene>
            </Engine>
        </div>
    );
};

export default BabylonScene;