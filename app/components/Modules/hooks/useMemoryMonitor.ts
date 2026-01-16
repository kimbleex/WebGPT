import { useState, useEffect, useRef } from 'react';

interface MemoryUsage {
    used: number;
    limit: number;
}

/**
 * useMemoryMonitor Hook
 * 
 * 功能 (What):
 * 监控浏览器内存使用情况，并在内存使用过高时触发回调。
 * Monitors browser memory usage and triggers a callback when usage is high.
 * 
 * 生效范围 (Where):
 * 可以在任何需要监控内存的组件中使用，目前主要用于 ChatInterface。
 * Can be used in any component that needs memory monitoring, currently used in ChatInterface.
 * 
 * 使用方法 (How):
 * const memoryUsage = useMemoryMonitor({ onHighMemory: handleHighMemory });
 * 
 * @param options - 配置选项
 * @param options.onHighMemory - 当内存使用超过阈值(80%)时的回调函数
 */
export function useMemoryMonitor(options?: { onHighMemory?: () => void }) {
    const [memoryUsage, setMemoryUsage] = useState<MemoryUsage | null>(null);
    const optionsRef = useRef(options);

    useEffect(() => {
        optionsRef.current = options;
    }, [options]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // 检查是否支持内存 API
        const isMemoryApiSupported = (performance as any).memory !== undefined;

        if (!isMemoryApiSupported) {
            console.log('当前浏览器不支持 memory API，内存监控不可用');
            return;
        }

        const monitorMemory = () => {
            // 检查内存使用情况
            const memoryInfo = (performance as any).memory;
            if (memoryInfo) {
                const usedMB = Math.round(memoryInfo.usedJSHeapSize / 1048576);
                const limitMB = Math.round(memoryInfo.jsHeapSizeLimit / 1048576);

                // 更新内存使用状态
                setMemoryUsage({ used: usedMB, limit: limitMB });

                // 如果内存使用超过80%，触发清理
                if (usedMB > limitMB * 0.8) {
                    console.warn(`内存使用过高: ${usedMB}MB/${limitMB}MB，触发清理`);

                    // 触发回调
                    optionsRef.current?.onHighMemory?.();

                    // 强制垃圾回收（如果可用）
                    if ((window as any).gc) {
                        (window as any).gc();
                    }
                }
            }
        };

        // 立即检查一次内存
        monitorMemory();

        // 每2秒检查一次内存（实时更新）
        const interval = setInterval(monitorMemory, 2000);

        return () => clearInterval(interval);
    }, []);

    return memoryUsage;
}
