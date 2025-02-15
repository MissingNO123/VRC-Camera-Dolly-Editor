import React from 'react';
import PointsEditor from './PointsEditor';
import { DollyPath, DollyPoint, defaultPoint } from '../types/Dolly';
import useStore from '../store';

const PathsEditor: React.FC = () => {
    const { paths, addPath } = useStore();

    return (
        <div className='p-4'>
            <h2 className="text-xl font-semibold">Paths</h2>
            {paths.map((path) => {
                return (
                    <PointsEditor
                        key={path.Index}
                        {...path}
                    />
                )
            })}
            <div className="flex justify-center">
                <button
                    onClick={() => addPath({
                        Index: paths.length,
                        Points: [
                            { ...defaultPoint, Index: 0, PathIndex: paths.length }
                        ]
                    })}
                    className="py-2 px-3 bg-blue-gray-500 hover:bg-blue-gray-600 text-white rounded-xl mb-4 self-center"
                >
                    New Path
                </button>
            </div>
        </div>
    );
};

export default PathsEditor; 