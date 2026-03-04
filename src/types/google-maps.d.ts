// Google Maps API型定義
declare namespace google.maps {
  class Map {
    constructor(mapDiv: HTMLElement, opts?: MapOptions);
    panTo(latLng: LatLng | LatLngLiteral): void;
    setZoom(zoom: number): void;
  }

  interface MapOptions {
    center?: LatLng | LatLngLiteral;
    zoom?: number;
    styles?: MapTypeStyle[];
    mapTypeControl?: boolean;
    streetViewControl?: boolean;
    fullscreenControl?: boolean;
    mapId?: string;
  }

  interface MapTypeStyle {
    featureType?: string;
    elementType?: string;
    stylers?: Array<{ [key: string]: string }>;
  }

  class Marker {
    constructor(opts?: MarkerOptions);
    setMap(map: Map | null): void;
    addListener(eventName: string, handler: () => void): void;
  }

  interface MarkerOptions {
    position?: LatLng | LatLngLiteral;
    map?: Map;
    title?: string;
    icon?: string | Icon | Symbol;
  }

  interface Icon {
    url?: string;
    scaledSize?: Size;
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

  interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  class Size {
    constructor(width: number, height: number);
  }
}

interface Window {
  google: typeof google;
}