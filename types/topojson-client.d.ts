declare module "topojson-client" {
  export function feature<T = any>(topology: any, object: any): GeoJSON.FeatureCollection;
}
