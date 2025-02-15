import { create } from "zustand";
import { DollyPoint, DollyPath } from "./types/Dolly";

interface StoreState {
    points: DollyPoint[];
    setPoints: (points: DollyPoint[]) => void;
    //   addPoint: (point: DollyPoint) => void;
    addPoint: (point: DollyPoint, pathIndex: number) => void;
    //   updatePoint: (index: number, updatedPoint: DollyPoint) => void;
    updatePoint: (index: number, updatedPoint: DollyPoint, pathIndex: number) => void;
    insertPoint: (index: number, point: DollyPoint, pathIndex: number) => void;
    //   removePoint: (index: number) => void;
    removePoint: (index: number, pathIndex: number) => void;

    paths: DollyPath[];
    setPaths: (paths: DollyPath[]) => void;
    addPath: (path: DollyPath) => void;
    updatePath: (index: number, updatedPath: DollyPath) => void;
    removePath: (index: number) => void;
}

const useStore = create<StoreState>((set) => ({
    points: [],
    setPoints: (points) => set({ points }),
    addPoint: (point, pathIndex) =>
        set((state) => {
            const paths = [...state.paths];
            if (paths[pathIndex].Points.length >= 50) return state;
            if (paths.reduce((acc, path) => acc + path.Points.length, 0) >= 100) return state;
            paths[pathIndex].Points.push(point);
            const newPaths = [...paths];
            return { paths: newPaths };
        }),
    updatePoint: (index, updatedPoint, pathIndex) =>
        set((state) => {
            const paths = [...state.paths];
            if (updatedPoint.PathIndex !== pathIndex) {
                if (!paths[pathIndex]) {
                    paths[pathIndex] = { Index: pathIndex, Points: [] };
                }
                if (paths[updatedPoint.PathIndex].Points.length >= 50) return state;
                let oldPathIndex = updatedPoint.PathIndex;
                paths[oldPathIndex].Points = paths[oldPathIndex].Points.filter((p) => p.Index !== updatedPoint.Index);
                updatedPoint.Index = paths[pathIndex].Points.length;
                updatedPoint.PathIndex = pathIndex;
                paths[pathIndex].Points.push(updatedPoint);
                if (paths[oldPathIndex].Points.length === 0) {
                    paths.splice(oldPathIndex, 1);
                    paths.forEach((path, i) => (path.Index = i));
                }
                const newPaths = [...paths];
                return { paths: newPaths };
            }
            paths[pathIndex].Points[index] = updatedPoint;
            const newPaths = [...paths];
            return { paths: newPaths };
        }),
    insertPoint: (index: number, point: DollyPoint, pathIndex: number) =>
        set((state) => {
            const paths = [...state.paths];
            if (paths[pathIndex].Points.length >= 50) return state;
            if (paths.reduce((acc, path) => acc + path.Points.length, 0) >= 100) return state;
            paths[pathIndex].Points.splice(index, 0, point);
            paths[pathIndex].Points.forEach((point, i) => (point.Index = i));
            const newPaths = [...paths];
            return { paths: newPaths };
        }),
    removePoint: (index, pathIndex) =>
        set((state) => {
            const paths = [...state.paths];
            if (paths[pathIndex].Points.length === 1) {
                paths.splice(pathIndex, 1);
                paths.forEach((path, i) => (path.Index = i));
                const newPaths = [...paths];
                return { paths: newPaths };
            }
            paths[pathIndex].Points = paths[pathIndex].Points.filter((_, i) => i !== index);
            paths[pathIndex].Points.forEach((point, i) => (point.Index = i));
            const newPaths = [...paths];
            return { paths: newPaths };
        }),
    paths: [],
    setPaths: (paths) => set({ paths }),
    addPath: (path) =>
        set((state) => {
            if (path.Points.length >= 50) return state;
            if (state.paths.reduce((acc, path) => acc + path.Points.length, 0) >= 100) return state;
            if (!path) path = { Index: state.paths.length, Points: [] };
            const newPaths = [...state.paths, path];
            return { paths: newPaths };
        }),
    updatePath: (index, updatedPath) =>
        set((state) => {
            if (updatedPath.Points.length >= 50) return state;
            const paths = [...state.paths];
            paths[index] = updatedPath;
            const newPaths = [...paths];
            return { paths: newPaths };
        }),
    removePath: (index) =>
        set((state) => {
            const newPaths = state.paths.filter((_, i) => i !== index);
            return { paths: [...newPaths] };
        }),
}));

export default useStore;
