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
        <tube name="x-axis" radius={0.005} tessellation={4} cap={3} path={[Vector3.Zero(), new Vector3(1, 0, 0)]}>
            <standardMaterial name="x-axis-mat" diffuseColor={Color3.Red()} specularColor={Color3.Black()} />
        </tube>
        <tube name="y-axis" radius={0.005} tessellation={4} cap={3} path={[Vector3.Zero(), new Vector3(0, 1, 0)]}>
            <standardMaterial name="y-axis-mat" diffuseColor={Color3.Green()} specularColor={Color3.Black()} />
        </tube>
        <tube name="z-axis" radius={0.005} tessellation={4} cap={3} path={[Vector3.Zero(), new Vector3(0, 0, 1)]}>
            <standardMaterial name="z-axis-mat" diffuseColor={Color3.Blue()} specularColor={Color3.Black()} />
        </tube>
    </>
);

function cameraViewAll(cameraRef: React.MutableRefObject<BabylonFreeCamera | null>, paths: DollyPath[]) {
    if (!cameraRef.current) return;
    let min = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    let max = new Vector3(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);
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
    const setPaths = useStore(state => state.setPaths);
    const cameraRef = React.useRef<BabylonFreeCamera | null>(null);
    const isCameraConfiguredYet = React.useRef(false);

    // Listen for updates using the exposed Babylon API from our preload. 
    useEffect(() => {
        if (window?.ThreeDViewport?.onUpdatePoints) {
            window.ThreeDViewport.onUpdatePoints((data: DollyPath[]) => {
                setPaths(data);
                // You can process your points and render something based on them.
            });
        }
    }, []);

    // useEffect(() => {
    //     console.log("Paths:");
    //     console.log(paths);
    // }, [paths]);

    return (
        <div className='flex justify-center items-center h-screen'>
            <Engine antialias adaptToDeviceRatio canvasId="babylon-canvas">
                <Scene>
                    <freeCamera
                        name="camera1"
                        ref={(camera) => {
                            if (!isCameraConfiguredYet.current) {
                                if (camera) {
                                    cameraRef.current = camera;
                                    configureCamera(cameraRef);
                                    cameraRef.current.setTarget(Vector3.Zero());
                                    isCameraConfiguredYet.current = true;
                                }
                            }
                        }}
                        position={new Vector3(-1, 1, -1)}
                    />
                    <hemisphericLight name="light1" intensity={0.7} direction={Vector3.Up()} />
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
                        {
                            paths.map((path, index) => (
                                <CameraPath key={index} points={path.Points} color={Color3.Teal()} />
                            ))
                        }
                    </utilityLayerRenderer>
                </Scene>
            </Engine>
        </div>
    );
};

export default BabylonScene;