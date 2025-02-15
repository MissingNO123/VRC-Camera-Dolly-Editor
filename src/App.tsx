import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
// import PointsEditor from './components/PointsEditor';
import PathsEditor from './components/PathsEditor';
import useStore from './store';
import AppBar from './AppBar';
import { openFileResult, saveFileResult } from '../types';
import { DollyPath, DollyPoint } from './types/Dolly';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileExport, faFileImport, faPlay } from '@fortawesome/free-solid-svg-icons';



function App() {
    // console.log(window.ipcRenderer);

    const [isOpen, setOpen] = useState(false);
    const [isSent, setSent] = useState(false);
    const [fromMain, setFromMain] = useState<string | null>(null);
    const { t } = useTranslation();

    const handleToggle = () => {
        if (isOpen) {
            setOpen(false);
            setSent(false);
        } else {
            setOpen(true);
            setFromMain(null);
        }
    };
    const sendMessageToElectron = () => {
        if (window.Main) {
            window.Main.sendMessage(t('common.helloElectron'));
        } else {
            setFromMain(t('common.helloBrowser'));
        }
        setSent(true);
    };

    useEffect(() => {
        window.Main.removeLoading();
    }, []);

    useEffect(() => {
        if (isSent && window.Main)
            window.Main.on('message', (message: string) => {
                setFromMain(message);
            });
    }, [fromMain, isSent]);

    const [isFileOpen, setFileOpen] = useState(false);
    const [filePath, setFilePath] = useState<string | null>(null);
    const { setPoints, points } = useStore();
    const { setPaths: setCameraPaths, paths } = useStore();
    const [pathsVersion, setPathsVersion] = useState(0);
    const [playDelay, setPlayDelay] = useState(0);
    const [isRawJsonVisible, setIsCollapsed] = React.useState(true);

    const openFile = async () => {
        const result: openFileResult = await window.Main.openFile();
        if (!result.canceled) {
            try {
                const data: DollyPoint[] = JSON.parse(result.content);
                if (data.length === 0) {
                    return;
                }
                setPoints(data);
                const groupedPaths = data.reduce((acc, point) => {
                    if (!acc[point.PathIndex]) {
                        acc[point.PathIndex] = [];
                    }
                    acc[point.PathIndex].push(point);
                    return acc;
                }, {} as Record<number, DollyPoint[]>);
                const paths = Object.keys(groupedPaths).map((key) => ({
                    Index: Number(key),
                    Points: groupedPaths[Number(key)]
                }));
                setCameraPaths(paths);
                setFilePath(result.filePath);
                setFileOpen(true);
            } catch (error) {
                console.error('Invalid JSON file:', error);
            }
        }
    };

    const saveFile = async () => {
        const result: saveFileResult = await window.Main.saveFile(getJson(), filePath || '');
        if (!result.canceled) {
            setFilePath(result.filePath);
        }
        console.log(result);
    };

    const saveFileAs = async () => {
        const result: saveFileResult = await window.Main.saveFile(getJson(), '');
        if (!result.canceled) {
            setFilePath(result.filePath);
        }
        console.log(result);
    };

    const newFile = () => {
        setPoints([]);
        setCameraPaths([]);
        setFilePath(null);
        setFileOpen(true);
    };

    // Prevent scrolling when a number input is focused
    React.useEffect(() => {
        const handleWheel = (event: WheelEvent) => {
            const active = document.activeElement as HTMLInputElement | null;
            if (
                active &&
                active.type === 'number' &&
                active.classList.contains('noscroll')
            ) {
                active.blur();
                event.preventDefault();
                event.stopPropagation();
            }
        };

        document.addEventListener('wheel', handleWheel, { passive: false });
        return () => document.removeEventListener('wheel', handleWheel);
    }, []);

    const getJson = () => {
        const points = paths.reduce((acc, path) => [...acc, ...path.Points], [] as DollyPoint[]);
          const cleanedPoints = points.map(point => {
              const newPoint: Partial<DollyPoint> = {};
              (Object.keys(point) as (keyof DollyPoint)[]).forEach(key => {
                  if (!String(key).startsWith('ui_')) {
                      newPoint[key] = point[key] as any;
                  }
              });
              return newPoint;
          });
        return JSON.stringify(cleanedPoints, null, 2);
    };

    const open3DViewer = async (paths: DollyPath[]) => {
        const result = await window.Main.openViewportWindow();
        if (!result) {
            console.error('Failed to open 3D viewer window');
            return;
        }
        setTimeout(() => window.Main.sendPaths(paths), 1000);
    };

    // whenever paths change, update the visualizer
    useEffect(() => {
        (async () => {
          const isViewportOpen = await window.Main.doesViewportWindowExist();
          if (isViewportOpen) {
            window.Main.sendPaths(paths);
          }
        })();
      }, [paths]);

    // window.Main.chatboxOSC('Hello from React!');

    return (
        <div className="flex flex-col h-full">
            {window.Main && (
                <div className="flex-none fixed top-0 left-0 right-0 z-50">
                    <AppBar />
                </div>
            )}
            <div className="p-4 pt-8 h-full overflow-y-auto">
                {/* {isFileOpen && (<h1 className="text-2xl font-bold">VRChat Camera Path Editor</h1>)} */}
                <div className="my-4">
                    {
                        !isFileOpen && (
                            <div className="flex justify-center flex-col items-center h-full w-full p-16"
                                style={{ position: 'fixed', top: '0%', left: '50%', transform: 'translate(-50%, 0%)' }}>
                                <button
                                    onClick={openFile}
                                    className="p-4 m-2 bg-blue-500 text-white rounded-xl w-full">
                                    Open Paths File
                                </button>
                                <button
                                    onClick={newFile}
                                    className="p-4 m-2 bg-green-500 text-white rounded-xl w-full">
                                    New Paths File
                                </button>
                            </div>
                        )
                    }
                    {isFileOpen && (
                        <div className='flex justify-center'>
                            <button
                                onClick={openFile}
                                className="m-1 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded">
                                Import Paths
                            </button>
                            <button onClick={saveFile} className="p-2 m-1 bg-green-500 hover:bg-green-600 text-white rounded">
                                Save
                            </button>
                            <button onClick={saveFileAs} className="p-2 m-1 bg-green-500 hover:bg-green-600 text-white rounded">
                                Save As
                            </button> 
                            <button
                                onClick={() => open3DViewer(paths)}
                                className="p-2 m-1 bg-deep-purple-400 hover:bg-deep-purple-500 text-white rounded">
                                Preview
                            </button>
                            <div className="flex ml-auto">
                                <label className="m-1 p-2">
                                    OSC controls:
                                </label>
                                <button
                                    onClick={() => playDelay ? window.Main.dollyPlayDelayedOSC(playDelay) : window.Main.dollyPlayOSC()}
                                    title="Play Animation in VRC"
                                    className="p-2 m-1 w-9 bg-green-500 hover:bg-green-600 text-white rounded">
                                    <FontAwesomeIcon icon={faPlay} />
                                </button>
                                <input type="number" value={playDelay} onChange={(e) => setPlayDelay(Number(e.target.value))} className="m-1 p-2 noscroll w-10 dark:bg-gray-700 text-white rounded-xl" />
                                <button
                                    onClick={() => window.Main.importPathsOSC(getJson())}
                                    title="Import Paths to VRC"
                                    className="p-2 m-1 w-9 bg-blue-500 hover:bg-blue-600 text-white rounded">
                                    <FontAwesomeIcon icon={faFileImport} />
                                </button>
                                <button
                                    onClick={() => window.Main.exportPathsOSC()}
                                    title="Export Paths from VRC"
                                    className="p-2 m-1 w-9 bg-green-500 hover:bg-green-600 text-white rounded">
                                    <FontAwesomeIcon icon={faFileExport} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                {isFileOpen && (
                    <>
                        <PathsEditor />
                        <button onClick={() => setIsCollapsed(!isRawJsonVisible)} className="py-2 px-3 my-2 mx-0 top-full bg-black text-white rounded-xl ">
                            {isRawJsonVisible ? "Show Raw Data" : "Hide Raw Data"}
                        </button>

                        {!isRawJsonVisible && (
                            <div className="border p-4 rounded bg-black json">
                                <pre>{getJson()}</pre>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default App;