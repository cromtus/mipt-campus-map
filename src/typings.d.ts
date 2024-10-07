declare module 'react-konva-to-svg' {
    // Define the type for the exportStageSVG function
    export function exportStageSVG(stage: any, options?: any): string; // Adjust types as necessary
}

declare module 'clipper-lib' {
    export = Clipper;

    namespace Clipper {
        export class Clipper {
            AddPath(subject: any, clipType: any, closed: any): void;
            Execute(clipType: any, solution: any, subjFillType: any, clipFillType: any): void;
        }
        export class IntPoint {
            constructor(x: number, y: number);
            X: number;
            Y: number;
        }
        export const PT_SUBJECT: number;
        export const PT_CLIP: number;
        export const CT_UNION: number;
        export const PFT_NONZERO: number;
        export const PFT_EVENODD: number;
        export type Path = IntPoint[];
        export type Paths = Path[];
    }
}