/**
 * @fileoverview Jest type declarations for mock functions
 * @author Backend Team
 */

declare namespace jest {
    interface MockedFunction<T extends (...args: any[]) => any> {
        (...args: Parameters<T>): ReturnType<T>;
        mockReturnValue(value: ReturnType<T>): this;
        mockResolvedValue(value: ResolvedValue<ReturnType<T>>): this;
        mockRejectedValue(value: any): this;
        mockResolvedValueOnce(value: ResolvedValue<ReturnType<T>>): this;
        mockRejectedValueOnce(value: any): this;
        mockImplementation(fn: T): this;
        mockRestore(): void;
        mockClear(): void;
        mockReset(): void;
        toHaveBeenCalled(): any;
        toHaveBeenCalledWith(...args: Parameters<T>): any;
        toHaveBeenCalledTimes(times: number): any;
    }

    type ResolvedValue<T> = T extends Promise<infer U> ? U : T;

    interface Matchers<R> {
        toHaveBeenCalled(): R;
        toHaveBeenCalledWith(...args: any[]): R;
        toHaveBeenCalledTimes(expected: number): R;
        toHaveBeenLastCalledWith(...args: any[]): R;
        toHaveBeenNthCalledWith(nthCall: number, ...args: any[]): R;
        toHaveReturned(): R;
        toHaveReturnedTimes(expected: number): R;
        toHaveReturnedWith(expected: any): R;
        toHaveLastReturnedWith(expected: any): R;
        toHaveNthReturnedWith(nthCall: number, expected: any): R;
    }

    interface Expect {
        <T = unknown>(actual: T): jest.Matchers<void>;
        not: jest.Expect;
        any(constructor: any): any;
        anything(): any;
        arrayContaining(array: any[]): any;
        objectContaining(object: Record<string, any>): any;
        stringContaining(string: string): any;
        stringMatching(string: string | RegExp): any;
    }

    const expect: jest.Expect;

    function describe(name: string, fn: () => void): void;
    function it(name: string, fn: () => void | Promise<void>, timeout?: number): void;
    function test(name: string, fn: () => void | Promise<void>, timeout?: number): void;
    function beforeAll(fn: () => void | Promise<void>, timeout?: number): void;
    function beforeEach(fn: () => void | Promise<void>, timeout?: number): void;
    function afterAll(fn: () => void | Promise<void>, timeout?: number): void;
    function afterEach(fn: () => void | Promise<void>, timeout?: number): void;

    function fn<T extends (...args: any[]) => any>(implementation?: T): MockedFunction<T>;
    function spyOn<T, M extends keyof T>(object: T, method: M): MockedFunction<T[M] extends (...args: any[]) => any ? T[M] : never>;

    function mock(moduleName: string, factory?: () => any, options?: { virtual?: boolean }): void;
    function resetModules(): void;
    function clearAllMocks(): void;
    function resetAllMocks(): void;
    function restoreAllMocks(): void;

    const setTimeout: (timeout: number) => void;
}

declare const describe: typeof jest.describe;
declare const it: typeof jest.it;
declare const test: typeof jest.test;
declare const beforeAll: typeof jest.beforeAll;
declare const beforeEach: typeof jest.beforeEach;
declare const afterAll: typeof jest.afterAll;
declare const afterEach: typeof jest.afterEach;
declare const expect: typeof jest.expect;

// Augment Error type to include statusCode property used in tests
interface Error {
    statusCode?: number;
}