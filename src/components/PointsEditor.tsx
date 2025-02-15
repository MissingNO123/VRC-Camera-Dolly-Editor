import React from "react";
import useStore from "../store";
import { DollyPath, DollyPoint, defaultPoint } from "../types/Dolly";
import PointControl from "./PointControl";

const PointsEditor: React.FC<DollyPath> = (path) => {
    const { addPoint, paths } = useStore();

    const handleAdd = () => {
        const lengthOfAllPoints = paths.reduce((acc, path) => acc + path.Points.length, 0);
        if (lengthOfAllPoints >= 100) {
            return;
        }
        const newPoint: DollyPoint = {
            Index: path.Points.length,
            PathIndex: path.Index,
            ...defaultPoint,
        };
        addPoint(newPoint, path.Index); 
    };

    return (
        <div className="p-4 my-3 bg-gray-900 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold">Path {path.Index+1}</h2>
            {path.Points.map((point: DollyPoint) => (
                <PointControl
                    key={point.Index}
                    point={point}
                    pathIndex={path.Index}
                />
            ))}
            <div className="flex justify-center">
            <button onClick={handleAdd} className="py-2 px-3 bg-blue-gray-700 hover:bg-blue-gray-800 text-white rounded-xl mb-4 self-center">
                New Point
            </button>
            </div>
        </div>
    );
};

export default PointsEditor;
