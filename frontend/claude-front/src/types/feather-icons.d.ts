declare module 'feather-icons' {
  interface FeatherIcon {
    name: string;
    contents: string;
    tags: string[];
    attrs: Record<string, string>;
    toSvg(attrs?: Record<string, string | number>): string;
  }
  const feather: {
    icons: Record<string, FeatherIcon>;
    replace(attrs?: Record<string, string | number>): void;
  };
  export default feather;
}
