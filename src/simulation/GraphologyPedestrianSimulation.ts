import Graph from 'graphology';
import {singleSource} from 'graphology-shortest-path/unweighted';
import walkNetworkData from '../data/kista_walk_network.graphology.json';

export interface Pedestrian {
  id: string;
  currentNode: string;
  destinationNode: string;
  path: string[];
  pathIndex: number;
  progress: number; // 0 to 1, position along the current edge
  speed: number;    // meters per second
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  // Returns distance in meters between two lat/lng points
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

interface PathCache {
  version: string;
  timestamp: number;
  paths: Record<string, Record<string, string[]>>;
}

export class GraphologyPedestrianSimulation {
  private graph: Graph;
  private pedestrians: Pedestrian[] = [];
  private nodeKeys: string[] = [];
  private tickCount = 0;
  private tickDuration = 1; // seconds per tick
  private pathCache: Map<string, string[]> = new Map();
  private globalPathMatrix: Record<string, Record<string, string[]>> = {};
  private isInitialized = false;
  private onProgress?: (progress: number) => void;
  private readonly CACHE_VERSION = '1.0';
  private readonly CACHE_KEY = 'kista_walk_paths_cache';
  private worker: Worker | null = null;
  private useWorker = false;

  constructor(pedestrianCount: number = 500, onProgress?: (progress: number) => void) {
    this.onProgress = onProgress;
    this.graph = new Graph({ multi: true });
    this.graph.import(walkNetworkData);
    this.nodeKeys = this.graph.nodes();
    
    // Try to initialize Web Worker
    this.initializeWorker();
    
    // Initialize pedestrians without computing paths immediately
    this.initializePedestriansBasic(pedestrianCount);
    
    // Try to load cached paths first, then compute if needed
    this.loadOrComputePathsAsync();
  }

  private initializeWorker() {
    try {
      this.worker = new Worker('/pathfinder-worker.js');
      this.worker.onmessage = (e) => this.handleWorkerMessage(e);
      this.useWorker = true;
      console.log('Web Worker initialized for pathfinding');
    } catch (error) {
      console.warn('Web Worker not available, using main thread:', error);
      this.useWorker = false;
    }
  }

  private handleWorkerMessage(e: MessageEvent) {
    const { type, progress, pathMatrix, source, target, path } = e.data;
    
    switch (type) {
      case 'PROGRESS':
        this.onProgress?.(progress);
        break;
      case 'PATHS_COMPUTED':
        this.globalPathMatrix = pathMatrix;
        this.saveCachedPaths();
        this.assignPathsFromCache();
        this.isInitialized = true;
        this.onProgress?.(100);
        console.log('Pedestrian simulation fully initialized with Web Worker');
        break;
      case 'SINGLE_PATH_COMPUTED':
        // Handle single path computation if needed
        break;
    }
  }

  private getRandomNode(): string {
    return this.nodeKeys[Math.floor(Math.random() * this.nodeKeys.length)];
  }

  private getCacheKey(source: string, target: string): string {
    return `${source}-${target}`;
  }

  private loadCachedPaths(): boolean {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return false;

      const pathCache: PathCache = JSON.parse(cached);
      
      // Check if cache is valid and recent (less than 24 hours old)
      const isRecent = Date.now() - pathCache.timestamp < 24 * 60 * 60 * 1000;
      const isCorrectVersion = pathCache.version === this.CACHE_VERSION;
      
      if (isRecent && isCorrectVersion && pathCache.paths) {
        this.globalPathMatrix = pathCache.paths;
        console.log('Loaded cached paths from localStorage');
        return true;
      }
    } catch (error) {
      console.warn('Failed to load cached paths:', error);
    }
    return false;
  }

  private saveCachedPaths() {
    try {
      const pathCache: PathCache = {
        version: this.CACHE_VERSION,
        timestamp: Date.now(),
        paths: this.globalPathMatrix
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(pathCache));
      console.log('Saved paths to localStorage cache');
    } catch (error) {
      console.warn('Failed to save paths to cache:', error);
    }
  }

  private findShortestPath(source: string, target: string): string[] {
    if (source === target) return [source];
    
    // Check global matrix first
    if (this.globalPathMatrix[source] && this.globalPathMatrix[source][target]) {
      return this.globalPathMatrix[source][target];
    }
    
    // Check local cache
    const cacheKey = this.getCacheKey(source, target);
    if (this.pathCache.has(cacheKey)) {
      return this.pathCache.get(cacheKey)!;
    }
    
    // Compute path and cache it
    const pathMapping: Record<string, string[]> = singleSource(this.graph, source);
    const path = pathMapping[target] || [source];
    this.pathCache.set(cacheKey, path);
    
    return path;
  }

  private initializePedestriansBasic(count: number) {
    this.pedestrians = [];
    for (let i = 0; i < count; i++) {
      const start = this.getRandomNode();
      let dest = this.getRandomNode();
      while (dest === start) dest = this.getRandomNode();
      
      this.pedestrians.push({
        id: `ped_${i + 1}`,
        currentNode: start,
        destinationNode: dest,
        path: [start], // Start with just the current node, path will be computed later
        pathIndex: 0,
        progress: 0,
        speed: 0.1 + Math.random() * 0.3 // 1.4-2.0 m/s, some variation
      });
    }
  }

  private async loadOrComputePathsAsync() {
    // Try to load from cache first
    if (this.loadCachedPaths()) {
      // If we have cached paths, just assign them to pedestrians
      this.assignPathsFromCache();
      this.isInitialized = true;
      this.onProgress?.(100);
      console.log('Pedestrian simulation initialized from cache');
      return;
    }

    // If no cache, compute only the paths we need (much faster)
    await this.computeNeededPathsAsync();
  }

  private async computeNeededPathsAsync() {
    // Collect all unique source-destination pairs that pedestrians need
    const neededPairs = new Set<string>();
    for (const ped of this.pedestrians) {
      const pair = `${ped.currentNode}-${ped.destinationNode}`;
      neededPairs.add(pair);
    }
    
    const pairs = Array.from(neededPairs);
    const totalPairs = pairs.length;
    
    console.log(`Computing ${totalPairs} needed paths (instead of all possible paths)...`);
    
    // Compute paths for each needed pair
    for (let i = 0; i < totalPairs; i++) {
      const [source, target] = pairs[i].split('-');
      const path = this.findShortestPath(source, target);
      
      // Store in global matrix
      if (!this.globalPathMatrix[source]) {
        this.globalPathMatrix[source] = {};
      }
      this.globalPathMatrix[source][target] = path;
      
      // Report progress
      const progress = (i / totalPairs) * 90;
      this.onProgress?.(progress);
      
      // Yield control every 10 pairs
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    // Save to cache
    this.saveCachedPaths();
    
    // Assign paths to pedestrians
    this.assignPathsFromCache();
    
    this.isInitialized = true;
    this.onProgress?.(100);
    console.log('Pedestrian simulation initialized with needed paths only');
  }

  private assignPathsFromCache() {
    for (const ped of this.pedestrians) {
      const path = this.globalPathMatrix[ped.currentNode]?.[ped.destinationNode];
      if (path) {
        ped.path = path;
      } else {
        // Fallback to individual computation if not in cache
        ped.path = this.findShortestPath(ped.currentNode, ped.destinationNode);
      }
    }
  }

  private async computeAllPathsAsync() {
    const nodes = this.nodeKeys;
    const totalNodes = nodes.length;
    
    console.log(`Computing paths for ${totalNodes} nodes...`);
    
    for (let i = 0; i < totalNodes; i++) {
      const source = nodes[i];
      const pathMapping: Record<string, string[]> = singleSource(this.graph, source);
      this.globalPathMatrix[source] = pathMapping;
      
      // Report progress
      const progress = (i / totalNodes) * 90; // Reserve 10% for assignment
      this.onProgress?.(progress);
      
      // Yield control every 5 nodes to keep UI responsive
      if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    // Save to cache
    this.saveCachedPaths();
    
    // Assign paths to pedestrians
    this.assignPathsFromCache();
    
    this.isInitialized = true;
    this.onProgress?.(100);
    console.log('Pedestrian simulation fully initialized with all paths computed');
  }

  private async computeAllPathsWithWorker() {
    if (!this.worker) return;
    
    console.log('Computing paths using Web Worker...');
    
    this.worker.postMessage({
      type: 'COMPUTE_PATHS',
      data: {
        graphData: this.graph.export(),
        nodes: this.nodeKeys
      }
    });
  }

  public async computeAllPaths(): Promise<void> {
    if (this.useWorker && this.worker) {
      await this.computeAllPathsWithWorker();
    } else {
      await this.computeAllPathsAsync();
    }
  }

  public step() {
    this.tickCount++;
    for (const ped of this.pedestrians) {
      // If at the end of the path, pick a new destination
      if (ped.pathIndex >= ped.path.length - 1) {
        let newDest = this.getRandomNode();
        while (newDest === ped.currentNode) newDest = this.getRandomNode();
        const newPath = this.findShortestPath(ped.currentNode, newDest);
        ped.destinationNode = newDest;
        ped.path = newPath;
        ped.pathIndex = 0;
        ped.progress = 0;
      }
      // Get current and next node
      const nodeA = this.graph.getNodeAttributes(ped.path[ped.pathIndex]);
      const nodeB = this.graph.getNodeAttributes(ped.path[ped.pathIndex + 1]);
      // Calculate edge length (meters)
      const edgeLength = haversine(nodeA.lat, nodeA.lng, nodeB.lat, nodeB.lng);
      // Increment progress
      const stepDist = ped.speed * this.tickDuration;
      const progressDelta = stepDist / edgeLength;
      ped.progress += progressDelta;
      if (ped.progress >= 1) {
        // Move to next edge
        ped.pathIndex++;
        ped.currentNode = ped.path[ped.pathIndex];
        ped.progress = 0;
      }
    }
  }

  public getPedestrianPositions() {
    return this.pedestrians.map(ped => {
      // If at the end of the path, just use the node position
      if (ped.pathIndex >= ped.path.length - 1) {
        const nodeAttrs = this.graph.getNodeAttributes(ped.currentNode);
        return {
          id: ped.id,
          lat: nodeAttrs.lat,
          lng: nodeAttrs.lng,
          currentNode: ped.currentNode,
          destinationNode: ped.destinationNode
        };
      }
      // Interpolate between current and next node
      const nodeA = this.graph.getNodeAttributes(ped.path[ped.pathIndex]);
      const nodeB = this.graph.getNodeAttributes(ped.path[ped.pathIndex + 1]);
      const lat = (1 - ped.progress) * nodeA.lat + ped.progress * nodeB.lat;
      const lng = (1 - ped.progress) * nodeA.lng + ped.progress * nodeB.lng;
      return {
        id: ped.id,
        lat,
        lng,
        currentNode: ped.currentNode,
        destinationNode: ped.destinationNode
      };
    });
  }

  public reset(pedestrianCount: number = 1000) {
    this.pathCache.clear();
    this.isInitialized = false;
    this.initializePedestriansBasic(pedestrianCount);
    this.tickCount = 0;
    this.loadOrComputePathsAsync();
  }

  public getTickCount() {
    return this.tickCount;
  }

  public isFullyInitialized(): boolean {
    return this.isInitialized;
  }

  public clearCache(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY);
      this.globalPathMatrix = {};
      console.log('Path cache cleared');
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  public cleanup(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
} 