import React from 'react';
import useStore from '../store';
import { DollyPoint, Vector3 } from '../types/Dolly';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleDown, faAngleUp, faCloudMeatball, faCopy, faEllipsisH, faTrash } from '@fortawesome/free-solid-svg-icons';

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
    let timer: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

const PointControl: React.FC<{ point: DollyPoint, pathIndex: number }> = ({ point, pathIndex }) => {
    const { updatePoint, removePoint, insertPoint, paths } = useStore();
    const [isCollapsed, setIsCollapsed] = React.useState(point.ui_IsCollapsed !== undefined ? point.ui_IsCollapsed : true);
    const [isShiftKeyDown, setIsShiftKeyDown] = React.useState(false);
    const [isCtrlKeyDown, setIsCtrlKeyDown] = React.useState(false);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Shift') {
                setIsShiftKeyDown(true);
            }
            if (e.key === 'Control') {
                setIsCtrlKeyDown(true);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Shift') {
                setIsShiftKeyDown(false);
            }
            if (e.key === 'Control') {
                setIsCtrlKeyDown(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        // console.log(name, value);
        if (name === 'IsLocal') {
            updatePoint(point.Index, { ...point, [name]: !point.IsLocal }, point.PathIndex);
            return;
        } else if (name.startsWith("Position.")) {
            const position = { ...point.Position };
            const key = name.split(".")[1] as keyof Vector3;
            position[key] = parseFloat(value);
            updatePoint(point.Index, { ...point, Position: position }, point.PathIndex);
            return;
        } else if (name.startsWith("Rotation.")) {
            const rotation = { ...point.Rotation };
            const key = name.split(".")[1] as keyof Vector3;
            let valueFloat = parseFloat(value);
            if (valueFloat >= 360) valueFloat = valueFloat % 360;
            if (valueFloat < 0) valueFloat = 360 + (valueFloat % 360);
            rotation[key] = valueFloat;
            updatePoint(point.Index, { ...point, Rotation: rotation }, point.PathIndex);
            return;
        } else {
            updatePoint(point.Index, { ...point, [name]: parseFloat(value) }, point.PathIndex);
            return;
        }
    };

    const hslToHex = (h: number, s: number, l: number) => {
        s /= 100;
        l /= 100;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = l - c / 2;
        let r = 0, g = 0, b = 0;
        if (h < 60) { r = c; g = x; }
        else if (h < 120) { r = x; g = c; }
        else if (h < 180) { g = c; b = x; }
        else if (h < 240) { g = x; b = c; }
        else if (h < 300) { r = x; b = c; }
        else { r = c; b = x; }
        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    };

    const hexToHsl = (hex: string) => {
        hex = hex.replace(/^#/, '');
        if (hex.length === 3) {
            hex = hex.split('').map(x => x + x).join('');
        }
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h *= 60;
        }
        return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
    };

    const toggleCollapsed = () => {
        const newCollapsedState = !isCollapsed;
        setIsCollapsed(newCollapsedState);
        updatePoint(point.Index, { ...point, ui_IsCollapsed: newCollapsedState }, point.PathIndex);
        console.log("Toggled collapsed state to", point.ui_IsCollapsed);
    };

    const duplicatePoint = () => {
        const newPoint = { ...point };
        insertPoint(point.Index + 1, newPoint, point.PathIndex);
    };

    const movePoint = (direction: number) => {
        const oldIndex = point.Index;
        const newIndex = point.Index + direction;
        if (newIndex < 0 || newIndex >= paths[point.PathIndex].Points.length) return;
        const newPoint = { ...point, ui_IsCollapsed: isCollapsed };
        removePoint(point.Index, point.PathIndex);
        insertPoint(newIndex, newPoint, point.PathIndex);
        setIsCollapsed(paths[pathIndex].Points[oldIndex] !== undefined ? newPoint.ui_IsCollapsed : true);
    };

    // Local state for color input
    const [inputColor, setInputColor] = React.useState(hslToHex(point.Hue, point.Saturation, point.Lightness));

    React.useEffect(() => {
        setInputColor(hslToHex(point.Hue, point.Saturation, point.Lightness));
      }, [point.Hue, point.Saturation, point.Lightness]);

    const debouncedUpdateColor = React.useCallback(
        debounce((value: string) => {
        const { h, s, l } = hexToHsl(value);
        updatePoint(point.Index, { ...point, Hue: h, Saturation: s, Lightness: l }, pathIndex);
        }, 200),
        [point.Index, point, updatePoint]
    );

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputColor(e.target.value);
        debouncedUpdateColor(e.target.value);
    };

    const currentColor = hslToHex(point.Hue, point.Saturation, point.Lightness);


    const h2Class = "text-lg font-semibold";
    const h4Class = "pt-6 pb-2 text-md font-semibold";

    const labelClassRight = "text-black dark:text-white mr-4 w-32 text-right";
    const labelClassLeft = "text-black dark:text-white mr-4 w-32 text-left";
    const textInputClass = "py-1 px-2 border rounded-xl w-32 bg-white text-black dark:bg-gray-900 dark:text-white my-0.5";
    const textInputWithSliderClass = "py-1 px-2 border rounded-xl w-16 bg-white text-black dark:bg-gray-900 dark:text-white my-0.5";

    // Handler when the user changes the destination path from the dropdown: 
    const handlePathChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPathIndex = parseInt(e.target.value, 10); if (newPathIndex !== point.PathIndex) {
            // const updatedPoint = { ...point };
            updatePoint(point.Index, point, newPathIndex);
        }
    };

    return (
        <div className="p-2 border rounded-3xl m-2 mx-0 bg-white dark:bg-black dark:border-gray-800 shadow-md">
            <div className="flex items-center">
                <button
                    onClick={toggleCollapsed}
                    style={{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 0.2s ease' }}
                    className="p-2"
                >
                    ▶
                </button>
                <h2 className={h2Class}>Point {point.Index + 1}</h2>
                <div className="group ml-auto w-48 flex justify-end">
                    <button
                        title="Move Up"
                        onClick={() => movePoint(-1)}
                        className="hidden group-hover:inline-flex text-blue-400 hover:text-blue-700 pr-4"
                    >
                        <FontAwesomeIcon icon={faAngleUp} size="lg" />
                    </button>
                    <button
                        title="Move Down"
                        onClick={() => movePoint(1)}
                        className="hidden group-hover:inline-flex text-blue-400 hover:text-blue-700 pr-4"
                    >
                        <FontAwesomeIcon icon={faAngleDown} size="lg" />
                    </button>
                    <button
                        title="Duplicate"
                        onClick={duplicatePoint}
                        className="hidden group-hover:inline-flex text-blue-400 hover:text-blue-700 pr-4"
                    >
                        <FontAwesomeIcon icon={faCopy} size="lg" />
                    </button>
                    <button
                        title="Delete"
                        onClick={() => removePoint(point.Index, pathIndex)}
                        className="hidden group-hover:inline-flex text-red-400 hover:text-red-700 pr-4"
                    >
                        <FontAwesomeIcon icon={faTrash} size="lg" />
                    </button>
                    <button
                        title="Hover to show options"
                        className="text-gray-400 pr-4"
                    >
                        <FontAwesomeIcon icon={faEllipsisH} size="lg" />
                    </button>
                </div>
            </div>
            <div
                style={{
                    maxHeight: isCollapsed ? '0px' : '1200px',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s cubic-bezier( 0.19, 1, 0.22, 1 )',
                }}
                className='px-4'
            >

                <h4 className={h4Class}>Camera Settings</h4>
                <div className="flex flex-col">
                    {/* Focal Distance */}
                    <div className="flex items-center noscroll">
                        <label className={labelClassRight}>Focal Distance</label>
                        <input
                            type="number"
                            name="FocalDistance"
                            value={point.FocalDistance}
                            min={0}
                            max={10}
                            step={0.1}
                            onChange={handleChange}
                            className={textInputWithSliderClass}
                        />
                        <input
                            type="range"
                            name="FocalDistance"
                            min="0"
                            max="10"
                            step="0.1"
                            value={point.FocalDistance}
                            onChange={handleChange}
                            className="ml-4 w-full"
                            onWheel={(e) => e.stopPropagation()}
                        />
                    </div>

                    {/* Aperture */}
                    <div className="flex items-center">
                        <label className={labelClassRight}>Aperture</label>
                        <input
                            type="number"
                            name="Aperture"
                            value={point.Aperture}
                            min={1.4}
                            max={32}
                            step={0.1}
                            onChange={handleChange}
                            className={textInputWithSliderClass}
                        />
                        <input
                            type="range"
                            name="Aperture"
                            min="1.4"
                            max="32"
                            step="0.1"
                            value={point.Aperture}
                            onChange={handleChange}
                            className="ml-4 w-full"
                        />
                    </div>

                    {/* Zoom */}
                    <div className="flex items-center">
                        <label className={labelClassRight}>Zoom</label>
                        <input
                            type="number"
                            name="Zoom"
                            value={point.Zoom}
                            min={20}
                            max={150}
                            step={1}
                            onChange={handleChange}
                            className={textInputWithSliderClass}
                        />
                        <input
                            type="range"
                            name="Zoom"
                            min="20"
                            max="150"
                            step="1"
                            value={point.Zoom}
                            onChange={handleChange}
                            className="ml-4 w-full"
                        />
                    </div>

                    {/* Speed */}
                    <div className="flex items-center">
                        <label className={labelClassRight}>Speed</label>
                        <input
                            type="number"
                            name="Speed"
                            value={point.Speed}
                            min={0.1}
                            max={15}
                            step={0.1}
                            onChange={handleChange}
                            className={textInputWithSliderClass}
                        />
                        <input
                            type="range"
                            name="Speed"
                            min="0.1"
                            max="15"
                            step="0.1"
                            value={point.Speed}
                            onChange={handleChange}
                            className="ml-4 w-full"
                        />
                    </div>
                </div>

                <h4 className={h4Class}>Greenscreen Color</h4>
                <div className='grid grid-cols-2 gap-4'>
                    <div className="flex flex-col">
                        {/* Hue */}
                        <div className="flex items-center">
                            <label className={labelClassRight}>Hue</label>
                            <input
                                type="number"
                                name="Hue"
                                value={point.Hue}
                                min={0}
                                max={360}
                                onChange={handleChange}
                                className={textInputClass}
                            />
                        </div>

                        {/* Saturation */}
                        <div className="flex items-center">
                            <label className={labelClassRight}>Saturation</label>
                            <input
                                type="number"
                                name="Saturation"
                                value={point.Saturation}
                                min={0}
                                max={100}
                                onChange={handleChange}
                                className={textInputClass}
                            />
                        </div>

                        {/* Lightness */}
                        <div className="flex items-center">
                            <label className={labelClassRight}>Lightness</label>
                            <input
                                type="number"
                                name="Lightness"
                                value={point.Lightness}
                                min={0}
                                max={50}
                                onChange={handleChange}
                                className={textInputClass}
                            />
                        </div>
                    </div>
                    <div>
                        {(() => {
                            return (
                                <div className="flex items-center">
                                    <input
                                        type="color"
                                        value={inputColor}
                                        onChange={handleColorChange}
                                        className="w-32 h-32 border-0"
                                    />
                                </div>
                            );
                        })()}
                    </div>
                </div>

                <h4 className={h4Class}>Look-At-Me</h4>
                <div className="grid grid-cols-2 gap-4">
                    {/* LookAtMeXOffset */}
                    <div className="flex items-center">
                        <label className={labelClassRight}>X Offset</label>
                        <input
                            type="number"
                            name="LookAtMeXOffset"
                            value={point.LookAtMeXOffset}
                            min={-25}
                            max={25}
                            step={0.1}
                            onChange={handleChange}
                            className={textInputClass}
                        />
                    </div>

                    {/* LookAtMeYOffset */}
                    <div className="flex items-center">
                        <label className={labelClassRight}>Y Offset</label>
                        <input
                            type="number"
                            name="LookAtMeYOffset"
                            value={point.LookAtMeYOffset}
                            min={-25}
                            max={25}
                            step={0.1}
                            onChange={handleChange}
                            className={textInputClass}
                        />
                    </div>
                </div>

                <h4 className={h4Class}>Duration</h4>
                <div className="flex items-center">
                    <label className={labelClassRight}>Duration</label>
                    <input
                        type="number"
                        name="Duration"
                        value={point.Duration}
                        min={0.1}
                        max={60}
                        step={0.1}
                        onChange={handleChange}
                        className={textInputClass}
                    />
                </div>

                <h4 className={h4Class}>Position</h4>
                <div className="grid grid-cols-3 gap-4">
                    {/* Position X */}
                    <div className="flex items-center">
                        <label className={labelClassRight}>X</label>
                        <input
                            type="number"
                            name="Position.X"
                            value={point.Position.X}
                            step={isCtrlKeyDown ? 1 : isShiftKeyDown ? 0.01 : 0.1}
                            onChange={handleChange}
                            className={textInputClass}
                        />
                    </div>

                    {/* Position Y */}
                    <div className="flex items-center">
                        <label className={labelClassRight}>Y</label>
                        <input
                            type="number"
                            name="Position.Y"
                            value={point.Position.Y}
                            step={isCtrlKeyDown ? 1 : isShiftKeyDown ? 0.01 : 0.1}
                            onChange={handleChange}
                            className={textInputClass}
                        />
                    </div>

                    {/* Position Z */}
                    <div className="flex items-center">
                        <label className={labelClassRight}>Z</label>
                        <input
                            type="number"
                            name="Position.Z"
                            value={point.Position.Z}
                            step={isCtrlKeyDown ? 1 : isShiftKeyDown ? 0.01 : 0.1}
                            onChange={handleChange}
                            className={textInputClass}
                        />
                    </div>
                </div>

                <h4 className={h4Class}>Rotation</h4>
                <div className="grid grid-cols-3 gap-4">
                    {/* Rotation X */}
                    <div className="flex items-center">
                        <label className={labelClassRight}>X</label>
                        <input
                            type="number"
                            name="Rotation.X"
                            value={point.Rotation.X}
                            step={isCtrlKeyDown ? 5 : isShiftKeyDown ? 0.1 : 1}
                            onChange={handleChange}
                            className={textInputClass}
                        />
                    </div>

                    {/* Rotation Y */}
                    <div className="flex items-center">
                        <label className={labelClassRight}>Y</label>
                        <input
                            type="number"
                            name="Rotation.Y"
                            value={point.Rotation.Y}
                            step={isCtrlKeyDown ? 5 : isShiftKeyDown ? 0.1 : 1}
                            onChange={handleChange}
                            className={textInputClass}
                        />
                    </div>

                    {/* Rotation Z */}
                    <div className="flex items-center">
                        <label className={labelClassRight}>Z</label>
                        <input
                            type="number"
                            name="Rotation.Z"
                            value={point.Rotation.Z}
                            step={isCtrlKeyDown ? 5 : isShiftKeyDown ? 0.1 : 1}
                            onChange={handleChange}
                            className={textInputClass}
                        />
                    </div>
                </div>

                <h4 className={h4Class}>Coordinate Space</h4>
                <div className="flex items-center">
                    <label className={labelClassRight}>Is Local</label>
                    <input
                        type="checkbox"
                        name="IsLocal"
                        checked={point.IsLocal}
                        onChange={handleChange}
                        className={textInputClass}
                    />
                </div>

                <h4 className={h4Class}>Move to Path</h4>
                <div className="flex items-center mb-4">
                    <label className={labelClassRight}>Destination</label>
                    <select
                        className={textInputClass}
                        value={point.PathIndex}
                        onChange={handlePathChange}
                    >
                        {paths.map((p, i) => (
                            <option key={i} value={i}>
                                Path {i + 1}
                            </option>
                        ))}
                        <option value={paths.length}>New Path</option>
                    </select>
                </div>
            </div>

        </div>
    );
}

export default PointControl;