import { contextBridge, ipcRenderer } from 'electron';

declare global {
    interface Window {
        ThreeDViewport: typeof api;
    }
}

const api = {
    onUpdatePoints: (callback: (paths: any) => void) => {
        ipcRenderer.on("3d:receive-paths", (_event, paths) =>
            callback(paths));
    }
};

contextBridge.exposeInMainWorld('ThreeDViewport', api);