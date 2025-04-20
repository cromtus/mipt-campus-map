declare module 'react-konva-to-svg' {
    // Define the type for the exportStageSVG function
    export function exportStageSVG(stage: any, options?: any): string; // Adjust types as necessary
}

declare module '*.ttf' {
  const value: string;
  export default value;
}

declare module '*.json' {
  const value: any;
  export default value;
}