export interface saveFileResult {
    filePath: string;
    canceled: boolean;
}

export interface openFileResult {
    content: string;
    filePath: string;
    canceled: boolean;
}