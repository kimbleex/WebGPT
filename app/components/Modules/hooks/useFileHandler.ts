import { useState, useEffect, useCallback } from 'react';

/**
 * useFileHandler Hook
 * 
 * 功能 (What):
 * 管理文件上传、移除以及图片预览 URL 的创建和销毁。
 * Manages file uploads, removal, and creation/destruction of image preview URLs.
 * 
 * 生效范围 (Where):
 * 用于 ChatInterface 或其他需要文件处理的组件。
 * Used in ChatInterface or other components requiring file handling.
 * 
 * 使用方法 (How):
 * const { files, imageUrlMap, handleFileChange, removeFile, clearFiles } = useFileHandler();
 */
export function useFileHandler() {
    const [files, setFiles] = useState<File[]>([]);
    // 优化：创建和管理图片URL，防止内存泄漏
    const [imageUrlMap, setImageUrlMap] = useState<Map<number, string>>(new Map());

    useEffect(() => {
        const newImageUrlMap = new Map<number, string>();
        const currentUrlMap = imageUrlMap;

        // 为当前文件重新创建URL映射
        files.forEach((file, idx) => {
            if (file.type.startsWith("image/")) {
                // 复用已有的URL，或创建新的
                if (currentUrlMap.has(idx)) {
                    newImageUrlMap.set(idx, currentUrlMap.get(idx)!);
                } else {
                    const url = URL.createObjectURL(file);
                    newImageUrlMap.set(idx, url);
                }
            }
        });

        // 释放不再使用的旧URL
        currentUrlMap.forEach((url, idx) => {
            if (!newImageUrlMap.has(idx)) {
                URL.revokeObjectURL(url);
            }
        });

        setImageUrlMap(newImageUrlMap);

        return () => {
            // 组件卸载时清理所有URL
            newImageUrlMap.forEach(url => URL.revokeObjectURL(url));
        };
    }, [files]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles((prev) => [...prev, ...newFiles]);
            // 清空 input value，确保可以重复上传同一文件
            e.target.value = "";
        }
    }, []);

    const removeFile = useCallback((index: number) => {
        setFiles((prev) => {
            const fileToRemove = prev[index];

            // 如果是图片，先释放URL并重新索引
            if (fileToRemove && fileToRemove.type.startsWith("image/")) {
                setImageUrlMap((prevMap) => {
                    const reindexedMap = new Map<number, string>();

                    // 先释放被删除文件的URL
                    if (prevMap.has(index)) {
                        URL.revokeObjectURL(prevMap.get(index)!);
                    }

                    // 重新索引：只处理原数组中在被删除索引之前的文件
                    prevMap.forEach((url, idx) => {
                        if (idx < index) {
                            // 保持原索引
                            reindexedMap.set(idx, url);
                        } else if (idx > index) {
                            // 索引减1
                            reindexedMap.set(idx - 1, url);
                        }
                        // idx === index 的是被删除的，已经释放了
                    });

                    return reindexedMap;
                });
            }

            return prev.filter((_, i) => i !== index);
        });
    }, []);

    const clearFiles = useCallback(() => {
        // 清理所有图片URL
        setImageUrlMap((prevMap) => {
            prevMap.forEach(url => URL.revokeObjectURL(url));
            return new Map();
        });
        setFiles([]);
    }, []);

    return {
        files,
        setFiles, // 暴露 setFiles 以便在特殊情况下使用
        imageUrlMap,
        handleFileChange,
        removeFile,
        clearFiles
    };
}

/**
 * fileToBase64 Utility
 * 
 * 功能 (What):
 * 将文件转换为 Base64 字符串。
 * Converts a file to a Base64 string.
 */
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
};
