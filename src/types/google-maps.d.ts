// Google Maps API型定義
declare namespace google.maps {
  class Map {
    constructor(mapDiv: HTMLElement, opts?: MapOptions);
    panTo(latLng: LatLng | LatLngLiteral): void;
    setZoom(zoom: number): void;
    addListener(eventName: string, handler: (event: MapMouseEvent) => void): MapsEventListener;
  }

  interface MapOptions {
    center?: LatLng | LatLngLiteral;
    zoom?: number;
    styles?: MapTypeStyle[];
    mapTypeControl?: boolean;
    streetViewControl?: boolean;
    fullscreenControl?: boolean;
    mapId?: string;
    clickableIcons?: boolean;
  }

  interface MapsEventListener {
    remove(): void;
  }

  interface MapTypeStyle {
    featureType?: string;
    elementType?: string;
    stylers?: Array<{ [key: string]: string }>;
  }

  class Marker {
    constructor(opts?: MarkerOptions);
    setMap(map: Map | null): void;
    setPosition(position: LatLng | LatLngLiteral): void;
    addListener(eventName: string, handler: () => void): void;
  }

  interface MarkerOptions {
    position?: LatLng | LatLngLiteral;
    map?: Map;
    title?: string;
    icon?: string | Icon | Symbol;
    label?: string | MarkerLabel;
  }

  interface MarkerLabel {
    text: string;
    color?: string;
    fontSize?: string;
    fontWeight?: string;
    className?: string;
  }

  interface Icon {
    url?: string;
    scaledSize?: Size;
    labelOrigin?: Point;
    anchor?: Point;
  }

  interface Symbol {
    path: SymbolPath | string;
    scale?: number;
    fillColor?: string;
    fillOpacity?: number;
    strokeColor?: string;
    strokeWeight?: number;
  }

  enum SymbolPath {
    CIRCLE = 0,
  }

  // Advanced Marker Element (新しいAPI)
  namespace marker {
    class AdvancedMarkerElement {
      constructor(opts?: AdvancedMarkerElementOptions);
      position: LatLng | LatLngLiteral | null;
      map: Map | null;
      title: string;
      content: HTMLElement | null;
      addListener(eventName: string, handler: () => void): void;
    }

    interface AdvancedMarkerElementOptions {
      position?: LatLng | LatLngLiteral;
      map?: Map;
      title?: string;
      content?: HTMLElement;
    }

    class PinElement {
      constructor(opts?: PinElementOptions);
      element: HTMLElement;
    }

    interface PinElementOptions {
      background?: string;
      borderColor?: string;
      glyphColor?: string;
      scale?: number;
    }
  }

  class InfoWindow {
    constructor(opts?: InfoWindowOptions);
    setContent(content: string | HTMLElement): void;
    open(options?: { map: Map; anchor?: Marker | marker.AdvancedMarkerElement }): void;
    close(): void;
  }

  interface InfoWindowOptions {
    content?: string | HTMLElement;
  }

  class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
  }

  interface MapMouseEvent {
    latLng: LatLng | null;
  }

  interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  class Size {
    constructor(width: number, height: number);
  }

  class Point {
    constructor(x: number, y: number);
  }
}

interface Window {
  google: typeof google;
  gm_authFailure?: () => void;
  __initGoogleMap?: () => void;
}
