declare namespace Homey {
    export function __(key: string): string;

    export function setTitle(title: string): void;

    export function setSubtitle(subtitle: string): void;

    export function emit(event: string, data?: any): Promise<any>;

    export function createDevice(props: {
        readonly name: string;
        readonly data: Record<string, any>;
        readonly store?: Record<string, any>;
        readonly settings?: Record<string, any>;
    }): Promise<any>;

    export function done(): void;

    export function hideLoadingOverlay(): void;

    export function showLoadingOverlay(): void;

    export function getDeviceIds(): string;

    export function ready(props?: {
        readonly height: number;
    });

    export function setHeight(height: number): void;

    export function api<T>(
        method: 'DELETE' | 'GET' | 'POST' | 'PUT',
        uri: string,
        body?: object
    ): Promise<T>;

    export function on(event: string, callback: (...args: any[]) => void): void;
}

declare global {
    interface Window {
        onHomeyReady(): void;
    }
}
